import Link from "next/link";

export const metadata = {
  title: "Returns & Refunds — 3DPress USA",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 md:px-8">

        <div className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-red-300">
          Legal
        </div>
        <h1 className="text-3xl font-black tracking-tight">Returns &amp; Refunds</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: April 14, 2026</p>

        <div className="mt-10 space-y-10 text-zinc-300 leading-7">

          <section>
            <h2 className="text-lg font-black text-white mb-3">Made to order means made for you</h2>
            <p>
              Every cap is printed when you order it — there&apos;s no shelf stock, no warehouse,
              and no pre-made inventory to resell. Because of this, <strong className="text-white">we
              cannot accept returns for change-of-mind or buyer&apos;s remorse.</strong> Once
              your order is in the print queue, those materials are yours.
            </p>
            <p className="mt-3">
              We know that&apos;s not what everyone wants to hear. But it&apos;s also why the
              product is affordable — we don&apos;t build return costs into the price.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white mb-3">We stand behind our work</h2>
            <p>
              If your order arrives damaged, defective, or is not what you ordered, we will make
              it right — no questions asked. Contact us within <strong className="text-white">7 days
              of delivery</strong> at{" "}
              <a href="mailto:info@3dpressusa.com" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
                info@3dpressusa.com
              </a>{" "}
              with:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-zinc-400">
              <li>Your order confirmation number</li>
              <li>A photo of the item and the issue</li>
              <li>What you&apos;d like — replacement, refund, or exchange</li>
            </ul>
            <p className="mt-3">
              We&apos;ll reprint and reship at no charge, or issue a full refund — whichever you
              prefer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white mb-3">Refund processing</h2>
            <p>
              Approved refunds are processed back to your original payment method within
              5–7 business days. Stripe may take an additional 3–5 business days to post the
              credit to your account depending on your bank.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white mb-3">Color variation</h2>
            <p>
              3D-printed colors can vary slightly from the preview images on our site depending
              on monitor calibration and filament batch. Minor color variation is not considered
              a defect. If your cap looks nothing like what was advertised, that&apos;s a
              different story — reach out and we&apos;ll figure it out.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white mb-3">Questions?</h2>
            <p>
              Email us at{" "}
              <a href="mailto:info@3dpressusa.com" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
                info@3dpressusa.com
              </a>. We&apos;re a small operation and we read every email.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
