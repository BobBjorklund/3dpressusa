import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import AdminKeyGate from "@/components/AdminKeyGate";
import { prisma } from "@/lib/prisma";
import ProposalUploadForm from "@/components/ProposalUploadForm";
import MessageThread, { type PetDesignMessage } from "@/components/MessageThread";

export default async function AdminPetDesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) return <AdminKeyGate />;

  const { id } = await params;
  const request = await prisma.petDesignRequest.findUnique({ where: { id } });
  if (!request) notFound();

  return (
    <main className="min-h-screen bg-gunmetal px-6 py-10 text-white md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-hazard-yellow inline-block">
          {request.status}
        </div>
        <h1 className="mt-3 font-display text-2xl uppercase text-white">
          {request.customerName ?? request.customerEmail}
        </h1>
        <p className="mt-1 text-sm text-brushed-aluminum">{request.customerEmail}</p>

        <div className="mt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">
            {request.originalImageUrls.length > 1 ? `${request.originalImageUrls.length} Pets` : "Original Photo"}
          </div>
          <div className={`mt-2 grid gap-2 ${request.originalImageUrls.length > 1 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1"}`}>
            {request.originalImageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="max-h-[400px] w-full rounded-sm bg-steel-panel object-contain"
              />
            ))}
          </div>
        </div>

        {request.notes && (
          <div className="mt-4 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">
              Customer Notes
            </div>
            <p className="mt-2 text-sm text-white">{request.notes}</p>
          </div>
        )}

        {request.proposalImageUrls.length > 0 && (
          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">
              Sent Proposals
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {request.proposalImageUrls.map((url) => (
                <img key={url} src={url} alt="" className="aspect-square rounded-sm object-cover" />
              ))}
            </div>
          </div>
        )}

        {request.approvedSelections.length === 4 && (
          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-hazard-yellow">
              Customer's Approved Set
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {request.approvedSelections.map((url, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <img src={url} alt="" className="aspect-square w-full rounded-sm object-cover" />
                  <span className="font-mono text-[10px] text-brushed-aluminum">Coaster {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <ProposalUploadForm requestId={request.id} />
        </div>

        <div className="mt-6">
          <MessageThread
            requestId={request.id}
            messages={request.messages as unknown as PetDesignMessage[]}
            viewerRole="admin"
          />
        </div>
      </div>
    </main>
  );
}
