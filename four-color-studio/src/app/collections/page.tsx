import Link from "next/link";
import {
  getCollections,
  collectionCarouselBg,
  collectionProductImg,
  formatTiers,
} from "@/lib/storefront/collections";
import CoasterPromoBanner from "@/components/CoasterPromoBanner";
import SpecPlate from "@/components/SpecPlate";

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="relative min-h-screen bg-gunmetal text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
        <div className="mb-8">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-brushed-aluminum">
            3D Press, USA
          </div>
          <h1 className="mt-3 font-display text-4xl uppercase tracking-tight md:text-5xl">
            Collections
          </h1>
          <p className="mt-3 max-w-2xl text-brushed-aluminum">
            3D-printed in New Jersey. Each placard snaps onto the same base - mix collections, grab a few, pay less per cap the more you buy.
          </p>
        </div>

        <CoasterPromoBanner />

        {collections.length === 0 ? (
          <p className="text-brushed-aluminum">No collections available yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="group block">
                <SpecPlate className="overflow-hidden transition group-hover:border-brushed-aluminum/45">
                  {/* Background */}
                  <div className="absolute inset-0">
                    <img
                      src={collectionCarouselBg(c)}
                      alt=""
                      className="h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gunmetal/80 via-gunmetal/55 to-gunmetal/10" />
                  </div>

                  {/* Product image top-right */}
                  <div className="relative flex justify-end px-7 pt-7">
                    <img
                      src={collectionProductImg(c)}
                      alt=""
                      className="h-28 w-auto object-contain transition duration-500 group-hover:scale-[1.04]"
                    />
                  </div>

                  {/* Text content */}
                  <div className="relative px-7 pb-7">
                    {c.eyebrow && (
                      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-hazard-yellow">
                        {c.eyebrow}
                      </div>
                    )}
                    <h2 className="font-display text-2xl uppercase leading-tight text-white">{c.name}</h2>
                    {c.subtitle && (
                      <p className="mt-1 text-sm text-brushed-aluminum line-clamp-2">{c.subtitle}</p>
                    )}
                    <div className="mt-3 font-mono text-xs text-hazard-yellow">
                      {formatTiers(c.pricingScheme.name)}
                    </div>
                    <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-sm bg-plate-red px-4 py-2 font-display text-sm uppercase tracking-wide text-white transition group-hover:bg-plate-red/85">
                      Shop Collection <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </SpecPlate>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
