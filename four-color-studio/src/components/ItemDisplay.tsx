"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ThreeMFViewer = dynamic(() => import("./ThreeMFViewer"), { ssr: false });

// Inlined to avoid pulling prisma into the client bundle
function resolveHeroImg(slug: string, heroOverride?: string | null) {
  return heroOverride ?? `/items/${slug}-hero.png`;
}

export default function ItemDisplay({
  slug,
  alt,
  heroOverride,
}: {
  slug: string;
  alt: string;
  heroOverride?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show3mf, setShow3mf] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => resolveHeroImg(slug, heroOverride));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        fetch(`/items/${slug}.3mf`, { method: "HEAD" })
          .then((res) => { if (res.ok) setShow3mf(true); })
          .catch(() => { });
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [slug]);

  if (show3mf) {
    return (
      <div ref={ref} className="h-full w-full">
        <ThreeMFViewer url={`/items/${slug}.3mf`} />
      </div>
    );
  }

  return (
    <div ref={ref} className="h-full w-full">
      <img
        src={imgSrc}
        alt={alt}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
        onError={() => {
          if (imgSrc !== "/items/placeholder.png") {
            setImgSrc("/items/placeholder.png");
          }
        }}
      />
    </div>
  );
}