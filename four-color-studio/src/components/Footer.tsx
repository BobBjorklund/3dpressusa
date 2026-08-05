import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-brushed-aluminum/15 bg-gunmetal">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/brand/3dpress-usa-badge-clean-64.png"
                alt="3DPress USA"
                className="h-9 w-9"
                width={64}
                height={64}
              />
              <div className="font-display text-lg uppercase tracking-wide">
                <span className="text-white">3DPress</span>
                <span className="text-plate-red">U</span>
                <span className="text-white">S</span>
                <span className="text-federal-blue">A</span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-brushed-aluminum">
              Modular 3D-printed hitch covers.<br />
              Made to order in East Windsor, NJ.
            </p>
          </div>

          {/* Shop */}
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-brushed-aluminum">Shop</div>
            <ul className="space-y-2">
              {[
                { label: "Collections", href: "/collections" },
                { label: "Base Unit", href: "/base-unit" },
                { label: "Pet Coasters", href: "/pet-coasters" },
                { label: "Custom Work", href: "mailto:designs@3dpressusa.com" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-brushed-aluminum">Legal</div>
            <ul className="space-y-2">
              {[
                { label: "Privacy Policy", href: "/legal/privacy" },
                { label: "Returns & Refunds", href: "/legal/returns" },
                { label: "Shipping Policy", href: "/legal/shipping" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-brushed-aluminum">Contact</div>
            <ul className="space-y-2">
              {[
                { label: "info@3dpressusa.com", href: "mailto:info@3dpressusa.com" },
                { label: "designs@3dpressusa.com", href: "mailto:designs@3dpressusa.com" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-white/70 transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-brushed-aluminum/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-brushed-aluminum/70">
            &copy; {new Date().getFullYear()} 3DPress USA. All rights reserved.
          </p>
          <p className="font-mono text-xs text-brushed-aluminum/70">
            Designed, printed, and shipped in the USA.
          </p>
        </div>
      </div>
    </footer>
  );
}
