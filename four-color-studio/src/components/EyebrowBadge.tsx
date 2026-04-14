import Link from "next/link";
import type { ReactNode } from "react";

const BASE = "w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm";

export default function EyebrowBadge({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const cls = `${BASE} ${className ?? ""}`.trim();
  return href ? (
    <Link href={href} className={`${cls} transition hover:text-white`}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}
