import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PetCoasterApproval from "@/components/PetCoasterApproval";
import MessageThread, { type PetDesignMessage } from "@/components/MessageThread";

export default async function PetCoasterApprovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await prisma.petDesignRequest.findUnique({ where: { approvalToken: token } });
  if (!request || request.proposalImageUrls.length === 0) notFound();

  return (
    <main className="min-h-screen bg-gunmetal px-6 py-14 text-white md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-brushed-aluminum">Pet Coasters</div>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-tight md:text-4xl">Build your coaster set</h1>
        <p className="mt-3 text-brushed-aluminum">
          Hi {request.customerName ?? "there"} — here are the designs we put together for your pet. Pick a favorite
          for each of your 4 coasters below.
        </p>

        <div className="mt-8">
          <PetCoasterApproval
            requestId={request.id}
            approvalToken={request.approvalToken}
            proposalImageUrls={request.proposalImageUrls}
            initialSelections={request.approvedSelections}
          />
        </div>

        <div className="mt-8">
          <MessageThread
            requestId={request.id}
            messages={request.messages as unknown as PetDesignMessage[]}
            viewerRole="customer"
            token={request.approvalToken}
          />
        </div>
      </div>
    </main>
  );
}
