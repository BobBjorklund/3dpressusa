import type { ReactNode } from "react";

export default function ContentCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}
