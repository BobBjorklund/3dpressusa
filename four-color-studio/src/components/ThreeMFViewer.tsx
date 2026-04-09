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

export default function ThreeMFViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let animId = 0;
    let rendererEl: HTMLCanvasElement | null = null;

    async function init(el: HTMLDivElement) {
      const [THREE, { OrbitControls }, { default: JSZip }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
        import("jszip"),
      ]);

      if (cancelled) return;

      const res = await fetch(url);
      if (!res.ok || cancelled) return;
      const buf = await res.arrayBuffer();
      if (cancelled) return;

      const zip = await JSZip.loadAsync(buf);

      const isBambu = !!zip.file("Metadata/project_settings.config");
      const meshes: MeshData[] = [];

      if (isBambu) {
        // 1. Extruder → hex from project_settings.config
        console.log('isBambu:', isBambu);
        console.log('url:', url);
        const projectJson = await zip.file("Metadata/project_settings.config")!.async("text");
        const project = JSON.parse(projectJson);
        const extruderColors: string[] = project.filament_colour ?? [];
        const getExtruderColor = (extruder: number) =>
          extruderColors[extruder - 1] ?? "#9ca3af";

        // 2. Part → extruder from model_settings.config
        const settingsXml = await zip.file("Metadata/model_settings.config")!.async("text");
        const settingsDoc = new DOMParser().parseFromString(settingsXml, "text/xml");
        const partExtruderMap: Record<string, number> = {};
        // Get object-level extruder as fallback
        const objectExtruder = parseInt(
          settingsDoc.querySelector('object > metadata[key="extruder"]')?.getAttribute("value") ?? "1",
          10
        );

        settingsDoc.querySelectorAll("part").forEach((part) => {
          const id = part.getAttribute("id") ?? "";
          const extruderMeta = part.querySelector('metadata[key="extruder"]');
          const extruder = extruderMeta
            ? parseInt(extruderMeta.getAttribute("value") ?? "1", 10)
            : objectExtruder; // inherit from object if not set on part
          partExtruderMap[id] = extruder;
        });
        // settingsDoc.querySelectorAll("part").forEach((part) => {
        //   const id = part.getAttribute("id") ?? "";
        //   const extruder = parseInt(
        //     part.querySelector('metadata[key="extruder"]')?.getAttribute("value") ?? "1",
        //     10
        //   );
        //   partExtruderMap[id] = extruder;
        // });
        console.log('extruderColors:', extruderColors);
        console.log('partExtruderMap:', partExtruderMap);
        // 3. Root model → component list
        const rootXml = await zip.file("3D/3dmodel.model")!.async("text");
        const rootDoc = new DOMParser().parseFromString(rootXml, "text/xml");
        const components = rootDoc.querySelectorAll("components > component");

        const objectFileCache: Record<string, Document> = {};
        let partIndex = 1;

        for (const component of Array.from(components)) {
          const path = component.getAttribute("p:path")?.replace(/^\//, "") ?? "3D/Objects/object_1.model";
          const objectId = component.getAttribute("objectid") ?? "1";
          const transformAttr = component.getAttribute("transform");

          // Parse transform, negating z translation to bring layers to front face
          let matrix: import("three").Matrix4 | null = null;
          if (transformAttr) {
            const v = transformAttr.trim().split(/\s+/).map(Number);
            if (v.length === 12) {
              matrix = new THREE.Matrix4();
              console.log(`part ${partIndex} transform:`, transformAttr, '→ z:', v?.[11]);

              matrix.set(
                v[0], v[3], v[6], v[9],
                v[1], v[4], v[7], v[10],
                v[2], v[5], v[8], v[11] + 6.015,  // shift layers to top of placard
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
          const color = getExtruderColor(extruder);

          meshes.push({ ...mesh, color, matrix });
          partIndex++;
        }

      } else {
        // Standard 3MF
        const modelFile = zip.file("3D/3dmodel.model");
        if (!modelFile || cancelled) return;

        const xml = await modelFile.async("text");
        if (cancelled) return;

        const doc = new DOMParser().parseFromString(xml, "text/xml");
        doc.querySelectorAll("resources > object").forEach((obj) => {
          const name = obj.getAttribute("name") ?? "";
          const segments = name.split("-");
          const lastSegment = segments[segments.length - 1]?.toLowerCase() ?? "";

          const isHex = /^[0-9a-f]{6}$/.test(lastSegment);
          const color = isHex ? `#${lastSegment}` : (COLOR_MAP[lastSegment] ?? "#9ca3af");

          const mesh = parseMeshFromObject(obj);
          if (mesh) meshes.push({ ...mesh, color, matrix: null });
        });
      }

      if (cancelled || !meshes.length) return;

      // Scene setup
      const w = el.clientWidth || 200;
      const h = el.clientHeight || 200;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0f172a, 0);
      rendererEl = renderer.domElement;
      el.appendChild(rendererEl);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 2000);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.5;

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const sun = new THREE.DirectionalLight(0xffffff, 1.4);
      sun.position.set(4, 8, 6);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35);
      fill.position.set(-4, -2, -4);
      scene.add(fill);

      const group = new THREE.Group();

      meshes.forEach(({ positions, indices, color, matrix }) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.65,
          metalness: 0.05,
        });

        const mesh = new THREE.Mesh(geometry, material);
        if (matrix) mesh.applyMatrix4(matrix);
        group.add(mesh);
      });

      // Flip whole group — both standard and Bambu are printed face-down
      group.rotation.y = Math.PI;
      group.rotation.z = Math.PI;

      scene.add(group);

      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;

      group.position.sub(center);
      camera.position.set(0, maxDim * 0.55, maxDim * 2.0);
      camera.near = maxDim * 0.001;
      camera.far = maxDim * 20;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
      controls.update();

      const ro = new ResizeObserver(() => {
        const nw = el.clientWidth;
        const nh = el.clientHeight;
        if (!nw || !nh) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      });
      ro.observe(el);

      function animate() {
        if (cancelled) return;
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      return () => {
        ro.disconnect();
        cancelAnimationFrame(animId);
        renderer.dispose();
        if (rendererEl && el.contains(rendererEl)) el.removeChild(rendererEl);
      };
    }

    let cleanupFn: (() => void) | undefined;
    init(container).then((fn) => { cleanupFn = fn; });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      cleanupFn?.();
      if (rendererEl && container.contains(rendererEl)) container.removeChild(rendererEl);
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      title="Drag to rotate · Scroll to zoom"
    />
  );
}