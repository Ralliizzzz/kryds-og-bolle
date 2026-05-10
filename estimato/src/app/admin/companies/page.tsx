import { createServiceClient } from "@/lib/supabase/server"
import type { CompanyRow } from "@/types/database"
import CompanyActions from "./CompanyActions"

const STATUS_LABELS: Record<string, string> = {
  trial: "Prøveperiode",
  active: "Aktiv",
  cancelled: "Opsagt",
  expired: "Udløbet",
}

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  expired: "bg-gray-100 text-gray-500",
}

export default async function AdminCompaniesPage() {
  const supabase = await createServiceClient()

  const [companiesResult, leadsResult] = await Promise.all([
    supabase.from("companies").select("*").order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])
  const companies = companiesResult.data as CompanyRow[] | null
  const leadsToday = leadsResult.count

  const rows: CompanyRow[] = companies ?? []
  const total = rows.length
  const active = rows.filter((c) => c.subscription_status === "active").length
  const trial = rows.filter((c) => c.subscription_status === "trial").length
  const cancelled = rows.filter(
    (c) => c.subscription_status === "cancelled" || c.subscription_status === "expired"
  ).length

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Firmaer</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Firmaer i alt", value: total },
          { label: "Aktive abonnenter", value: active },
          { label: "I prøveperiode", value: trial },
          { label: "Leads i dag", value: leadsToday ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Firma</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Trial slutter</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Oprettet</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((company) => (
              <tr key={company.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{company.company_name}</td>
                <td className="px-4 py-3 text-gray-600">{company.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[company.subscription_status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[company.subscription_status] ?? company.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(company.trial_end_date).toLocaleDateString("da-DK")}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(company.created_at).toLocaleDateString("da-DK")}
                </td>
                <td className="px-4 py-3">
                  <CompanyActions
                    companyId={company.id}
                    currentStatus={company.subscription_status}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Ingen firmaer endnu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
