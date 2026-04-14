import { notFound } from "next/navigation";
import {
  getItem,
  collectionCarouselBg,
} from "@/lib/storefront/collections";
import { configTiersForDisplay, type CapPricingType } from "@/lib/storefront/pricing-config";
import AddToCartButton from "@/components/AddToCartButton";
import Breadcrumb from "@/components/Breadcrumb";
import EyebrowBadge from "@/components/EyebrowBadge";
import FixedPageBackground from "@/components/FixedPageBackground";
import PricingTierCards from "@/components/PricingTierCards";
import TruckViewerCard from "@/components/TruckViewerCard";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string; "item-slug": string }>;
}) {
  const { slug, "item-slug": itemSlug } = await params;
  const item = await getItem(itemSlug);

  if (!item || item.collection.slug !== slug) notFound();

  const collection = item.collection;
  const tiers = configTiersForDisplay(collection.pricingScheme.name);

  return (
    <main className="relative min-h-screen text-white">

      <FixedPageBackground src={collectionCarouselBg(collection)} overlay="bg-zinc-950/80" />

      <div className="mx-auto max-w-7xl px-6 pt-8 md:px-8">
        <Breadcrumb crumbs={[
          { label: "Collections", href: "/collections" },
          { label: collection.name, href: `/collections/${slug}` },
          { label: item.name },
        ]} />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">

          <TruckViewerCard slug={item.slug} alt={item.name} heroOverride={item.heroOverride} />

          <div className="flex flex-col gap-6">

            <EyebrowBadge href={`/collections/${slug}`}>
              {collection.eyebrow ?? collection.name}
            </EyebrowBadge>

            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{item.name}</h1>
              {item.description && (
                <p className="mt-3 text-lg leading-7 text-zinc-300">{item.description}</p>
              )}
            </div>

            <PricingTierCards
              tiers={tiers.map((t) => ({
                price: `$${(t.unitPriceCents / 100).toFixed(0)}`,
                label: t.minQty === 1 ? "1 cap" : `${t.minQty}+ caps`,
              }))}
              note="Tier is based on total cap quantity across your entire order — mix any collections."
            >
              {item.highDetailAvailable && (
                <div className="mt-3 text-xs font-bold text-white/50">
                  High-detail mode available <span className="text-amber-300">+$1 per cap</span>
                </div>
              )}
            </PricingTierCards>

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
