import Link from "next/link";

export default function StubPage() {
    return (
        <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
            <div className="mx-auto max-w-4xl rounded-3xl border-2 border-red-500 bg-red-950/30 p-8">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
                    unfinished page
                </div>
                <h1 className="mt-3 text-4xl font-black">
                    HEY MOTHER FUCKER — THIS PAGE STILL NEEDS TO BE BUILT
                </h1>
                <p className="mt-4 text-lg text-red-100/80">
                    This stub exists on purpose so broken navigation never hides unfinished work.
                </p>
                <div className="mt-6">
                    <Link
                        href="/"
                        className="rounded-full bg-white px-6 py-3 text-sm font-black text-black"
                    >
                        Back Home
                    </Link>
                </div>
            </div>
        </main>
    );
}