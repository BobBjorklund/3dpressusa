"use client";

import { useState } from "react";

export default function ItemImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
      onError={() => setImgSrc("/items/placeholder.png")}
    />
  );
}
