import Link from "next/link";

export type BreadcrumbCrumb = { label: string; href?: string };

export default function Breadcrumb({ crumbs }: { crumbs: BreadcrumbCrumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/40">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="transition hover:text-white/70">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-white/60">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
