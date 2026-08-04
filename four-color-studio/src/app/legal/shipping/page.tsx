import Link from "next/link";

export const metadata = {
  title: "Shipping Policy - 3DPress USA",
};

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-gunmetal text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 md:px-8">

        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-brushed-aluminum">
          Legal
        </div>
        <h1 className="font-display text-4xl uppercase tracking-tight">Shipping Policy</h1>
        <p className="mt-2 text-sm text-brushed-aluminum/60">Last updated: April 14, 2026</p>

        <div className="mt-10 space-y-10 text-brushed-aluminum leading-7">

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Where we ship from</h2>
            <p>
              All orders are printed and shipped from <strong className="text-white">East Windsor,
              New Jersey</strong>. Made in America, shipped in America.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Print time</h2>
            <p>
              Your caps are printed after you order - not pulled from a shelf. Production time
              may vary based on demand. We print as fast as we responsibly can and will notify
              you by email when your order ships.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Shipping carrier &amp; transit time</h2>
            <p>
              We ship via <strong className="text-white">USPS</strong>. Transit time after
              shipping is typically <strong className="text-white">2–5 business days</strong>{" "}
              depending on your location.
            </p>
            <p className="mt-3">
              You&apos;ll receive a tracking number by email as soon as your package is handed off
              to USPS. If you don&apos;t see it, check your spam folder - or just email us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Shipping cost</h2>
            <p>
              Shipping is calculated at checkout based on package weight, and becomes free
              automatically once your order reaches $50. Below that, here&apos;s what we charge:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-brushed-aluminum">
              <li>Up to 8 oz - $7.49</li>
              <li>Up to 12 oz - $7.99</li>
              <li>Up to 16 oz - $8.49</li>
              <li>Up to 2 lb - $8.99</li>
              <li>Up to 3 lb - $9.49</li>
              <li>Up to 5 lb - $9.99</li>
              <li>Over 5 lb - $9.99 + $0.50 per additional pound</li>
            </ul>
            <p className="mt-3">
              The actual cost of postage will sometimes exceed the shipping charge above - we
              cover the remainder.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Domestic only</h2>
            <p>
              We currently ship within the <strong className="text-white">contiguous United States</strong> only.
              Alaska, Hawaii, and US territories: reach out at{" "}
              <a href="mailto:info@3dpressusa.com" className="text-federal-blue underline underline-offset-2 hover:text-white">
                info@3dpressusa.com
              </a>{" "}
              and we&apos;ll see what we can do. International shipping is not available at this time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Lost or delayed packages</h2>
            <p>
              Once a package is in USPS hands, we can&apos;t control what happens - but we
              won&apos;t leave you hanging. If your tracking shows no movement for more than 7
              business days, email us at{" "}
              <a href="mailto:info@3dpressusa.com" className="text-federal-blue underline underline-offset-2 hover:text-white">
                info@3dpressusa.com
              </a>{" "}
              and we&apos;ll investigate and make it right.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-brushed-aluminum/15 pt-6">
          <Link href="/" className="text-sm text-brushed-aluminum transition hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
