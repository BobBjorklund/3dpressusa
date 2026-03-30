"use client";

import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
type InventoryColor = {
  id: string;
  name: string;
  hex: string;
};
const REG_MARK_SIZE_MM = 2; // tiny corner square
type Rgb = {
  r: number;
  g: number;
  b: number;
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

const INVENTORY_COLORS: InventoryColor[] = [
  { id: "overture-purple", name: "Purple", hex: "#6F52A3" },

  { id: "elegoo-beige", name: "Beige", hex: "#BEA586" },
  { id: "elegoo-brown", name: "Brown", hex: "#6B4A2E" },
  { id: "elegoo-yellow", name: "Yellow", hex: "#E5C529" },
  { id: "ujoybio-yellow", name: "Yellow (bright)", hex: "#F2D13A" },
  { id: "ujoybio-cobalt-blue", name: "Cobalt blue", hex: "#2F5DA8" },
  { id: "elegoo-blue", name: "Blue", hex: "#1F4FBF" },
  { id: "elegoo-red", name: "Red", hex: "#B23A32" },
  { id: "elegoo-white", name: "White", hex: "#E9E9E7" },
  { id: "elegoo-black", name: "Black", hex: "#1E1E20" },
  { id: "elegoo-green", name: "Green", hex: "#2F7A4A" },
  { id: "ujoybio-christmas-green", name: "Christmas green", hex: "#1F6A3A" },
  { id: "eagles-green", name: "E-A-G-L-E-S", hex: "#0F3B2F" },

  { id: "ujoybio-orange", name: "Orange", hex: "#D96A1D" },


  { id: "silver", name: "Silver", hex: "#B3B5BA" },
];

const CANVAS_SIZE = 800;
const MAX_SELECTED = 4;
const TILE_SIZE_MM = 101.6;
const DEFAULT_TEXT = {
  value: "",
  x: CANVAS_SIZE / 2,
  y: CANVAS_SIZE / 2,
  size: 96,
  colorId: "elegoo-white",
  fontFamily: "Arial",
  weight: "700",
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
    x: Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * scaleX))),
    y: Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * scaleY))),
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

export default function FourColorDesignStudio() {
  const [selIds, setSelIds] = useState<string[]>(["elegoo-black", "elegoo-white", "elegoo-red", "elegoo-blue"]);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imgName, setImgName] = useState<string>("");
  const [bgId, setBgId] = useState<string>("elegoo-black");
  const [fillColorId, setFillColorId] = useState<string>("elegoo-red");
  const [usageVersion, setUsageVersion] = useState(0);
  const [lastEdit, setLastEdit] = useState<string>("No manual edits yet.");
  const [textDraft, setTextDraft] = useState<TextOverlay>(makeTextOverlay());
  const [textItems, setTextItems] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<"fill" | "text">("fill");
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const qRef = useRef<HTMLCanvasElement | null>(null);
  const baseQuantizedRef = useRef<ImageData | null>(null);

  const selColors = useMemo(
    () => INVENTORY_COLORS.filter((c) => selIds.includes(c.id)),
    [selIds],
  );

  const bgColor = useMemo(
    () => INVENTORY_COLORS.find((c) => c.id === bgId) ?? INVENTORY_COLORS[10],
    [bgId],
  );

  const fillColor = useMemo(
    () => selColors.find((c) => c.id === fillColorId) ?? selColors[0] ?? null,
    [fillColorId, selColors],
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

  function drawBaseOnto(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (baseQuantizedRef.current) {
      ctx.putImageData(baseQuantizedRef.current, 0, 0);
      return;
    }

    drawChecker(ctx, CANVAS_SIZE, CANVAS_SIZE);
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

    // 🔥 ADD THIS BLOCK
    if (toolMode === "fill" && hoverPoint && fillColor) {
      const mask = getFloodRegionMask(ctx, hoverPoint.x, hoverPoint.y);

      const overlay = ctx.getImageData(0, 0, qc.width, qc.height);
      const d = overlay.data;

      for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
          const idx = i * 4;
          d[idx] = 255;     // highlight color (tweakable)
          d[idx + 1] = 255;
          d[idx + 2] = 255;
          d[idx + 3] = 80;  // transparency
        }
      }

      ctx.putImageData(overlay, 0, 0);
    }

    // existing text rendering
    for (const item of textItems) {
      drawTextItem(ctx, item, { selected: item.id === selectedTextId });
    }

    if (options?.ghostDraftAt && toolMode === "text" && textDraft.value.trim()) {
      drawTextItem(
        ctx,
        { ...textDraft, x: options.ghostDraftAt.x, y: options.ghostDraftAt.y },
        { ghost: true }
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

    for (const color of usedColors) {
      const rgb = hexToRgb(color.hex);
      const svgParts: string[] = [];

      svgParts.push(
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<svg xmlns="http://www.w3.org/2000/svg" width="4in" height="4in" viewBox="0 0 ${TILE_SIZE_MM} ${TILE_SIZE_MM}" shape-rendering="crispEdges">`,
        `<title>${escapeXml(`${safeName}-${color.id}`)}</title>`,
        `<desc>${escapeXml(`Single-color layer export for ${color.name} (${color.hex}).`)}</desc>`,
      );
      svgParts.push(
        `<rect x="0" y="${(TILE_SIZE_MM - REG_MARK_SIZE_MM).toFixed(4)}" width="${REG_MARK_SIZE_MM}" height="${REG_MARK_SIZE_MM}" fill="${color.hex}"/>`
      );
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

          if (matches && runStart < 0) {
            runStart = x;
          }

          if ((!matches || isEnd) && runStart >= 0) {
            const runWidth = x - runStart;

            svgParts.push(
              `<rect x="${(runStart * mmPerPixel).toFixed(4)}" y="${(y * mmPerPixel).toFixed(4)}" width="${(runWidth * mmPerPixel).toFixed(4)}" height="${mmPerPixel.toFixed(4)}" fill="#000000"/>`,
            );

            runStart = -1;
          }
        }
      }

      svgParts.push(`</svg>`);

      zip.file(
        `${safeName}-${color.id}.svg`,
        svgParts.join(""),
      );
    }

    zip.file(
      `${safeName}-README.txt`,
      [
        `Design: ${safeName}`,
        `Tile size: 4in x 4in`,
        `Exported layers: ${usedColors.length}`,
        ``,
        `Files:`,
        ...usedColors.map((c, i) => `${i + 1}. ${safeName}-${c.id}.svg  (${c.name} ${c.hex})`),
        ``,
        `Import each SVG separately into Bambu Studio and align them.`,
      ].join("\n"),
    );

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
    const sc = srcRef.current;
    const qc = qRef.current;
    if (!sc || !qc) return;

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
      URL.revokeObjectURL(url);
    };

    image.src = url;
  }

  function resetQuantizedImage(): void {
    const sc = srcRef.current;
    const qc = qRef.current;
    if (!sc || !qc || !img) return;

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

  function onQuantizedCanvasClick(e: MouseEvent<HTMLCanvasElement>): void {
    const canvas = qRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasPoint(e, canvas);

    if (toolMode === "text") {
      const hit = hitTestText(x, y);
      if (hit) {
        setSelectedTextId(hit.id);
        setTextDraft(hit);
        setLastEdit(`Selected text \"${hit.value}\".`);
        return;
      }

      placeTextAt(x, y);
      return;
    }

    if (!fillColor) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const changed = floodFillRegion(ctx, x, y, fillColor);
    if (!changed) return;

    baseQuantizedRef.current = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setUsageVersion((v) => v + 1);
    setLastEdit(`Flood filled region to ${fillColor.name} at ${x}, ${y}.`);
  }

  function onQuantizedCanvasMove(e: MouseEvent<HTMLCanvasElement>): void {
    const canvas = qRef.current;
    if (!canvas) return;
    setHoverPoint(getCanvasPoint(e, canvas));
  }

  function onQuantizedCanvasLeave(): void {
    setHoverPoint(null);
  }

  useEffect(() => {
    redrawQuantizedCanvas({ ghostDraftAt: hoverPoint });
  }, [hoverPoint, textItems, selectedTextId, textDraft, toolMode, img, selColors, bgColor]);

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
          <div style={{ marginBottom: "16px" }}>
            <div style={s.eyebrow}>Inventory-locked builder</div>
            <h1 style={s.h1}>Four-color design studio</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Select up to 4 inventory colors. Upload an image and it&apos;ll be hard-mapped to your palette.
              Add repair fills or editable text using only selected inventory colors.
            </p>
          </div>

          <div style={s.subSection}>
            <div style={s.subLabel}>Step 1 · choose up to 4 colors</div>
            <div style={s.colorGrid}>
              {INVENTORY_COLORS.map((c) => {
                const active = selIds.includes(c.id);
                const disabled = !active && selIds.length >= MAX_SELECTED;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleColor(c.id)}
                    disabled={disabled}
                    style={{
                      background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                      border: active ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      padding: "8px",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.35 : 1,
                      textAlign: "left" as const,
                      transition: "all .15s",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        height: "36px",
                        borderRadius: "10px",
                        background: c.hex,
                        border: "1px solid rgba(0,0,0,0.12)",
                        marginBottom: "6px",
                      }}
                    />
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.2 }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>{c.hex}</div>
                  </button>
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

          <div style={s.subSection}>
            <div style={s.subLabel}>Step 2 · background color</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {selColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setBgId(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: bgId === c.id ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                    border: bgId === c.id ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#f1f5f9",
                    transition: "all .15s",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "6px",
                      background: c.hex,
                      border: "1px solid rgba(0,0,0,0.15)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                </button>
              ))}
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
                    style={{ width: "100%", aspectRatio: "1 / 1", display: "block" }}
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
                    onClick={onQuantizedCanvasClick}
                    onMouseMove={onQuantizedCanvasMove}
                    onMouseLeave={onQuantizedCanvasLeave}
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

          <div style={s.section}>
            <div style={{ ...s.eyebrow, marginBottom: "14px" }}>Upload image</div>
            <div style={{ ...s.subSection, marginBottom: 0 }}>
              <div style={s.subLabel}>Import source artwork</div>
              <label style={s.uploadLabel}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
                  Choose source image
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55 }}>
                  PNG, JPG, logo, or mockup. It&apos;ll be square-fitted and hard-mapped to selected inventory colors only.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onUpload}
                />
                <span style={s.chooseBtn}>Choose image</span>
              </label>
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                {imgName || "No file loaded yet."}
              </div>
            </div>
          </div>
        </main>

        <aside style={s.aside}>
          <div style={s.subSection}>
            <div style={s.subLabel}>Step 3 · tool mode</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { id: "fill", label: "Flood fill" },
                { id: "text", label: "Add text" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setToolMode(tool.id as "fill" | "text")}
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
          </div>

          <div style={s.subSection}>
            <div style={s.subLabel}>Step 4 · repair tool</div>
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55 }}>
                Click the quantized canvas to flood fill a contiguous region with a selected inventory color.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {selColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFillColorId(c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: fillColorId === c.id ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                      border: fillColorId === c.id ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#f1f5f9",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "6px",
                        background: c.hex,
                        border: "1px solid rgba(0,0,0,0.15)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Fill with {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={s.subSection}>
            <div style={s.subLabel}>Step 5 · text tool</div>
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
                    min={24}
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
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
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
                {selColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (selectedText) {
                        updateSelectedText((item) => ({ ...item, colorId: c.id }));
                        setTextDraft((cur) => ({ ...cur, colorId: c.id }));
                      } else {
                        setTextDraft((cur) => ({ ...cur, colorId: c.id }));
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background:
                        (selectedText ? selectedText.colorId : textDraft.colorId) === c.id
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(255,255,255,0.03)",
                      border:
                        (selectedText ? selectedText.colorId : textDraft.colorId) === c.id
                          ? "1px solid rgba(255,255,255,0.28)"
                          : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#f1f5f9",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "6px",
                        background: c.hex,
                        border: "1px solid rgba(0,0,0,0.15)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  </button>
                ))}
              </div>
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
                    setLastEdit(`Deleted text \"${selectedText.value}\".`);
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
              <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55 }}>
                In <strong>Add text</strong> mode, the cursor shows a live ghost preview. Click existing text to edit it, or click empty space to place new text.
              </div>
            </div>
          </div>

          <div style={{ ...s.subSection, marginBottom: 0 }}>
            <div style={s.subLabel}>Step 6 · output summary</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.8 }}>
              <div>Build size: 4 in × 4 in</div>
              <div>Render mode: hard-palette quantization + flood fill + editable text overlay</div>
              <div>Anti-aliasing: disabled at export</div>
            </div>

            <button
              type="button"
              onClick={() => void downloadLayeredSvgZip()}
              style={{
                marginTop: "12px",
                width: "100%",
                background: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "0.06em",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              FINALIZE PRINT
            </button>

            <button
              type="button"
              onClick={resetQuantizedImage}
              disabled={!img}
              style={{
                marginTop: "12px",
                width: "100%",
                background: "rgba(255,255,255,0.08)",
                color: img ? "#f1f5f9" : "#64748b",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: img ? "pointer" : "not-allowed",
              }}
            >
              Reset manual edits
            </button>
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b" }}>{lastEdit}</div>

            {usage.length > 0 ? (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {usage.map((e) => (
                  <div
                    key={e.color.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "4px",
                        background: e.color.hex,
                        border: "1px solid rgba(0,0,0,0.15)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "#e2e8f0", minWidth: "80px" }}>{e.color.name}</span>
                    <span style={{ color: "#64748b" }}>{e.pct.toFixed(1)}%</span>
                    <div
                      style={{
                        flex: 1,
                        height: "3px",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: `${e.pct}%`,
                          height: "100%",
                          borderRadius: "2px",
                          background: e.color.hex,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#475569" }}>
                Load an image to see color usage breakdown.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
