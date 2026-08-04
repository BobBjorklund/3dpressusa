import type { ReactNode } from "react";

export default function ContentCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-brushed-aluminum/25 bg-steel-panel p-5 ${className ?? ""}`}>
      {children}
    </div>
  );
}
