import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCollection,
  collectionCarouselBg,
  collectionProductImg,
  itemHeroImg,
  formatTiers,
} from "@/lib/storefront/collections";
import ItemImage from "@/components/ItemImage";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);

  if (!collection) notFound();

  return (
    <main className="relative min-h-screen text-white">

      {/* Fixed background — stays put while page scrolls */}
      <div className="fixed inset-0 -z-10">
        <img
          src={collectionCarouselBg(collection)}
          alt=""
          className="h-full w-full object-cover"
        />
        {/* Dark overlay so content stays readable throughout */}
        <div className="absolute inset-0 bg-zinc-950/75" />
      </div>

      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <Link
            href="/collections"
            className="mb-8 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
          >
            ← Collections
          </Link>

          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              {collection.eyebrow && (
                <div className="mb-4 w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/75 backdrop-blur-sm">
                  {collection.eyebrow}
                </div>
              )}
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {collection.name}
              </h1>
              {collection.subtitle && (
                <p className="mt-2 text-lg text-zinc-300">{collection.subtitle}</p>
              )}
              {collection.description && (
                <p className="mt-4 max-w-2xl text-zinc-400">{collection.description}</p>
              )}
              <div className="mt-5 w-fit rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-100">
                {formatTiers(collection.pricingScheme.tiers)}
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:justify-center">
              <img
                src={collectionProductImg(collection)}
                alt={collection.name}
                className="max-h-[220px] w-auto object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.60)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Items — sits on top of the fixed bg */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {collection.items.length === 0 ? (
          <p className="text-zinc-500">No items in this collection yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collection.items.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/60 shadow-[0_8px_24px_rgba(0,0,0,0.20)] backdrop-blur-sm transition hover:border-white/20 hover:bg-zinc-950/75"
              >
                <div className="relative aspect-square overflow-hidden bg-zinc-900/80">
                  <ItemImage src={itemHeroImg(item)} alt={item.name} />
                </div>
                <div className="p-4">
                  <h3 className="font-black leading-tight">{item.name}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-3 text-xs font-bold text-amber-300">
                    {formatTiers(collection.pricingScheme.tiers)}
                    {item.highDetailAvailable && (
                      <span className="ml-1 text-white/40">· HD +$1</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
