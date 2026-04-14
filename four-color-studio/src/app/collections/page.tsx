import Link from "next/link";
import {
  getCollections,
  collectionCarouselBg,
  collectionProductImg,
  formatTiers,
} from "@/lib/storefront/collections";

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="mb-10">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-red-300">
            3D Press, USA
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Collections
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            3D-printed in New Jersey. Each placard snaps onto the same base — mix collections, grab a few, pay less per cap the more you buy.
          </p>
        </div>

        {collections.length === 0 ? (
          <p className="text-zinc-500">No collections available yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.30)] transition hover:border-white/25"
              >
                {/* Background */}
                <div className="absolute inset-0">
                  <img
                    src={collectionCarouselBg(c)}
                    alt=""
                    className="h-full w-full object-cover opacity-40 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
                </div>

                {/* Product image top-right */}
                <div className="relative flex justify-end px-5 pt-5">
                  <img
                    src={collectionProductImg(c)}
                    alt=""
                    className="h-28 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.60)] transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>

                {/* Text content */}
                <div className="relative px-6 pb-6">
                  {c.eyebrow && (
                    <div className="mb-2 w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/75 backdrop-blur-sm">
                      {c.eyebrow}
                    </div>
                  )}
                  <h2 className="text-xl font-black leading-tight">{c.name}</h2>
                  {c.subtitle && (
                    <p className="mt-1 text-sm text-zinc-300 line-clamp-2">{c.subtitle}</p>
                  )}
                  <div className="mt-3 text-xs font-bold text-amber-300">
                    {formatTiers(c.pricingScheme.name)}
                  </div>
                  <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-black text-black transition group-hover:bg-zinc-200">
                    Shop Collection <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
