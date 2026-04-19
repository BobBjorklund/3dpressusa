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

  // Heroes items use {branch}-{design} slugs — sort by design so same designs
  // group together across branches rather than grouping by branch.
  // Group by design only for the hero collection — other heroes-priced collections (patriot etc.) use a flat grid
  const groupByDesign = collection.slug === 'hero';
  const items = groupByDesign
      ? [...collection.items].sort((a, b) => {
          const designA = a.slug.slice(a.slug.indexOf('-') + 1);
          const designB = b.slug.slice(b.slug.indexOf('-') + 1);
          return designA.localeCompare(designB) || a.slug.localeCompare(b.slug);
        })
      : collection.items;

  return (
    <main className="relative min-h-screen text-white">

      <FixedPageBackground src={collectionCarouselBg(collection)} />

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
                <EyebrowBadge className="mb-4">{collection.eyebrow}</EyebrowBadge>
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

      {/* Items — custom component or standard grid */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
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
              <p className="text-zinc-500">Unknown component: {collection.componentKey}</p>
            );
          })()
        ) : collection.items.length === 0 ? (
          <p className="text-zinc-500">No items in this collection yet.</p>
        ) : groupByDesign ? (
          // Group by design slug (everything after the first dash)
          (() => {
            const groups: { design: string; items: typeof items }[] = [];
            for (const item of items) {
              const design = item.slug.slice(item.slug.indexOf("-") + 1);
              const last = groups[groups.length - 1];
              if (last?.design === design) last.items.push(item);
              else groups.push({ design, items: [item] });
            }
            return (
              <div className="flex flex-col gap-8">
                {groups.map((group, i) => (
                  <div key={group.design}>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          collectionSlug={collection.slug}
                          schemeName={collection.pricingScheme.name}
                        />
                      ))}
                    </div>
                    {i < groups.length - 1 && (
                      <div className="mt-8 border-t border-white/10" />
                    )}
                  </div>
                ))}
              </div>
            );
          })()
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
