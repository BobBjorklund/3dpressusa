"""
check_images.py
Queries the DB and produces a per-collection matrix:
  rows    = item prefixes  (army, navy, police, fire …)
  columns = product lines  (camo-trad, camo-urban …)
  cells   = hero / assembled / in-use image status

Flags:
  --fill-test   Copy airforce-camo-trad.3mf and army-camo-trad-hero.png to
                every missing slug so you can test with no 404s.
  --undo-test   Remove those test copies (leaves originals intact).
"""

import argparse
import shutil
import re
import sys
from pathlib import Path

# ── 1. Load DATABASE_URL from .env ───────────────────────────────────────────

def load_env(path=".env"):
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r"^([A-Z_][A-Z0-9_]*)=['\"]?(.+?)['\"]?$", line)
                if m:
                    env[m.group(1)] = m.group(2)
    except FileNotFoundError:
        sys.exit(f"No .env found at {path}")
    return env

parser = argparse.ArgumentParser()
parser.add_argument("--fill-test", action="store_true", help="Copy test assets to every missing slug")
parser.add_argument("--undo-test", action="store_true", help="Remove test copies")
args = parser.parse_args()

env = load_env()
DATABASE_URL = env.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("DATABASE_URL not found in .env")

# psycopg2 on Windows can't verify Neon's cert — downgrade to require (still encrypted)
DATABASE_URL = re.sub(r"sslmode=[\w-]+", "sslmode=require", DATABASE_URL)
DATABASE_URL = re.sub(r"&?sslrootcert=[^&]+", "", DATABASE_URL)
DATABASE_URL = re.sub(r"&?channel_binding=require", "", DATABASE_URL)

# ── 2. Connect and query ──────────────────────────────────────────────────────

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("psycopg2 not installed — run: pip install psycopg2-binary")

conn = psycopg2.connect(DATABASE_URL)
cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

cur.execute("""
    SELECT
        c.slug  AS col_slug,
        c.name  AS col_name,
        i.slug  AS item_slug,
        i.name  AS item_name,
        i."heroOverride",
        i."assembledOverride",
        i."inUseOverride"
    FROM "Collection" c
    JOIN "Item" i ON i."collectionId" = c.id
    WHERE c.active = true AND i.active = true
    ORDER BY c."sortOrder", i."sortOrder"
""")
rows = cur.fetchall()
conn.close()

# ── 3. Resolve expected image paths ──────────────────────────────────────────

PUBLIC = Path(__file__).parent / "public"

def exists(path_str):
    return (PUBLIC / path_str.lstrip("/")).exists()

def img_status(slug, override, suffix):
    path = override if override else f"/items/{slug}-{suffix}.png"
    return ("✓", path) if exists(path) else ("✗", path)

# ── 4. Build per-collection data ──────────────────────────────────────────────

from collections import defaultdict

# { col_slug: { (prefix, product_line): {hero, assembled, in_use} } }
collections = defaultdict(dict)
col_names   = {}

for r in rows:
    col_slug   = r["col_slug"]
    col_names[col_slug] = r["col_name"]

    item_slug  = r["item_slug"]
    # split slug into prefix (first segment) + product_line (the rest)
    parts = item_slug.split("-", 1)
    prefix       = parts[0]
    product_line = parts[1] if len(parts) > 1 else "(none)"

    hero_ok,     hero_path     = img_status(item_slug, r["heroOverride"],      "hero")
    asm_ok,      asm_path      = img_status(item_slug, r["assembledOverride"], "assembled")
    inuse_ok,    inuse_path    = img_status(item_slug, r["inUseOverride"],     "in-use")

    collections[col_slug][(prefix, product_line)] = {
        "item_name":  r["item_name"],
        "hero":       (hero_ok,  hero_path),
        "assembled":  (asm_ok,   asm_path),
        "in_use":     (inuse_ok, inuse_path),
    }

# ── 5. Print matrix ───────────────────────────────────────────────────────────

IMGS = ["hero", "assembled", "in_use"]
IMG_LABELS = {"hero": "Hero", "assembled": "Assembled", "in_use": "In-Use"}

missing = []  # collect all missing paths for the final checklist

for col_slug, items in collections.items():
    print(f"\n{'═'*70}")
    print(f"  COLLECTION: {col_names[col_slug]}  ({col_slug})")
    print(f"{'═'*70}")

    # derive unique product lines (columns) and prefixes (rows)
    prefixes      = sorted({k[0] for k in items})
    product_lines = sorted({k[1] for k in items})

    # header
    col_w = 14
    header = f"{'':18}" + "".join(f"{pl:^{col_w}}" for pl in product_lines)
    print(header)
    print(f"{'':18}" + "-" * (col_w * len(product_lines)))

    for prefix in prefixes:
        # one row per image type per prefix
        for img in IMGS:
            row_label = f"{prefix:<10} {IMG_LABELS[img]:<7}" if img == "hero" else f"{'':10} {IMG_LABELS[img]:<7}"
            cells = []
            for pl in product_lines:
                key = (prefix, pl)
                if key in items:
                    status, path = items[key][img]
                    cells.append(f"{status:^{col_w}}")
                    if status == "✗":
                        missing.append(path)
                else:
                    cells.append(f"{'—':^{col_w}}")
            print(row_label + "".join(cells))
        print()  # blank line between prefixes

# ── 6. Missing-image checklist ────────────────────────────────────────────────

print(f"\n{'═'*70}")
print("  MISSING IMAGES CHECKLIST")
print(f"{'═'*70}")
if not missing:
    print("  All images present!")
else:
    for path in sorted(set(missing)):
        print(f"  [ ] {path}")

print(f"\nTotal missing: {len(set(missing))}")

# ── 7. Summary table ──────────────────────────────────────────────────────────

print(f"\n{'═'*70}")
print("  SUMMARY BY COLLECTION")
print(f"{'═'*70}")
print(f"  {'Collection':<30} {'Items':>5}  {'Have all':>8}  {'Partial':>7}  {'Empty':>5}")
print(f"  {'-'*30} {'-'*5}  {'-'*8}  {'-'*7}  {'-'*5}")

for col_slug, items in collections.items():
    total = len(items)
    all_good = sum(
        1 for v in items.values()
        if v["hero"][0] == "✓" and v["assembled"][0] == "✓" and v["in_use"][0] == "✓"
    )
    empty = sum(
        1 for v in items.values()
        if v["hero"][0] == "✗" and v["assembled"][0] == "✗" and v["in_use"][0] == "✗"
    )
    partial = total - all_good - empty
    print(f"  {col_names[col_slug]:<30} {total:>5}  {all_good:>8}  {partial:>7}  {empty:>5}")

# ── 8. Fill / undo test assets ────────────────────────────────────────────────

SRC_3MF = PUBLIC / "items" / "airforce-camo-trad.3mf"
SRC_PNG = PUBLIC / "items" / "army-camo-trad-hero.png"
ORIGINALS = {SRC_3MF.name, SRC_PNG.name}

all_slugs = [r["item_slug"] for r in rows]

if args.fill_test:
    if not SRC_3MF.exists():
        sys.exit(f"\nSource 3MF not found: {SRC_3MF}")
    if not SRC_PNG.exists():
        sys.exit(f"\nSource PNG not found: {SRC_PNG}")
    c3mf = cpng = skipped = 0
    for slug in all_slugs:
        dest_3mf = PUBLIC / "items" / f"{slug}.3mf"
        dest_png = PUBLIC / "items" / f"{slug}-hero.png"
        if not dest_3mf.exists():
            shutil.copy2(SRC_3MF, dest_3mf)
            c3mf += 1
        else:
            skipped += 1
        if not dest_png.exists():
            shutil.copy2(SRC_PNG, dest_png)
            cpng += 1
        else:
            skipped += 1
    print(f"\n[fill-test] Created {c3mf} .3mf + {cpng} -hero.png  |  skipped {skipped} (already existed)")

if args.undo_test:
    removed = 0
    for slug in all_slugs:
        for dest in [PUBLIC / "items" / f"{slug}.3mf", PUBLIC / "items" / f"{slug}-hero.png"]:
            if dest.exists() and dest.name not in ORIGINALS:
                dest.unlink()
                removed += 1
    print(f"\n[undo-test] Removed {removed} test files.")
