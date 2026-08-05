import SpecPlate from "@/components/SpecPlate";
import PetPhotoUploadForm from "@/components/PetPhotoUploadForm";

export const metadata = {
  title: "Put Your Pet on a Coaster - 3DPress USA",
};

export default function PetCoastersPage() {
  return (
    <main className="min-h-screen bg-gunmetal text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 md:px-8">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-brushed-aluminum">
          Custom Work
        </div>
        <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
          Put your pet on a coaster
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-brushed-aluminum">
          Send us a photo of your dog, cat, or whatever else you've got running around the house. We'll turn it into
          a few print-ready design options and email them back to you. Pick your favorites, mix and match across a
          set of 4, and we'll print it.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", label: "Send us a photo" },
            { step: "2", label: "We email back design ideas" },
            { step: "3", label: "Pick your set, $35 for 4" },
          ].map((s) => (
            <div key={s.step} className="rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-hazard-yellow">Step {s.step}</div>
              <div className="mt-1 text-sm text-white">{s.label}</div>
            </div>
          ))}
        </div>

        <SpecPlate accent="red" className="mt-10 p-6 md:p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Get Started</div>
          <h2 className="mt-2 font-display text-2xl uppercase text-white">Send us your pet</h2>
          <p className="mt-2 text-sm text-brushed-aluminum">
            Got design ideas already? Tell us below. Otherwise just send the photo — we'll come up with a few options
            for you.
          </p>
          <div className="mt-6">
            <PetPhotoUploadForm />
          </div>
        </SpecPlate>
      </div>
    </main>
  );
}
