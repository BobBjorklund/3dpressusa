export default function FixedPageBackground({
  src,
  overlay = "bg-zinc-950/75",
}: {
  src: string;
  overlay?: string;
}) {
  return (
    <div className="fixed inset-0 -z-10">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <div className={`absolute inset-0 ${overlay}`} />
    </div>
  );
}
