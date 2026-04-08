import { createClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [leadsCountResult, bookingsCountResult, recentLeadsResult] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user!.id),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user!.id),
      supabase
        .from("leads")
        .select("id, name, address, price, status, action_type, created_at")
        .eq("company_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const leadsCount = leadsCountResult.count
  const bookingsCount = bookingsCountResult.count
  const recentLeads = recentLeadsResult.data as Pick<LeadRow, "id" | "name" | "address" | "price" | "status" | "action_type" | "created_at">[] | null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Oversigt</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <StatCard label="Leads i alt" value={leadsCount ?? 0} />
        <StatCard label="Bookinger" value={bookingsCount ?? 0} />
      </div>

      <h2 className="text-base font-semibold mb-3">Seneste leads</h2>
      {recentLeads && recentLeads.length > 0 ? (
        <div className="flex flex-col gap-2">
          {recentLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-gray-500 text-xs">{lead.address}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{lead.price.toLocaleString("da-DK")} kr</p>
                <StatusBadge status={lead.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Ingen leads endnu. Installer widget'en for at komme i gang.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-100 rounded-xl px-4 py-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "Ny",
    contacted: "Kontaktet",
    booked: "Booket",
  };
  const colors: Record<string, string> = {
    new: "bg-blue-50 text-blue-600",
    contacted: "bg-yellow-50 text-yellow-600",
    booked: "bg-green-50 text-green-600",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {map[status] ?? status}
    </span>
  );
}
