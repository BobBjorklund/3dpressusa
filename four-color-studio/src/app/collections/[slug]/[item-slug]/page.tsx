import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getItem,
  collectionCarouselBg,
} from "@/lib/storefront/collections";
import type { CapPricingType } from "@/lib/storefront/pricing-config";
import ItemDisplay from "@/components/ItemDisplay";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string; "item-slug": string }>;
}) {
  const { slug, "item-slug": itemSlug } = await params;
  const item = await getItem(itemSlug);

  if (!item || item.collection.slug !== slug) notFound();

  const collection = item.collection;
  const tiers = collection.pricingScheme.tiers;

  return (
    <main className="relative min-h-screen text-white">

      {/* Fixed background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={collectionCarouselBg(collection)}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-zinc-950/80" />
      </div>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 pt-8 md:px-8">
        <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/40">
          <Link href="/collections" className="transition hover:text-white/70">Collections</Link>
          <span>/</span>
          <Link href={`/collections/${slug}`} className="transition hover:text-white/70">{collection.name}</Link>
          <span>/</span>
          <span className="text-white/60">{item.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">

          {/* Image */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
            <div className="aspect-square">
              <ItemDisplay slug={item.slug} alt={item.name} heroOverride={item.heroOverride} />

            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">

            {/* Collection eyebrow */}
            <Link
              href={`/collections/${slug}`}
              className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm transition hover:text-white"
            >
              {collection.eyebrow ?? collection.name}
            </Link>

            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{item.name}</h1>
              {item.description && (
                <p className="mt-3 text-lg leading-7 text-zinc-300">{item.description}</p>
              )}
            </div>

            {/* Pricing */}
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">Pricing</div>
              <div className="flex flex-wrap gap-3">
                {[...tiers].sort((a, b) => a.minQty - b.minQty).map((tier) => (
                  <div
                    key={tier.minQty}
                    className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-center"
                  >
                    <div className="text-xl font-black text-amber-200">
                      ${(tier.unitPriceCents / 100).toFixed(0)}
                    </div>
                    <div className="text-[10px] font-bold text-white/50 mt-0.5">
                      {tier.minQty === 1 ? "1 cap" : `${tier.minQty}+ caps`}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/40 leading-5">
                Tier is based on total cap quantity across your entire order — mix any collections.
              </p>
              {item.highDetailAvailable && (
                <div className="mt-3 text-xs font-bold text-white/50">
                  High-detail mode available <span className="text-amber-300">+$1 per cap</span>
                </div>
              )}
            </div>

            {/* Add to cart */}
            <AddToCartButton
              item={{
                slug: item.slug,
                name: item.name,
                pricingType: item.pricingType as CapPricingType,
                highDetailAvailable: item.highDetailAvailable,
              }}
            />

          </div>
        </div>
      </section>
    </main>
  );
}
