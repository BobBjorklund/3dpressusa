import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCollection,
  collectionCarouselBg,
  collectionProductImg,
  formatTiers,
} from "@/lib/storefront/collections";
import ItemCard from "@/components/ItemCard";

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
                {formatTiers(collection.pricingScheme.name)}
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
              <ItemCard
                key={item.id}
                item={item}
                collectionSlug={collection.slug}
                schemeName={collection.pricingScheme.name}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
