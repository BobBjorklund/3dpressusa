import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - 3DPress USA",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gunmetal text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 md:px-8">

        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-brushed-aluminum">
          Legal
        </div>
        <h1 className="font-display text-4xl uppercase tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-brushed-aluminum/60">Last updated: April 14, 2026</p>

        <div className="mt-10 space-y-10 text-brushed-aluminum leading-7">

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">The short version</h2>
            <p>
              We collect only what we need to fulfill your order and send you a receipt. We
              don&apos;t sell your data, we don&apos;t build profiles on you, and we don&apos;t
              send marketing spam. We&apos;re a small American business - not a data broker.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">What we collect</h2>
            <p>When you place an order we collect:</p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-brushed-aluminum">
              <li>Your name and email address</li>
              <li>Your shipping address</li>
              <li>Your order contents and total</li>
            </ul>
            <p className="mt-3">
              We <strong className="text-white">never see your payment card details.</strong> All
              payment processing is handled directly by{" "}
              <a href="https://stripe.com/privacy" className="text-federal-blue underline underline-offset-2 hover:text-white" target="_blank" rel="noopener noreferrer">Stripe</a>.
              Your card number, CVV, and billing details go straight to Stripe and never touch
              our servers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">How we use it</h2>
            <ul className="list-disc list-inside space-y-1 text-brushed-aluminum">
              <li>To fulfill and ship your order</li>
              <li>To send you an order confirmation email via Brevo</li>
              <li>To contact you if there&apos;s a problem with your order</li>
            </ul>
            <p className="mt-3">
              That&apos;s it. We don&apos;t use your information for advertising, we don&apos;t
              add you to marketing lists, and we don&apos;t share it with third parties beyond
              what&apos;s necessary to ship your package (i.e., USPS gets your address).
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Cookies</h2>
            <p>
              We use only the cookies required for the site to function - specifically, your
              shopping cart state and what Stripe needs to process checkout. We don&apos;t run
              ad trackers, analytics pixels, or any third-party tracking scripts.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">How long we keep your data</h2>
            <p>
              We retain order records for as long as required to handle warranty claims,
              chargebacks, or disputes - typically no longer than 2 years. Stripe retains
              payment records per their own retention policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Your rights</h2>
            <p>
              You can request a copy of the data we hold on you, ask us to correct it, or ask
              us to delete it. Email{" "}
              <a href="mailto:info@3dpressusa.com" className="text-federal-blue underline underline-offset-2 hover:text-white">
                info@3dpressusa.com
              </a>{" "}
              and we&apos;ll take care of it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Contact</h2>
            <p>
              Questions about this policy? Reach us at{" "}
              <a href="mailto:info@3dpressusa.com" className="text-federal-blue underline underline-offset-2 hover:text-white">
                info@3dpressusa.com
              </a>.
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
