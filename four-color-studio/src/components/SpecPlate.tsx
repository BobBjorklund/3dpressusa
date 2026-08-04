import type { ReactNode } from "react";

type Accent = "red" | "blue" | "yellow" | "neutral";

const ACCENT_BORDER: Record<Accent, string> = {
  red: "border-plate-red/40",
  blue: "border-federal-blue/60",
  yellow: "border-hazard-yellow/40",
  neutral: "border-brushed-aluminum/25",
};

/**
 * The site's signature element: a stamped-metal spec plate, echoing the
 * product itself (a swappable plate bolted onto a hitch). Rivet marks at
 * each corner, hairline border, flat steel-panel surface — no blur, no glow.
 */
export default function SpecPlate({
  children,
  className = "",
  accent = "neutral",
}: {
  children: ReactNode;
  className?: string;
  accent?: Accent;
}) {
  return (
    <div className={`plate-texture relative overflow-hidden rounded-md border bg-steel-panel ${ACCENT_BORDER[accent]} ${className}`}>
      <span className="rivet left-3 top-3" aria-hidden="true" />
      <span className="rivet right-3 top-3" aria-hidden="true" />
      <span className="rivet left-3 bottom-3" aria-hidden="true" />
      <span className="rivet right-3 bottom-3" aria-hidden="true" />
      {children}
    </div>
  );
}
