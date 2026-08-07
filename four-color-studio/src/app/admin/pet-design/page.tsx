import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import AdminKeyGate from "@/components/AdminKeyGate";
import { prisma } from "@/lib/prisma";

export default async function AdminPetDesignListPage() {
  if (!(await isAdmin())) return <AdminKeyGate />;

  const requests = await prisma.petDesignRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gunmetal px-6 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl uppercase text-white">Pet Design Requests</h1>

        <div className="mt-6 flex flex-col gap-3">
          {requests.length === 0 && <p className="text-brushed-aluminum">No requests yet.</p>}
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/admin/pet-design/${r.id}`}
              className="flex items-center gap-4 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4 transition hover:border-brushed-aluminum/45"
            >
              <img src={r.originalImageUrls[0]} alt="" className="h-16 w-16 flex-shrink-0 rounded-sm object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{r.customerName ?? r.customerEmail}</div>
                <div className="truncate text-xs text-brushed-aluminum">{r.customerEmail}</div>
              </div>
              <div className="flex-shrink-0 rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-2 py-1 font-mono text-[10px] uppercase text-hazard-yellow">
                {r.status}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
