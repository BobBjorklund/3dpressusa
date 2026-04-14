import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="text-lg font-black tracking-tight">
              <span className="text-white">3DPress</span>
              <span className="text-red-500">U</span>
              <span className="text-white">S</span>
              <span className="text-blue-500">A</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500 leading-6">
              Modular 3D-printed hitch covers.<br />
              Made to order in East Windsor, NJ.
            </p>
          </div>

          {/* Shop */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Shop</div>
            <ul className="space-y-2">
              {[
                { label: "Collections", href: "/collections" },
                { label: "Base Unit", href: "/base-unit" },
                { label: "Custom Work", href: "mailto:designs@3dpressusa.com" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-400 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Legal</div>
            <ul className="space-y-2">
              {[
                { label: "Privacy Policy", href: "/legal/privacy" },
                { label: "Returns & Refunds", href: "/legal/returns" },
                { label: "Shipping Policy", href: "/legal/shipping" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-400 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Contact</div>
            <ul className="space-y-2">
              {[
                { label: "info@3dpressusa.com", href: "mailto:info@3dpressusa.com" },
                { label: "designs@3dpressusa.com", href: "mailto:designs@3dpressusa.com" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-zinc-400 transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} 3DPress USA. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Designed, printed, and shipped in the USA.
          </p>
        </div>
      </div>
    </footer>
  );
}
