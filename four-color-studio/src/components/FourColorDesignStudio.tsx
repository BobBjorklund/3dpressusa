"use client";

import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

type ToolMode = "select" | "fill" | "text" | "rect" | "circle" | "triangle";
type ShapeItem =
  | {
    id: string;
    kind: "rect";
    x: number;
    y: number;
    w: number;
    h: number;
    colorId: string;
    rotation: number;
    z: number;
  }
  | {
    id: string;
    kind: "circle";
    x: number;
    y: number;
    w: number;
    h: number;
    colorId: string;
    z: number;
  }
  | {
    id: string;
    kind: "triangle";
    x: number;
    y: number;
    w: number;
    h: number;
    colorId: string;
    rotation: number;
    z: number;
  };
type InventoryColor = {
  id: string;
  name: string;
  hex: string;
};
type PaletteSuggestion = {
  id: string;
  label: string;
  colorIds: string[];
  previewDataUrl: string;
  score: number;
};
const REG_MARK_SIZE_MM = 2; // tiny corner square
type Rgb = {
  r: number;
  g: number;
  b: number;
};
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f1f5f9",
  borderRadius: "12px",
  padding: "10px 12px",
  outline: "none",
};
type TextOverlay = {
  id: string;
  value: string;
  x: number;
  y: number;
  size: number;
  colorId: string;
  fontFamily: string;
  weight: string;
};

function removeTinyRuns(imageData: ImageData, minRun = 1): ImageData {
  const { width, height, data } = imageData;

  for (let y = 0; y < height; y += 1) {
    // Pass 1: collect all runs in this row as {start, end (exclusive), color[4]}
    type RowRun = { start: number; end: number; color: [number, number, number, number] };
    const runs: RowRun[] = [];
    let runStart = 0;
    for (let x = 1; x <= width; x += 1) {
      const prevI = (y * width + (x - 1)) * 4;
      const changed =
        x === width ||
        data[prevI] !== data[(y * width + x) * 4] ||
        data[prevI + 1] !== data[(y * width + x) * 4 + 1] ||
        data[prevI + 2] !== data[(y * width + x) * 4 + 2] ||
        data[prevI + 3] !== data[(y * width + x) * 4 + 3];
      if (changed) {
        runs.push({
          start: runStart,
          end: x,
          color: [data[prevI], data[prevI + 1], data[prevI + 2], data[prevI + 3]],
        });
        runStart = x;
      }
    }

    // Pass 2: for each short run, replace with the longer neighboring run's color.
    // If a neighbor is also short, still prefer the one with opaque color.
    for (let ri = 0; ri < runs.length; ri += 1) {
      const run = runs[ri];
      if (run.end - run.start >= minRun) continue;

      const leftRun = ri > 0 ? runs[ri - 1] : null;
      const rightRun = ri < runs.length - 1 ? runs[ri + 1] : null;

      let replacement: [number, number, number, number] | null = null;

      if (leftRun && rightRun) {
        // Pick the longer neighbor; prefer opaque over transparent
        const leftLen = leftRun.end - leftRun.start;
        const rightLen = rightRun.end - rightRun.start;
        const leftOpaque = leftRun.color[3] > 0;
        const rightOpaque = rightRun.color[3] > 0;
        if (leftOpaque && !rightOpaque) replacement = leftRun.color;
        else if (rightOpaque && !leftOpaque) replacement = rightRun.color;
        else replacement = leftLen >= rightLen ? leftRun.color : rightRun.color;
      } else if (leftRun) {
        replacement = leftRun.color;
      } else if (rightRun) {
        replacement = rightRun.color;
      }

      if (replacement) {
        for (let xx = run.start; xx < run.end; xx += 1) {
          const i = (y * width + xx) * 4;
          data[i] = replacement[0];
          data[i + 1] = replacement[1];
          data[i + 2] = replacement[2];
          data[i + 3] = replacement[3];
        }
      }
    }
  }

  return imageData;
}
function dedupePaletteSuggestions(suggestions: PaletteSuggestion[]): PaletteSuggestion[] {
  const seen = new Set<string>();

  return suggestions.filter((s) => {
    const key = [...s.colorIds].sort().join("|"); // order-independent
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function getFloodRegionMask(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number
): Uint8Array {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const startIndex = (startY * width + startX) * 4;

  const target = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];

  const visited = new Uint8Array(width * height);
  const stack: number[] = [startX, startY];

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const idx = y * width + x;

    if (visited[idx]) continue;
    visited[idx] = 1;

    const i = idx * 4;

    if (
      data[i] !== target[0] ||
      data[i + 1] !== target[1] ||
      data[i + 2] !== target[2] ||
      data[i + 3] !== target[3]
    ) continue;

    if (x > 0) stack.push(x - 1, y);
    if (x < width - 1) stack.push(x + 1, y);
    if (y > 0) stack.push(x, y - 1);
    if (y < height - 1) stack.push(x, y + 1);
  }

  return visited;
}
type Lab = { l: number; a: number; b: number };

function rgbToXyz({ r, g, b }: Rgb) {
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v > 0.04045
      ? Math.pow((v + 0.055) / 1.055, 2.4)
      : v / 12.92;
  });

  const [R, G, B] = srgb;

  return {
    x: R * 0.4124 + G * 0.3576 + B * 0.1805,
    y: R * 0.2126 + G * 0.7152 + B * 0.0722,
    z: R * 0.0193 + G * 0.1192 + B * 0.9505,
  };
}

function xyzToLab({ x, y, z }: { x: number; y: number; z: number }): Lab {
  const refX = 0.95047;
  const refY = 1.00000;
  const refZ = 1.08883;

  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x / refX);
  const fy = f(y / refY);
  const fz = f(z / refZ);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function rgbToLab(rgb: Rgb): Lab {
  return xyzToLab(rgbToXyz(rgb));
}

function labDist(a: Lab, b: Lab): number {
  return (a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2;
}



const MIN_FEATURE_MM = 0.42;
const TILE_SIZE_MM = 101.6;
const CANVAS_SIZE = Math.round(TILE_SIZE_MM / MIN_FEATURE_MM); // 508
const GRID_STEP = 1; // one canvas pixel = one printable feature

function snapToGrid(value: number): number {
  return Math.round(value / GRID_STEP) * GRID_STEP;
}

function snapPoint(point: { x: number; y: number }) {
  return {
    x: snapToGrid(point.x),
    y: snapToGrid(point.y),
  };
}
const MAX_SELECTED = 4;
const DEFAULT_TEXT = {
  value: "",
  x: CANVAS_SIZE / 2,
  y: CANVAS_SIZE / 2,
  size: 32,
  colorId: "",
  fontFamily: "Arial",
  weight: "400",
};

function makeTextOverlay(partial?: Partial<TextOverlay>): TextOverlay {
  return {
    id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...DEFAULT_TEXT,
    ...partial,
  };
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
}

function colorDist(a: Rgb, b: Rgb): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function nearest(rgb: Rgb, palette: InventoryColor[]): InventoryColor {
  if (palette.length === 0) {
    throw new Error("nearest() called with empty palette");
  }

  const lab = rgbToLab(rgb);

  let best = palette[0];
  let bestD = Infinity;

  for (const c of palette) {
    const d = labDist(lab, rgbToLab(hexToRgb(c.hex)));
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }

  return best;
}

function quantize(imageData: ImageData, palette: InventoryColor[]): ImageData {
  if (palette.length === 0) {
    return imageData;
  }

  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;

    const c = nearest(
      { r: d[i], g: d[i + 1], b: d[i + 2] },
      palette,
    );
    const rgb = hexToRgb(c.hex);

    d[i] = rgb.r;
    d[i + 1] = rgb.g;
    d[i + 2] = rgb.b;
    d[i + 3] = 255;
  }

  return imageData;
}

function drawChecker(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const s = 32;

  for (let y = 0; y < h; y += s) {
    for (let x = 0; x < w; x += s) {
      ctx.fillStyle = (x / s + y / s) % 2 === 0 ? "#141922" : "#0F131A";
      ctx.fillRect(x, y, s, s);
    }
  }
}
function drawShapeSelectionBox(
  ctx: CanvasRenderingContext2D,
  shape: ShapeItem,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
  ctx.setLineDash([]);
  ctx.restore();
}
function fitRect(sw: number, sh: number, tw: number, th: number) {
  const sr = sw / sh;
  const tr = tw / th;

  let dw = tw;
  let dh = th;
  let ox = 0;
  let oy = 0;

  if (sr > tr) {
    dh = th;
    dw = dh * sr;
    ox = (tw - dw) / 2;
  } else {
    dw = tw;
    dh = dw / sr;
    oy = (th - dh) / 2;
  }

  return { dw, dh, ox, oy };
}

function getCanvasPoint(e: MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: snapToGrid(
      Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * scaleX)))
    ),
    y: snapToGrid(
      Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * scaleY)))
    ),
  };
}

function floodFillRegion(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  replacement: InventoryColor,
): boolean {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startIndex = (startY * width + startX) * 4;

  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  const fill = hexToRgb(replacement.hex);

  if (
    targetR === fill.r &&
    targetG === fill.g &&
    targetB === fill.b &&
    targetA === 255
  ) {
    return false;
  }

  const stack: number[] = [startX, startY];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;

    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) continue;
    visited[pixelIndex] = 1;

    const i = pixelIndex * 4;
    if (
      data[i] !== targetR ||
      data[i + 1] !== targetG ||
      data[i + 2] !== targetB ||
      data[i + 3] !== targetA
    ) {
      continue;
    }

    data[i] = fill.r;
    data[i + 1] = fill.g;
    data[i + 2] = fill.b;
    data[i + 3] = 255;

    if (x > 0) stack.push(x - 1, y);
    if (x < width - 1) stack.push(x + 1, y);
    if (y > 0) stack.push(x, y - 1);
    if (y < height - 1) stack.push(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  return true;
}

function swapColorGlobal(
  ctx: CanvasRenderingContext2D,
  from: InventoryColor,
  to: InventoryColor,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  const f = hexToRgb(from.hex);
  const t = hexToRgb(to.hex);

  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === f.r && d[i + 1] === f.g && d[i + 2] === f.b && d[i + 3] === 255) {
      d[i] = t.r;
      d[i + 1] = t.g;
      d[i + 2] = t.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function ColorChoiceButton({
  color,
  active,
  disabled = false,
  onClick,
  compact = false,
  subtitle,
}: {
  color: InventoryColor;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  compact?: boolean;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "8px" : "10px",
        background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
        border: active ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: compact ? "12px" : "14px",
        padding: compact ? "10px 12px" : "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        color: "#f1f5f9",
        minWidth: 0,
        textAlign: "left",
        transition: "all .15s",
      }}
    >
      <span
        style={{
          width: compact ? "18px" : "100%",
          height: compact ? "18px" : "36px",
          minWidth: compact ? "18px" : undefined,
          borderRadius: compact ? "6px" : "10px",
          background: color.hex,
          border: "1px solid rgba(0,0,0,0.15)",
          flexShrink: 0,
          display: "block",
          marginBottom: compact ? 0 : "6px",
        }}
      />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: "block",
            fontSize: compact ? "13px" : "11px",
            fontWeight: 600,
            color: "#f1f5f9",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {color.name}
        </span>
        <span
          style={{
            display: "block",
            fontSize: "10px",
            color: "#64748b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle ?? color.hex}
        </span>
      </span>
    </button>
  );
}
export default function FourColorDesignStudio() {
  const [inventoryColors, setInventoryColors] = useState<InventoryColor[]>([]);
  const [showPaletteSuggestions, setShowPaletteSuggestions] = useState(false);
  const [hasDismissedPaletteSuggestions, setHasDismissedPaletteSuggestions] = useState(false);
  const [selIds, setSelIds] = useState<string[]>([]);
  const [bgId, setBgId] = useState<string>("");
  const [fillColorId, setFillColorId] = useState<string>("");
  const [shapeColorId, setShapeColorId] = useState<string>("");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imgName, setImgName] = useState<string>("");

  const [usageVersion, setUsageVersion] = useState(0);
  const [lastEdit, setLastEdit] = useState<string>("No manual edits yet.");
  const [textDraft, setTextDraft] = useState<TextOverlay>(makeTextOverlay());
  const [textItems, setTextItems] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("fill");
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draftShape, setDraftShape] = useState<ShapeItem | null>(null);
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [paletteSuggestions, setPaletteSuggestions] = useState<PaletteSuggestion[]>([]);
  const [swapFromId, setSwapFromId] = useState<string>("");
  const [swapToId, setSwapToId] = useState<string>("");
  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const qRef = useRef<HTMLCanvasElement | null>(null);
  const baseQuantizedRef = useRef<ImageData | null>(null);
  // When true, the next quantize effect run is skipped (used after color swap)
  const skipNextQuantizeRef = useRef(false);

  const selColors = useMemo(
    () => inventoryColors.filter((c) => selIds.includes(c.id)),
    [inventoryColors, selIds],
  );
  function hitTestShape(x: number, y: number): ShapeItem | null {
    for (let i = shapes.length - 1; i >= 0; i -= 1) {
      const shape = shapes[i];

      if (
        x >= shape.x &&
        x <= shape.x + shape.w &&
        y >= shape.y &&
        y <= shape.y + shape.h
      ) {
        return shape;
      }
    }

    return null;
  }
  function drawShapeItem(
    ctx: CanvasRenderingContext2D,
    shape: ShapeItem,
    options?: { ghost?: boolean; selected?: boolean }
  ): void {
    const color = selColors.find((c) => c.id === shape.colorId);
    if (!color) return;

    ctx.save();

    if (options?.ghost) {
      ctx.globalAlpha = 0.45;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = color.hex;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;

    if (shape.kind === "rect") {
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h);

      if (options?.selected) {
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        ctx.setLineDash([]);
      }
    }

    if (shape.kind === "circle") {
      ctx.beginPath();
      ctx.ellipse(
        shape.x + shape.w / 2,
        shape.y + shape.h / 2,
        Math.abs(shape.w / 2),
        Math.abs(shape.h / 2),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (options?.selected) {
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        ctx.setLineDash([]);
      }
    }

    if (shape.kind === "triangle") {
      ctx.beginPath();
      ctx.moveTo(shape.x + shape.w / 2, shape.y);
      ctx.lineTo(shape.x + shape.w, shape.y + shape.h);
      ctx.lineTo(shape.x, shape.y + shape.h);
      ctx.closePath();
      ctx.fill();

      if (options?.selected) {
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }
  function rankInventoryColorsFromImage(
    imageData: ImageData,
    inventory: InventoryColor[],
  ): { colorId: string; count: number }[] {
    const counts = new Map<string, number>();
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;

      const winner = nearest(
        { r: data[i], g: data[i + 1], b: data[i + 2] },
        inventory,
      );

      counts.set(winner.id, (counts.get(winner.id) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([colorId, count]) => ({ colorId, count }))
      .sort((a, b) => b.count - a.count);
  }

  function buildPaletteSuggestionsFromRanked(
    ranked: { colorId: string; count: number }[],
  ): { label: string; colorIds: string[] }[] {
    const top = ranked.map((x) => x.colorId);

    const uniqueTop4 = top.slice(0, 4);

    const balanced = top.slice(0, 6).filter((id, i, arr) => arr.indexOf(id) === i).slice(0, 4);

    const boldSeed = top.slice(0, 8);
    const bold: string[] = [];

    for (const id of boldSeed) {
      if (bold.length === 0) {
        bold.push(id);
        continue;
      }

      if (!bold.includes(id)) {
        bold.push(id);
      }

      if (bold.length === 4) break;
    }

    return [
      { label: "Closest match", colorIds: uniqueTop4 },
      { label: "Balanced", colorIds: balanced.length === 4 ? balanced : uniqueTop4 },
      { label: "Bold", colorIds: bold.length === 4 ? bold : uniqueTop4 },
    ];
  }

  function makePalettePreviewDataUrl(
    img: HTMLImageElement,
    palette: InventoryColor[],
    bgHex: string,
    size = 220,
  ): string | null {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    drawChecker(ctx, size, size);
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, size, size);

    const { dw, dh, ox, oy } = fitRect(img.width, img.height, size, size);
    ctx.drawImage(img, ox, oy, dw, dh);

    const id = ctx.getImageData(0, 0, size, size);
    ctx.putImageData(quantize(id, palette), 0, 0);

    return canvas.toDataURL("image/png");
  }
  const bgColor = useMemo(
    () => inventoryColors.find((c) => c.id === bgId) ?? inventoryColors[0] ?? null,
    [inventoryColors, bgId],
  );

  const fillColor = useMemo(
    () => selColors.find((c) => c.id === fillColorId) ?? selColors[0] ?? null,
    [selColors, fillColorId],
  );

  const textColor = useMemo(
    () => selColors.find((c) => c.id === textDraft.colorId) ?? selColors[0] ?? null,
    [selColors, textDraft.colorId],
  );

  const selectedText = useMemo(
    () => textItems.find((item) => item.id === selectedTextId) ?? null,
    [textItems, selectedTextId],
  );

  const usage = useMemo(() => {
    const canvas = qRef.current;
    if (!canvas) return [];

    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const counts = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }

    const total = canvas.width * canvas.height;

    return selColors
      .map((c) => ({
        color: c,
        pixels: counts.get(c.hex.toUpperCase()) ?? 0,
        pct: total === 0 ? 0 : ((counts.get(c.hex.toUpperCase()) ?? 0) / total) * 100,
      }))
      .filter((e) => e.pixels > 0)
      .sort((a, b) => b.pixels - a.pixels);
  }, [selColors, usageVersion]);

  useEffect(() => {
    if (inventoryColors.length === 0) return;

    setSelIds((cur) => {
      if (cur.length > 0) {
        return cur.filter((id) => inventoryColors.some((c) => c.id === id));
      }

      return inventoryColors.slice(0, 4).map((c) => c.id);
    });

    setBgId((cur) =>
      cur && inventoryColors.some((c) => c.id === cur)
        ? cur
        : inventoryColors[0]?.id ?? ""
    );

    setFillColorId((cur) =>
      cur && inventoryColors.some((c) => c.id === cur)
        ? cur
        : inventoryColors[0]?.id ?? ""
    );

    setShapeColorId((cur) =>
      cur && inventoryColors.some((c) => c.id === cur)
        ? cur
        : inventoryColors[0]?.id ?? ""
    );

    setTextDraft((cur) => ({
      ...cur,
      colorId:
        cur.colorId && inventoryColors.some((c) => c.id === cur.colorId)
          ? cur.colorId
          : inventoryColors[0]?.id ?? "",
    }));
  }, [inventoryColors]);

  useEffect(() => {
    fetch("/api/inventory-colors", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: InventoryColor[]) => {
        setInventoryColors(data);
      });
  }, []);
  useEffect(() => {
    if (!img || !bgColor || inventoryColors.length === 0) {
      setPaletteSuggestions([]);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawChecker(ctx, 160, 160);
    ctx.fillStyle = bgColor.hex;
    ctx.fillRect(0, 0, 160, 160);

    const { dw, dh, ox, oy } = fitRect(img.width, img.height, 160, 160);
    ctx.drawImage(img, ox, oy, dw, dh);

    const id = ctx.getImageData(0, 0, 160, 160);

    const ranked = rankInventoryColorsFromImage(id, inventoryColors);
    const candidates = buildPaletteSuggestionsFromRanked(ranked);

    const suggestions: PaletteSuggestion[] = candidates
      .map((candidate, index) => {
        const palette = inventoryColors.filter((c) => candidate.colorIds.includes(c.id));
        const previewDataUrl = makePalettePreviewDataUrl(img, palette, bgColor.hex, 220);

        if (!previewDataUrl || palette.length !== 4) return null;

        return {
          id: `suggestion-${index}`,
          label: candidate.label,
          colorIds: candidate.colorIds,
          previewDataUrl,
          score: 100 - index,
        };
      })
      .filter((x): x is PaletteSuggestion => Boolean(x));

    setPaletteSuggestions(dedupePaletteSuggestions(suggestions));
  }, [img, bgColor, inventoryColors]);
  useEffect(() => {
    if (!selColors.some((c) => c.id === fillColorId) && selColors[0]) {
      setFillColorId(selColors[0].id);
    }

    if (!selColors.some((c) => c.id === bgId) && selColors[0]) {
      setBgId(selColors[0].id);
    }

    if (!selColors.some((c) => c.id === textDraft.colorId) && selColors[0]) {
      setTextDraft((cur) => ({ ...cur, colorId: selColors[0].id }));
    }

    setTextItems((cur) =>
      cur.map((item) =>
        selColors.some((c) => c.id === item.colorId)
          ? item
          : { ...item, colorId: selColors[0]?.id ?? item.colorId },
      ),
    );
  }, [selColors, fillColorId, bgId, textDraft.colorId]);

  function setToolModeSafe(next: ToolMode) {
    setToolMode(next);

    if (next !== "select") {
      setSelectedShapeId(null);
      setSelectedTextId(null);
    }
  }
  function drawBaseOnto(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.imageSmoothingEnabled = false;

    if (baseQuantizedRef.current) {
      ctx.putImageData(baseQuantizedRef.current, 0, 0);
      return;
    }

    drawChecker(ctx, CANVAS_SIZE, CANVAS_SIZE);

    if (!bgColor) return;

    ctx.fillStyle = bgColor.hex;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  function drawTextItem(
    ctx: CanvasRenderingContext2D,
    item: TextOverlay,
    options?: { ghost?: boolean; selected?: boolean },
  ): void {
    if (!item.value.trim()) return;

    const color = selColors.find((c) => c.id === item.colorId);
    if (!color) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${item.weight} ${item.size}px ${item.fontFamily}`;
    ctx.fillStyle = color.hex;

    if (options?.ghost) {
      ctx.globalAlpha = 0.45;
    }

    ctx.fillText(item.value, item.x, item.y);

    if (options?.selected) {
      const metrics = ctx.measureText(item.value);
      const width = metrics.width + 24;
      const height = item.size + 24;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(item.x - width / 2, item.y - height / 2, width, height);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function redrawQuantizedCanvas(options?: { ghostDraftAt?: { x: number; y: number } | null }) {
    const qc = qRef.current;
    if (!qc) return;

    const ctx = qc.getContext("2d");
    if (!ctx) return;

    drawBaseOnto(ctx);

    if (toolMode === "fill" && hoverPoint && fillColor) {
      const mask = getFloodRegionMask(ctx, hoverPoint.x, hoverPoint.y);

      const overlay = ctx.getImageData(0, 0, qc.width, qc.height);
      const d = overlay.data;

      for (let i = 0; i < mask.length; i += 1) {
        if (!mask[i]) continue;

        const idx = i * 4;
        d[idx] = 255;
        d[idx + 1] = 255;
        d[idx + 2] = 255;
        d[idx + 3] = 80;
      }

      ctx.putImageData(overlay, 0, 0);
    }

    for (const shape of [...shapes].sort((a, b) => a.z - b.z)) {
      drawShapeItem(ctx, shape);
    }

    if (draftShape) {
      drawShapeItem(ctx, draftShape, { ghost: true });
    }

    for (const item of textItems) {
      drawTextItem(ctx, item, { selected: item.id === selectedTextId });
    }

    if (selectedShapeId) {
      const selectedShape = shapes.find((shape) => shape.id === selectedShapeId);
      if (selectedShape) {
        drawShapeSelectionBox(ctx, selectedShape);
      }
    }

    if (options?.ghostDraftAt && toolMode === "text" && textDraft.value.trim()) {
      drawTextItem(
        ctx,
        { ...textDraft, x: options.ghostDraftAt.x, y: options.ghostDraftAt.y },
        { ghost: true },
      );
    }
  }

  function buildExportCanvas(): HTMLCanvasElement | null {
    if (typeof document === "undefined") return null;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return null;

    drawBaseOnto(exportCtx);

    for (const shape of [...shapes].sort((a, b) => a.z - b.z)) {
      drawShapeItem(exportCtx, shape);
    }

    for (const item of textItems) {
      drawTextItem(exportCtx, item);
    }

    return exportCanvas;
  }

  async function downloadLayeredSvgZip(): Promise<void> {
    const exportCanvas = buildExportCanvas();
    if (!exportCanvas) return;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    const exportImageData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
    const cleaned = removeTinyRuns(exportImageData, 2);
    exportCtx.putImageData(cleaned, 0, 0);

    const { data, width, height } = exportCtx.getImageData(
      0,
      0,
      exportCanvas.width,
      exportCanvas.height,
    );

    const mmPerPixel = TILE_SIZE_MM / CANVAS_SIZE;
    const zip = new JSZip();

    const escapeXml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");

    const safeName = (imgName || "design")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const safeFilePart = (value: string) =>
      value
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

    const usedColors = selColors.filter((color) => {
      const rgb = hexToRgb(color.hex);
      for (let i = 0; i < data.length; i += 4) {
        if (
          data[i + 3] > 0 &&
          data[i] === rgb.r &&
          data[i + 1] === rgb.g &&
          data[i + 2] === rgb.b
        ) {
          return true;
        }
      }
      return false;
    });

    if (usedColors.length === 0) {
      setLastEdit("No used colors found to export.");
      return;
    }

    const svgFileNames: string[] = [];

    for (const color of usedColors) {
      const rgb = hexToRgb(color.hex);
      const svgParts: string[] = [];

      const safeColorPart = safeFilePart(color.id || color.name || color.hex);
      const svgFileName = `${safeName}-${safeColorPart}.svg`;
      svgFileNames.push(svgFileName);

      svgParts.push(
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<svg xmlns="http://www.w3.org/2000/svg" width="4in" height="4in" viewBox="0 0 ${TILE_SIZE_MM} ${TILE_SIZE_MM}" shape-rendering="crispEdges">`,
        `<title>${escapeXml(`${safeName}-${safeColorPart}`)}</title>`,
        `<desc>${escapeXml(`Single-color layer export for ${color.name} (${color.hex}).`)}</desc>`,
      );

      svgParts.push(
        `<rect x="0" y="${(TILE_SIZE_MM - REG_MARK_SIZE_MM).toFixed(4)}" width="${REG_MARK_SIZE_MM}" height="${REG_MARK_SIZE_MM}" fill="${color.hex}"/>`
      );

      // Collect horizontal runs, then merge vertically adjacent runs with
      // the same x-start and width. Reduces rect count from O(pixels) to
      // O(distinct rectangular regions), dramatically simplifying the
      // geometry that Shapely and the slicer have to process.
      type MergedRect = { x: number; y: number; w: number; h: number };
      const mergedRects: MergedRect[] = [];
      // open[key] = the last MergedRect still being extended downward
      const open = new Map<string, MergedRect>();

      for (let y = 0; y < height; y += 1) {
        let runStart = -1;
        for (let x = 0; x <= width; x += 1) {
          const isEnd = x === width;
          let matches = false;
          if (!isEnd) {
            const idx = (y * width + x) * 4;
            matches =
              data[idx + 3] > 0 &&
              data[idx] === rgb.r &&
              data[idx + 1] === rgb.g &&
              data[idx + 2] === rgb.b;
          }
          if (matches && runStart < 0) runStart = x;
          if ((!matches || isEnd) && runStart >= 0) {
            const runW = x - runStart;
            const key = `${runStart},${runW}`;
            const prev = open.get(key);
            if (prev && prev.y + prev.h === y) {
              prev.h += 1; // extend existing rect downward
            } else {
              const rect: MergedRect = { x: runStart, y, w: runW, h: 1 };
              mergedRects.push(rect);
              open.set(key, rect);
            }
            runStart = -1;
          }
        }
      }

      for (const r of mergedRects) {
        svgParts.push(
          `<rect x="${(r.x * mmPerPixel).toFixed(4)}" y="${(r.y * mmPerPixel).toFixed(4)}" width="${(r.w * mmPerPixel).toFixed(4)}" height="${(r.h * mmPerPixel).toFixed(4)}" fill="#000000"/>`,
        );
      }

      svgParts.push(`</svg>`);

      zip.file(svgFileName, svgParts.join(""));
    }

    const svgArgs = svgFileNames
      .map((fileName) => `  --svg "${fileName}" ^`)
      .join("\n");

    const batContent = `@echo off
echo Building 3MF for ${safeName}...

python ..\\svg_stack_to_placard_3mf.py ^
  --placard ..\\placard.stl ^
${svgArgs}
  --output "${safeName}.3mf"

echo Done.
pause
`;

    zip.file(`${safeName}.bat`, batContent);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName || "design"}-svg-layers.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setLastEdit(`Layered SVG zip exported: ${safeName || "design"}-svg-layers.zip`);
  }

  useEffect(() => {
    if (skipNextQuantizeRef.current) {
      skipNextQuantizeRef.current = false;
      return;
    }

    const sc = srcRef.current;
    const qc = qRef.current;
    if (!sc || !qc) return;
    if (!bgColor) return;
    if (inventoryColors.length === 0) return;

    const sCtx = sc.getContext("2d");
    const qCtx = qc.getContext("2d");
    if (!sCtx || !qCtx) return;

    sc.width = CANVAS_SIZE;
    sc.height = CANVAS_SIZE;
    qc.width = CANVAS_SIZE;
    qc.height = CANVAS_SIZE;

    drawChecker(sCtx, CANVAS_SIZE, CANVAS_SIZE);
    sCtx.fillStyle = bgColor.hex;
    sCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawChecker(qCtx, CANVAS_SIZE, CANVAS_SIZE);
    qCtx.fillStyle = bgColor.hex;
    qCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (!img) {
      baseQuantizedRef.current = qCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      setUsageVersion((v) => v + 1);
      setLastEdit("No manual edits yet.");
      return;
    }

    const { dw, dh, ox, oy } = fitRect(img.width, img.height, CANVAS_SIZE, CANVAS_SIZE);

    sCtx.imageSmoothingEnabled = false;
    sCtx.drawImage(img, ox, oy, dw, dh);
    const id = sCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const quantized = quantize(id, selColors);
    qCtx.putImageData(quantized, 0, 0);
    baseQuantizedRef.current = qCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    setUsageVersion((v) => v + 1);
    setLastEdit("No manual edits yet.");

  }, [img, selColors, bgColor]);

  function toggleColor(id: string): void {
    setSelIds((cur) => {
      if (cur.includes(id)) {
        return cur.length === 1 ? cur : cur.filter((x) => x !== id);
      }
      if (cur.length >= MAX_SELECTED) return cur;
      return [...cur, id];
    });
  }

  function onUpload(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setImg(image);
      setImgName(file.name);
      setShowPaletteSuggestions(true);
      setHasDismissedPaletteSuggestions(false);
      URL.revokeObjectURL(url);
    };

    image.src = url;
  }

  function resetQuantizedImage(): void {
    const sc = srcRef.current;
    const qc = qRef.current;
    if (!sc || !qc || !img || !bgColor || selColors.length === 0) return;
    const sCtx = sc.getContext("2d");
    const qCtx = qc.getContext("2d");
    if (!sCtx || !qCtx) return;

    drawChecker(sCtx, CANVAS_SIZE, CANVAS_SIZE);
    drawChecker(qCtx, CANVAS_SIZE, CANVAS_SIZE);

    sCtx.fillStyle = bgColor.hex;
    sCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    qCtx.fillStyle = bgColor.hex;
    qCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const { dw, dh, ox, oy } = fitRect(img.width, img.height, CANVAS_SIZE, CANVAS_SIZE);

    sCtx.imageSmoothingEnabled = false;
    sCtx.drawImage(img, ox, oy, dw, dh);
    const id = sCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    qCtx.putImageData(quantize(id, selColors), 0, 0);
    baseQuantizedRef.current = qCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    setTextItems([]);
    setSelectedTextId(null);
    setHoverPoint(null);
    setTextDraft(makeTextOverlay({ colorId: selColors[0]?.id ?? DEFAULT_TEXT.colorId }));
    setUsageVersion((v) => v + 1);
    setLastEdit("Manual edits cleared.");
  }

  function placeTextAt(x: number, y: number): void {
    if (!textDraft.value.trim() || !textColor) return;

    const item = makeTextOverlay({
      value: textDraft.value,
      x,
      y,
      size: textDraft.size,
      colorId: textDraft.colorId,
      fontFamily: textDraft.fontFamily,
      weight: textDraft.weight,
    });

    setTextItems((cur) => [...cur, item]);
    setSelectedTextId(item.id);
    setTextDraft((cur) => ({ ...cur, x, y }));
    setUsageVersion((v) => v + 1);
    setLastEdit(`Placed text \"${textDraft.value}\" at ${x}, ${y}.`);
  }

  function updateSelectedText(updater: (item: TextOverlay) => TextOverlay): void {
    if (!selectedTextId) return;

    setTextItems((cur) =>
      cur.map((item) => (item.id === selectedTextId ? updater(item) : item)),
    );
    setUsageVersion((v) => v + 1);
  }

  function hitTestText(x: number, y: number): TextOverlay | null {
    const canvas = qRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    for (let i = textItems.length - 1; i >= 0; i -= 1) {
      const item = textItems[i];
      if (!item.value.trim()) continue;

      ctx.save();
      ctx.font = `${item.weight} ${item.size}px ${item.fontFamily}`;
      const width = ctx.measureText(item.value).width + 24;
      const height = item.size + 24;
      ctx.restore();

      if (
        x >= item.x - width / 2 &&
        x <= item.x + width / 2 &&
        y >= item.y - height / 2 &&
        y <= item.y + height / 2
      ) {
        return item;
      }
    }

    return null;
  }
  function onQuantizedCanvasMouseDown(e: MouseEvent<HTMLCanvasElement>): void {
    const canvas = qRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasPoint(e, canvas);

    if (toolMode === "select") {
      const hit = hitTestShape(x, y);

      if (hit) {
        setSelectedShapeId(hit.id);
        setDraggingShapeId(hit.id);
        setDragOffset({
          x: x - hit.x,
          y: y - hit.y,
        });
        return;
      }

      setSelectedShapeId(null);
      return;
    }

    if (toolMode === "rect" || toolMode === "circle" || toolMode === "triangle") {
      setDragStart({ x, y });

      setDraftShape({
        id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: toolMode,
        x,
        y,
        w: 0,
        h: 0,
        colorId: shapeColorId,
        rotation: 0,
        z: Date.now(),
      });
    }
  }

  function onQuantizedCanvasMouseUp(): void {
    if (draftShape) {
      setShapes((cur) => [...cur, draftShape]);
      setSelectedShapeId(draftShape.id);
    }

    setDraftShape(null);
    setDragStart(null);
    setDraggingShapeId(null);
    setDragOffset(null);
  }
  function onQuantizedCanvasClick(e: MouseEvent<HTMLCanvasElement>): void {
    const canvas = qRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPoint(e, canvas);
    if (toolMode === "select") {
      const shapeHit = hitTestShape(x, y);
      const textHit = hitTestText(x, y);

      if (!shapeHit && !textHit) {
        setSelectedShapeId(null);
        setSelectedTextId(null);
        setLastEdit("Cleared selection.");
        return;
      }
    }


    if (toolMode === "text") {
      const hit = hitTestText(x, y);
      if (hit) {
        setSelectedTextId(hit.id);
        setTextDraft(hit);
        setLastEdit(`Selected text "${hit.value}".`);
        return;
      }

      placeTextAt(x, y);
      return;
    }

    if (toolMode !== "fill" || !fillColor) return;

    const cleanCanvas = buildExportCanvas();
    if (!cleanCanvas) return;

    const cleanCtx = cleanCanvas.getContext("2d");
    if (!cleanCtx) return;

    const changed = floodFillRegion(cleanCtx, x, y, fillColor);
    if (!changed) return;

    baseQuantizedRef.current = cleanCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setUsageVersion((v) => v + 1);
    setLastEdit(`Flood filled region to ${fillColor.name} at ${x}, ${y}.`);
  }
  function normalizeRect(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) {
    const x = snapToGrid(Math.min(a.x, b.x));
    const y = snapToGrid(Math.min(a.y, b.y));
    const w = Math.max(1, snapToGrid(Math.abs(b.x - a.x)));
    const h = Math.max(1, snapToGrid(Math.abs(b.y - a.y)));

    return { x, y, w, h };
  }
  function onQuantizedCanvasMove(e: MouseEvent<HTMLCanvasElement>): void {
    const canvas = qRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasPoint(e, canvas);

    if (
      dragStart &&
      draftShape &&
      (toolMode === "rect" || toolMode === "circle" || toolMode === "triangle")
    ) {
      const norm = normalizeRect(dragStart, { x, y });

      setDraftShape({
        ...draftShape,
        ...norm,
      });

      return;
    }

    if (toolMode === "select" && draggingShapeId && dragOffset) {
      setShapes((cur) =>
        cur.map((shape) =>
          shape.id === draggingShapeId
            ? {
              ...shape,
              x: x - dragOffset.x,
              y: y - dragOffset.y,
            }
            : shape,
        ),
      );
      return;
    }

    setHoverPoint({ x, y });
  }

  function onQuantizedCanvasLeave(): void {
    setHoverPoint(null);
    setDraggingShapeId(null);
    setDragOffset(null);
  }
  function updateSelectedShape(updater: (shape: ShapeItem) => ShapeItem): void {
    if (!selectedShapeId) return;

    setShapes((cur) =>
      cur.map((shape) => (shape.id === selectedShapeId ? updater(shape) : shape)),
    );
  }

  useEffect(() => {
    redrawQuantizedCanvas({ ghostDraftAt: hoverPoint });
  }, [
    hoverPoint,
    textItems,
    selectedTextId,
    textDraft,
    toolMode,
    img,
    selColors,
    bgColor,
    draftShape,
    shapes,
    selectedShapeId,
  ]);

  const selectedShape = useMemo(
    () => shapes.find((shape) => shape.id === selectedShapeId) ?? null,
    [shapes, selectedShapeId],
  );
  function getActiveEditableColorId(): string | null {
    if (selectedShape) return selectedShape.colorId;
    if (selectedText) return selectedText.colorId;

    if (toolMode === "text") {
      return textDraft.colorId;
    }

    if (toolMode === "rect" || toolMode === "circle" || toolMode === "triangle") {
      return shapeColorId;
    }

    if (toolMode === "fill") {
      return fillColorId;
    }

    return selColors[0]?.id ?? null;
  }

  function setActiveEditableColorId(colorId: string): void {
    if (selectedShape) {
      updateSelectedShape((shape) => ({ ...shape, colorId }));
      return;
    }

    if (selectedText) {
      updateSelectedText((item) => ({ ...item, colorId }));
      setTextDraft((cur) => ({ ...cur, colorId }));
      return;
    }

    if (toolMode === "text") {
      setTextDraft((cur) => ({ ...cur, colorId }));
      return;
    }

    if (toolMode === "rect" || toolMode === "circle" || toolMode === "triangle") {
      setShapeColorId(colorId);
      return;
    }

    if (toolMode === "fill") {
      setFillColorId(colorId);
      return;
    }
  }

  function doSwapColor(): void {
    const ctx = qRef.current?.getContext("2d");
    if (!ctx || !swapFromId || !swapToId) return;
    const from = selColors.find((c) => c.id === swapFromId);
    const to = inventoryColors.find((c) => c.id === swapToId);
    if (!from || !to) return;
    swapColorGlobal(ctx, from, to);
    baseQuantizedRef.current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Replace the old color slot with the new one — skip the quantize effect
    skipNextQuantizeRef.current = true;
    setSelIds((cur) => cur.map((id) => (id === swapFromId ? swapToId : id)));
    setSwapFromId("");
    setSwapToId("");
    setUsageVersion((v) => v + 1);
    setLastEdit(`Swapped ${from.name} → ${to.name}`);
  }

  function getActiveColorLabel(): string {
    if (selectedShape) return "Selected shape color";
    if (selectedText) return "Selected text color";

    if (toolMode === "text") return "Text color";
    if (toolMode === "rect" || toolMode === "circle" || toolMode === "triangle") return "Shape color";
    if (toolMode === "fill") return "Fill color";

    return "Active color";
  }
  const s = {
    wrap: {
      minHeight: "100vh",
      background: "#0e1116",
      color: "#f1f5f9",
      padding: "20px 14px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "minmax(280px, 1fr) minmax(0, 3fr) minmax(320px, 1.1fr)",
      gap: "12px",
      maxWidth: "1720px",
      margin: "0 auto",
      alignItems: "start" as const,
    },
    aside: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "24px",
      padding: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      minWidth: 0,
    },
    main: { display: "grid", gap: "12px", minWidth: 0 },
    section: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "24px",
      padding: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      minWidth: 0,
    },
    eyebrow: {
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.2em",
      color: "#94a3b8",
      marginBottom: "6px",
    },
    h1: {
      fontSize: "22px",
      fontWeight: 600,
      margin: "0 0 8px",
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "18px",
      fontWeight: 600,
      margin: "0 0 4px",
      letterSpacing: "-0.02em",
    },
    subSection: {
      background: "rgba(0,0,0,0.2)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "18px",
      padding: "14px",
      marginBottom: "12px",
    },
    subLabel: {
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.18em",
      color: "#94a3b8",
      marginBottom: "10px",
    },
    colorGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "8px",
    },
    canvasWrap: {
      borderRadius: "20px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "#0a0d12",
      minWidth: 0,
    },
    canvasLabel: {
      fontSize: "13px",
      fontWeight: 500,
      color: "#cbd5e1",
      marginBottom: "8px",
    },
    previewGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      minWidth: 0,
    },
    uploadLabel: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "10px",
      border: "1px dashed rgba(255,255,255,0.15)",
      borderRadius: "16px",
      padding: "16px",
      cursor: "pointer",
      background: "rgba(255,255,255,0.02)",
    },
    chooseBtn: {
      display: "inline-block",
      background: "#f1f5f9",
      color: "#0f172a",
      fontWeight: 700,
      fontSize: "13px",
      padding: "8px 14px",
      borderRadius: "10px",
      width: "fit-content",
    },
  };

  return (
    <div style={s.wrap}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={s.grid}>
        <aside style={s.aside}>
          <div style={{ display: "grid", gap: "12px" }}>
            <label
              style={{
                display: "block",
                cursor: "pointer",
              }}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onUpload}
              />
              <span
                style={{
                  display: "block",
                  width: "100%",
                  background: "#f1f5f9",
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                UPLOAD IMAGE
              </span>
            </label>

            <div style={s.subSection}>
              <div style={s.subLabel}>Palette</div>

              <div style={s.colorGrid}>
                {inventoryColors.map((c) => {
                  const active = selIds.includes(c.id);
                  const disabled = !active && selIds.length >= MAX_SELECTED;
                  const isBackground = bgId === c.id && active;

                  return (
                    <ColorChoiceButton
                      key={c.id}
                      color={c}
                      active={active}
                      disabled={disabled}
                      onClick={() => toggleColor(c.id)}
                      subtitle={isBackground ? "Background" : c.hex}
                    />
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "11px",
                  color: "#64748b",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap" as const,
                }}
              >
                <span>{selColors.length} / 4 selected</span>
                <span>·</span>
                <span>No gradients</span>
                <span>·</span>
                <span>No off-palette pixels</span>
              </div>
            </div>
          </div>
        </aside>

        <main style={s.main}>
          <div style={s.section}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <div style={s.eyebrow}>Live preview</div>
                <h2 style={s.h2}>Quantized output</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selColors.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: "999px",
                      padding: "5px 10px",
                      fontSize: "11px",
                      color: "#cbd5e1",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: c.hex,
                        border: "1px solid rgba(0,0,0,0.15)",
                      }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div style={s.previewGrid}>
              <div>
                <div style={s.canvasLabel}>Source</div>
                <div style={s.canvasWrap}>
                  <canvas
                    ref={srcRef}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      display: "block",
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={s.canvasLabel}>
                  {toolMode === "text"
                    ? `4-color result · live text preview in ${textColor?.name ?? "selected color"}`
                    : `4-color result · click to flood fill with ${fillColor?.name ?? "selected color"}`}
                </div>
                <div style={s.canvasWrap}>
                  <canvas
                    ref={qRef}
                    onMouseDown={onQuantizedCanvasMouseDown}
                    onMouseMove={onQuantizedCanvasMove}
                    onMouseUp={onQuantizedCanvasMouseUp}
                    onMouseLeave={onQuantizedCanvasLeave}
                    onClick={onQuantizedCanvasClick}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      display: "block",
                      cursor: toolMode === "text" ? "none" : fillColor ? "crosshair" : "default",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside style={s.aside}>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={s.subSection}>
              <div style={s.subLabel}>Active color</div>

              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>
                  {getActiveColorLabel()}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {selColors.map((c) => (
                    <ColorChoiceButton
                      key={`active-${c.id}`}
                      color={c}
                      active={getActiveEditableColorId() === c.id}
                      compact
                      onClick={() => setActiveEditableColorId(c.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={s.subSection}>
              <div style={s.subLabel}>Swap color</div>
              <div style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "6px", alignItems: "center" }}>
                  <select
                    value={swapFromId}
                    onChange={(e) => setSwapFromId(e.target.value)}
                    style={{ ...inputStyle, fontSize: "11px", padding: "7px 8px" }}
                  >
                    <option value="">From…</option>
                    {selColors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <span style={{ color: "#64748b", fontSize: "14px", fontWeight: 700, textAlign: "center" }}>→</span>
                  <select
                    value={swapToId}
                    onChange={(e) => setSwapToId(e.target.value)}
                    style={{ ...inputStyle, fontSize: "11px", padding: "7px 8px" }}
                  >
                    <option value="">To…</option>
                    {inventoryColors
                      .filter((c) => !selIds.includes(c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!swapFromId || !swapToId || swapFromId === swapToId}
                  onClick={doSwapColor}
                  style={{
                    background: swapFromId && swapToId && swapFromId !== swapToId ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    color: swapFromId && swapToId && swapFromId !== swapToId ? "#f1f5f9" : "#475569",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "8px",
                    cursor: swapFromId && swapToId && swapFromId !== swapToId ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                >
                  Swap Everywhere
                </button>
              </div>
            </div>

            <div style={s.subSection}>
              <div style={s.subLabel}>Active tool</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                {[
                  { id: "select", label: "Select" },
                  { id: "fill", label: "Flood fill" },
                  { id: "text", label: "Text" },
                  { id: "rect", label: "Rectangle" },
                  { id: "circle", label: "Circle" },
                  { id: "triangle", label: "Triangle" },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setToolModeSafe(tool.id as ToolMode)}
                    style={{
                      background: toolMode === tool.id ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                      border: toolMode === tool.id ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#f1f5f9",
                      fontWeight: 600,
                    }}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {toolMode === "fill" ? (
                  <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55 }}>
                    Click the quantized canvas to flood fill a contiguous region.
                  </div>
                ) : null}

                {toolMode === "select" && selectedShape ? (
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Drag on canvas to move. Edit size and position below.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                        X
                        <input
                          type="number"
                          value={Math.round(selectedShape.x)}
                          onChange={(e) =>
                            updateSelectedShape((shape) => ({ ...shape, x: Number(e.target.value) }))
                          }
                          style={inputStyle}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                        Y
                        <input
                          type="number"
                          value={Math.round(selectedShape.y)}
                          onChange={(e) =>
                            updateSelectedShape((shape) => ({ ...shape, y: Number(e.target.value) }))
                          }
                          style={inputStyle}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                        W
                        <input
                          type="number"
                          min={1}
                          value={Math.round(selectedShape.w)}
                          onChange={(e) =>
                            updateSelectedShape((shape) => ({ ...shape, w: Math.max(1, Number(e.target.value)) }))
                          }
                          style={inputStyle}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                        H
                        <input
                          type="number"
                          min={1}
                          value={Math.round(selectedShape.h)}
                          onChange={(e) =>
                            updateSelectedShape((shape) => ({ ...shape, h: Math.max(1, Number(e.target.value)) }))
                          }
                          style={inputStyle}
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                {toolMode === "text" ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    <input
                      type="text"
                      value={selectedText ? selectedText.value : textDraft.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (selectedText) {
                          updateSelectedText((item) => ({ ...item, value }));
                          setTextDraft((cur) => ({ ...cur, value }));
                        } else {
                          setTextDraft((cur) => ({ ...cur, value }));
                        }
                      }}
                      placeholder="Enter text"
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "#f1f5f9",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        outline: "none",
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                        Size
                        <input
                          type="range"
                          min={32}
                          max={220}
                          step={2}
                          value={selectedText ? selectedText.size : textDraft.size}
                          onChange={(e) => {
                            const size = Number(e.target.value);
                            if (selectedText) {
                              updateSelectedText((item) => ({ ...item, size }));
                              setTextDraft((cur) => ({ ...cur, size }));
                            } else {
                              setTextDraft((cur) => ({ ...cur, size }));
                            }
                          }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                        Weight
                        <select
                          value={selectedText ? selectedText.weight : textDraft.weight}
                          onChange={(e) => {
                            const weight = e.target.value;
                            if (selectedText) {
                              updateSelectedText((item) => ({ ...item, weight }));
                              setTextDraft((cur) => ({ ...cur, weight }));
                            } else {
                              setTextDraft((cur) => ({ ...cur, weight }));
                            }
                          }}
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            color: "#f1f5f9",
                            borderRadius: "12px",
                            padding: "10px 12px",
                          }}
                        >
                          <option value="400">Regular</option>
                          <option value="600">Bold</option>
                        </select>
                      </label>
                    </div>

                    <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                      Font
                      <select
                        value={selectedText ? selectedText.fontFamily : textDraft.fontFamily}
                        onChange={(e) => {
                          const fontFamily = e.target.value;
                          if (selectedText) {
                            updateSelectedText((item) => ({ ...item, fontFamily }));
                            setTextDraft((cur) => ({ ...cur, fontFamily }));
                          } else {
                            setTextDraft((cur) => ({ ...cur, fontFamily }));
                          }
                        }}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "#f1f5f9",
                          borderRadius: "12px",
                          padding: "10px 12px",
                        }}
                      >
                        <option value="Arial">Arial</option>
                        <option value="Impact">Impact</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Tahoma">Tahoma</option>
                        <option value="Trebuchet MS">Trebuchet MS</option>
                      </select>
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTextId(null);
                          setTextDraft(makeTextOverlay({ colorId: selColors[0]?.id ?? DEFAULT_TEXT.colorId }));
                          setLastEdit("Ready to place new text.");
                        }}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: "#f1f5f9",
                        }}
                      >
                        New text
                      </button>

                      <button
                        type="button"
                        disabled={!selectedText}
                        onClick={() => {
                          if (!selectedText) return;
                          setTextItems((cur) => cur.filter((item) => item.id !== selectedText.id));
                          setSelectedTextId(null);
                          setTextDraft(makeTextOverlay({ colorId: selColors[0]?.id ?? DEFAULT_TEXT.colorId }));
                          setUsageVersion((v) => v + 1);
                          setLastEdit(`Deleted text "${selectedText.value}".`);
                        }}
                        style={{
                          background: selectedText ? "#f1f5f9" : "rgba(255,255,255,0.08)",
                          color: selectedText ? "#0f172a" : "#64748b",
                          border: "none",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          cursor: selectedText ? "pointer" : "not-allowed",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        Delete selected
                      </button>
                    </div>
                  </div>
                ) : null}

                {(toolMode === "rect" || toolMode === "circle" || toolMode === "triangle") ? (
                  <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55 }}>
                    Click and drag on the quantized canvas to draw a shape.
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={resetQuantizedImage}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.08)",
                color: "#f1f5f9",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
            >
              Undo all changes
            </button>

            <button
              type="button"
              onClick={() => void downloadLayeredSvgZip()}
              style={{
                width: "100%",
                background: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "0.04em",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Submit for design review
            </button>
          </div>
        </aside>
        {showPaletteSuggestions && !hasDismissedPaletteSuggestions ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: "min(960px, 100%)",
                maxHeight: "85vh",
                overflowY: "auto",
                background: "#11161d",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "24px",
                padding: "18px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                display: "grid",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>
                  Optimized palettes
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPaletteSuggestions(false);
                    setHasDismissedPaletteSuggestions(true);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#f1f5f9",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  CLOSE
                </button>
              </div>

              {paletteSuggestions.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {paletteSuggestions.map((suggestion) => {
                    const colors = inventoryColors.filter((c) => suggestion.colorIds.includes(c.id));

                    return (
                      <div
                        key={suggestion.id}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "16px",
                          padding: "12px",
                          display: "grid",
                          gap: "10px",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>
                          {suggestion.label}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                          {colors.map((c) => (
                            <div key={c.id} style={{ display: "grid", gap: "4px" }}>
                              <div
                                style={{
                                  height: "24px",
                                  borderRadius: "8px",
                                  background: c.hex,
                                  border: "1px solid rgba(0,0,0,0.15)",
                                }}
                              />
                              <div style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>
                                {c.name}
                              </div>
                            </div>
                          ))}
                        </div>

                        <img
                          src={suggestion.previewDataUrl}
                          alt={suggestion.label}
                          style={{
                            width: "100%",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "block",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setSelIds(suggestion.colorIds);
                            setBgId(suggestion.colorIds[0] ?? inventoryColors[0]?.id ?? "");
                            setLastEdit(`Applied suggested palette: ${suggestion.label}.`);
                            setShowPaletteSuggestions(false);
                            setHasDismissedPaletteSuggestions(true);
                          }}
                          style={{
                            width: "100%",
                            background: "#f1f5f9",
                            color: "#0f172a",
                            fontWeight: 700,
                            fontSize: "13px",
                            padding: "10px 12px",
                            borderRadius: "12px",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Use this palette
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  No palette suggestions available yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
