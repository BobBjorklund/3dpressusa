"use client";

import { useEffect, useRef } from "react";

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", white: "#f0f0f0", black: "#1a1a1a",
  yellow: "#facc15", green: "#22c55e", orange: "#f97316", purple: "#a855f7",
  pink: "#ec4899", cyan: "#06b6d4", brown: "#92400e", gray: "#6b7280",
  grey: "#6b7280", silver: "#d1d5db", gold: "#fbbf24", navy: "#1e3a8a",
  olive: "#84cc16", teal: "#14b8a6", maroon: "#7f1d1d", khaki: "#d4c47e",
  tan: "#c9a96e", beige: "#e8d5b7", cream: "#fffdd0", ivory: "#fffff0",
  coral: "#ff7f7f", magenta: "#d946ef", lime: "#84cc16", indigo: "#6366f1",
  violet: "#8b5cf6",
};

type MeshData = {
  positions: Float32Array;
  indices: Uint32Array;
  color: string;
  matrix?: import("three").Matrix4 | null;
};

function parseMeshFromObject(obj: Element) {
  const verts = obj.querySelectorAll("vertices > vertex");
  const tris = obj.querySelectorAll("triangles > triangle");
  if (!verts.length || !tris.length) return null;

  const positions = new Float32Array(verts.length * 3);
  verts.forEach((v, i) => {
    positions[i * 3] = parseFloat(v.getAttribute("x") ?? "0");
    positions[i * 3 + 1] = parseFloat(v.getAttribute("y") ?? "0");
    positions[i * 3 + 2] = parseFloat(v.getAttribute("z") ?? "0");
  });

  const indices = new Uint32Array(tris.length * 3);
  tris.forEach((t, i) => {
    indices[i * 3] = parseInt(t.getAttribute("v1") ?? "0", 10);
    indices[i * 3 + 1] = parseInt(t.getAttribute("v2") ?? "0", 10);
    indices[i * 3 + 2] = parseInt(t.getAttribute("v3") ?? "0", 10);
  });

  return { positions, indices };
}

// Fixed 3/4 front-top angle — no controls, renders once, disposes immediately.
export default function ThreeMFStatic({
  url,
  className,
  onError,
}: {
  url: string;
  className?: string;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    async function render(el: HTMLDivElement) {
      const [THREE, { default: JSZip }] = await Promise.all([
        import("three"),
        import("jszip"),
      ]);

      if (cancelled) return;

      const res = await fetch(url);
      if (!res.ok || cancelled) { if (!res.ok) onError?.(); return; }
      const buf = await res.arrayBuffer();
      if (cancelled) return;

      const zip = await JSZip.loadAsync(buf);
      const isBambu = !!zip.file("Metadata/project_settings.config");
      const meshes: MeshData[] = [];

      if (isBambu) {
        const projectJson = await zip.file("Metadata/project_settings.config")!.async("text");
        const project = JSON.parse(projectJson);
        const extruderColors: string[] = project.filament_colour ?? [];
        const getExtruderColor = (extruder: number) => extruderColors[extruder - 1] ?? "#9ca3af";

        const settingsXml = await zip.file("Metadata/model_settings.config")!.async("text");
        const settingsDoc = new DOMParser().parseFromString(settingsXml, "text/xml");
        const partExtruderMap: Record<string, number> = {};
        const objectExtruder = parseInt(
          settingsDoc.querySelector('object > metadata[key="extruder"]')?.getAttribute("value") ?? "1",
          10
        );
        settingsDoc.querySelectorAll("part").forEach((part) => {
          const id = part.getAttribute("id") ?? "";
          const extruderMeta = part.querySelector('metadata[key="extruder"]');
          const extruder = extruderMeta
            ? parseInt(extruderMeta.getAttribute("value") ?? "1", 10)
            : objectExtruder;
          partExtruderMap[id] = extruder;
        });

        const rootXml = await zip.file("3D/3dmodel.model")!.async("text");
        const rootDoc = new DOMParser().parseFromString(rootXml, "text/xml");
        const components = rootDoc.querySelectorAll("components > component");
        const objectFileCache: Record<string, Document> = {};
        let partIndex = 1;

        for (const component of Array.from(components)) {
          const path = component.getAttribute("p:path")?.replace(/^\//, "") ?? "3D/Objects/object_1.model";
          const objectId = component.getAttribute("objectid") ?? "1";
          const transformAttr = component.getAttribute("transform");

          let matrix: import("three").Matrix4 | null = null;
          if (transformAttr) {
            const v = transformAttr.trim().split(/\s+/).map(Number);
            if (v.length === 12) {
              matrix = new THREE.Matrix4();
              matrix.set(
                v[0], v[3], v[6], v[9],
                v[1], v[4], v[7], v[10],
                v[2], v[5], v[8], v[11] + 6.015,
                0, 0, 0, 1
              );
            }
          }

          if (!objectFileCache[path]) {
            const objFile = zip.file(path);
            if (!objFile) continue;
            const objXml = await objFile.async("text");
            objectFileCache[path] = new DOMParser().parseFromString(objXml, "text/xml");
          }

          const objDoc = objectFileCache[path];
          const obj = objDoc.querySelector(`object[id="${objectId}"]`);
          if (!obj) continue;

          const mesh = parseMeshFromObject(obj);
          if (!mesh) continue;

          const extruder = partExtruderMap[String(partIndex)] ?? 1;
          meshes.push({ ...mesh, color: getExtruderColor(extruder), matrix });
          partIndex++;
        }
      } else {
        const modelFile = zip.file("3D/3dmodel.model");
        if (!modelFile || cancelled) return;
        const xml = await modelFile.async("text");
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        doc.querySelectorAll("resources > object").forEach((obj) => {
          const name = obj.getAttribute("name") ?? "";
          const lastSegment = name.split("-").pop()?.toLowerCase() ?? "";
          const isHex = /^[0-9a-f]{6}$/.test(lastSegment);
          const color = isHex ? `#${lastSegment}` : (COLOR_MAP[lastSegment] ?? "#9ca3af");
          const mesh = parseMeshFromObject(obj);
          if (mesh) meshes.push({ ...mesh, color, matrix: null });
        });
      }

      if (cancelled || !meshes.length) return;

      const w = el.clientWidth || 300;
      const h = el.clientHeight || 300;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 2000);

      // Bright ambient so dark parts stay readable
      scene.add(new THREE.AmbientLight(0xffffff, 1.8));
      // Key light — warm, upper-front-right
      const key = new THREE.DirectionalLight(0xfff4e0, 3.0);
      key.position.set(5, 10, 8);
      scene.add(key);
      // Fill light — cool, lower-left
      const fill = new THREE.DirectionalLight(0xddeeff, 1.2);
      fill.position.set(-6, 2, 4);
      scene.add(fill);
      // Rim light — back-top, gives edge definition
      const rim = new THREE.DirectionalLight(0xffffff, 1.0);
      rim.position.set(-2, 8, -8);
      scene.add(rim);

      const group = new THREE.Group();
      meshes.forEach(({ positions, indices, color, matrix }) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        const material = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
        const mesh = new THREE.Mesh(geometry, material);
        if (matrix) mesh.applyMatrix4(matrix);
        group.add(mesh);
      });

      // Same flip as the interactive viewer, plus a fixed 3/4 angle
      group.rotation.y = Math.PI + 0.45;
      group.rotation.z = Math.PI;

      scene.add(group);

      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;

      group.position.sub(center);

      // Slightly elevated 3/4 front angle
      camera.position.set(maxDim * 0.2, maxDim * 0.6, maxDim * 2.0);
      camera.near = maxDim * 0.001;
      camera.far = maxDim * 20;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);

      // Render once, capture to image, dispose WebGL immediately
      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL("image/png");
      renderer.dispose();

      if (cancelled) return;

      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "";
      img.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;object-fit:contain;";
      el.appendChild(img);
    }

    render(container).catch((err) => {
      console.error("[ThreeMFStatic] render error:", err);
      onError?.();
    });

    return () => { cancelled = true; };
  }, [url]);

  return <div ref={containerRef} className={className ?? "h-full w-full"} />;
}
