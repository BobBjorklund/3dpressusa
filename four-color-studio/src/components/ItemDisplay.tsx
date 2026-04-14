"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ThreeMFStatic = dynamic(() => import("./ThreeMFStatic"), { ssr: false });

export default function ItemDisplay({
  slug,
  alt,
  heroOverride,
}: {
  slug: string;
  alt: string;
  heroOverride?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <ThreeMFStatic
        url={`/items/${slug}.3mf`}
        className="absolute inset-0"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      src={heroOverride ?? `/items/${slug}-hero.png`}
      alt={alt}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/items/placeholder.png"; }}
    />
  );
}
