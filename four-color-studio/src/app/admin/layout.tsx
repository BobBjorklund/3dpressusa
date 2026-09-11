import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import AdminKeyGate from "@/components/AdminKeyGate";

// Shared shell for every /admin/* route — gates once here instead of every
// page repeating its own isAdmin() check, and gives Orders + Pet Design one
// cohesive nav instead of two siloed admin areas.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return <AdminKeyGate />;

  return (
    <div className="min-h-screen bg-gunmetal text-white">
      <nav className="border-b border-brushed-aluminum/20 bg-steel-panel px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <span className="font-display text-sm uppercase tracking-wide text-brushed-aluminum">Admin</span>
          <Link href="/admin/orders" className="font-mono text-xs uppercase tracking-wide text-white/80 transition hover:text-white">
            Orders
          </Link>
          <Link href="/admin/pet-design" className="font-mono text-xs uppercase tracking-wide text-white/80 transition hover:text-white">
            Pet Design
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
