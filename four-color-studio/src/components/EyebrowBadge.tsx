import Link from "next/link";
import type { ReactNode } from "react";

const BASE = "inline-flex w-fit items-center rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-hazard-yellow";

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
    <Link href={href} className={`${cls} transition hover:bg-hazard-yellow/20`}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}
