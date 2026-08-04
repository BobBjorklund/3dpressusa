import Link from "next/link";

export type BreadcrumbCrumb = { label: string; href?: string };

export default function Breadcrumb({ crumbs }: { crumbs: BreadcrumbCrumb[] }) {
  return (
    <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-brushed-aluminum/70">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="transition hover:text-white">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-white">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
