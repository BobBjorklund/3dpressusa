import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCollection,
  collectionCarouselBg,
  collectionProductImg,
  formatTiers,
} from "@/lib/storefront/collections";
import ItemCard from "@/components/ItemCard";
import EyebrowBadge from "@/components/EyebrowBadge";
import FixedPageBackground from "@/components/FixedPageBackground";
import TruckGuyColorSelector from "@/components/TruckGuyColorSelector";
import StickFamilySelector from "@/components/StickFamilySelector";
import HeroBranchAccordion from "@/components/HeroBranchAccordion";
import HolidayAccordion from "@/components/HolidayAccordion";

// Registry of custom collection components keyed by Collection.componentKey
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  TruckGuyColorSelector,
  StickFamilySelector,
};

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);

  if (!collection) notFound();

  // Hero collection is huge (177+ items) and heavily duplicated across branches —
  // show a collapsible accordion grouped by branch instead of one long flat grid.
  const groupByBranch = collection.slug === 'hero';
  // Holiday containers are seeded ahead of any items existing, so this renders
  // even at zero items — see the length===0 check below.
  const groupByHoliday = collection.slug === 'holiday';
  const items = collection.items;

  return (
    <main className="relative min-h-screen text-white">

      <FixedPageBackground src={collectionCarouselBg(collection)} />

      {/* Hero */}
      <section className="border-b border-brushed-aluminum/15">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
          <Link
            href="/collections"
            className="mb-8 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em] text-brushed-aluminum transition hover:text-white"
          >
            ← Collections
          </Link>

          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              {collection.eyebrow && (
                <EyebrowBadge className="mb-4">{collection.eyebrow}</EyebrowBadge>
              )}
              <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
                {collection.name}
              </h1>
              {collection.subtitle && (
                <p className="mt-2 text-lg text-brushed-aluminum">{collection.subtitle}</p>
              )}
              {collection.description && (
                <p className="mt-4 max-w-2xl text-brushed-aluminum">{collection.description}</p>
              )}
              <div className="mt-5 w-fit rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-4 py-2 font-mono text-sm text-hazard-yellow">
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

      {/* Items — custom component or standard grid */}
      <section className={`mx-auto max-w-7xl px-6 py-12 md:px-8 ${collection.slug === "girly-girls" ? "theme-blush" : ""}`}>
        {collection.componentKey ? (
          (() => {
            const CustomComponent = COMPONENT_REGISTRY[collection.componentKey!];
            return CustomComponent ? (
              <CustomComponent
                items={collection.items}
                schemeName={collection.pricingScheme.name}
                componentProps={collection.componentProps as Record<string, unknown> | null}
              />
            ) : (
              <p className="text-brushed-aluminum">Unknown component: {collection.componentKey}</p>
            );
          })()
        ) : groupByHoliday ? (
          <HolidayAccordion
            items={items}
            collectionSlug={collection.slug}
            schemeName={collection.pricingScheme.name}
          />
        ) : collection.items.length === 0 ? (
          <p className="text-brushed-aluminum">No items in this collection yet.</p>
        ) : groupByBranch ? (
          <HeroBranchAccordion
            items={items}
            collectionSlug={collection.slug}
            schemeName={collection.pricingScheme.name}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
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
