"""
deactivate_items.py
Marks out-of-scope items as active=false based on product line decisions.
Dry-run by default — pass --apply to commit changes.
"""

import re
import sys
from pathlib import Path

# ── Load .env ─────────────────────────────────────────────────────────────────

def load_env(path=".env"):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^([A-Z_][A-Z0-9_]*)=['\"]?(.+?)['\"]?$", line)
            if m:
                env[m.group(1)] = m.group(2)
    return env

env = load_env()
DATABASE_URL = env["DATABASE_URL"]
DATABASE_URL = re.sub(r"sslmode=[\w-]+", "sslmode=require", DATABASE_URL)
DATABASE_URL = re.sub(r"&?sslrootcert=[^&]+", "", DATABASE_URL)
DATABASE_URL = re.sub(r"&?channel_binding=require", "", DATABASE_URL)

# ── Rules ─────────────────────────────────────────────────────────────────────
# Each entry: ("description", SQL LIKE pattern against item slug)

DEACTIVATE_RULES = [
    # Redundant family lines — parent covers both
    ("mom items",           "%-mom"),
    ("dad items",           "%-dad"),
    # Redundant tribute line — honor-fallen stays
    ("memory-fallen items", "%-memory-fallen"),
    # Branches being cut entirely
    ("health-care branch",  "health-care-%"),
    ("dispatch branch",     "dispatch-%"),
    # Flag designs moving to patriot — remove from heroes
    ("flag-shield items",   "%-flag-shield"),
    ("shield-flag items",   "%-shield-flag"),
]

# ── Connect ───────────────────────────────────────────────────────────────────

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("pip install psycopg2-binary")

apply = "--apply" in sys.argv
conn  = psycopg2.connect(DATABASE_URL)
cur   = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

print(f"\n{'DRY RUN — pass --apply to commit' if not apply else '⚠  APPLYING CHANGES'}")
print("═" * 55)

total = 0
for label, pattern in DEACTIVATE_RULES:
    cur.execute(
        'SELECT id, slug FROM "Item" WHERE slug LIKE %s AND active = true',
        (pattern,)
    )
    items = cur.fetchall()
    count = len(items)
    total += count
    status = "would deactivate" if not apply else "deactivating"
    print(f"  {label:<25} {status} {count:>3} item(s)")
    if count and not apply:
        for row in items:
            print(f"    - {row['slug']}")

print(f"{'─'*55}")
print(f"  {'Total':25} {total:>3} item(s)\n")

if apply:
    for label, pattern in DEACTIVATE_RULES:
        cur.execute(
            'UPDATE "Item" SET active = false, "updatedAt" = NOW() WHERE slug LIKE %s AND active = true',
            (pattern,)
        )
    conn.commit()
    print("  Done. Run check_images.py to verify new scope.")
else:
    print("  Run with --apply to commit these changes.")

conn.close()
