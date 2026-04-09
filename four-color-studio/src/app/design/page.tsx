import FourColorDesignStudio from "@/components/FourColorDesignStudio";

export default function DesignPage() {
  return (
    <>
      {/* Desktop: show the studio */}
      <div className="hidden md:block">
        <FourColorDesignStudio />
      </div>

      {/* Mobile: hard block */}
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center md:hidden">
        <div className="text-5xl">🖥️</div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Desktop Only
        </h1>
        <p className="max-w-sm text-zinc-400 leading-7">
          The design studio requires a full-size screen. Open this page on a desktop or laptop to build your custom placard.
        </p>
        <a
          href="/collections"
          className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
        >
          Browse Collections Instead
        </a>
      </div>
    </>
  );
}
