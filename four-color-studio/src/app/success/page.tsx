import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-black tracking-tight">Order placed!</h1>
          <p className="mt-3 text-base text-white/60 leading-7">
            Thanks for your order. You&apos;ll get a confirmation email shortly. We&apos;ll start printing as soon as it arrives.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/collections"
            className="rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
          >
            Keep Shopping
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-white/30">
          Questions?{" "}
          <a href="mailto:info@3dpressusa.com" className="underline underline-offset-2 hover:text-white/60 transition">
            info@3dpressusa.com
          </a>
        </p>
      </div>
    </main>
  );
}
