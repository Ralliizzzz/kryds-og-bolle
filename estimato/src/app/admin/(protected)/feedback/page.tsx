import { createServiceClient } from "@/lib/supabase/server"
import type { FeedbackRow, CompanyRow } from "@/types/database"

type FeedbackWithCompany = FeedbackRow & {
  companies: Pick<CompanyRow, "company_name" | "email"> | null
}

export default async function AdminFeedbackPage() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from("feedback")
    .select("*, companies(company_name, email)")
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as FeedbackWithCompany[]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Feedback</h1>

      {rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center text-gray-400">
          Ingen feedback endnu
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {row.companies?.company_name ?? "Ukendt firma"}
                  </p>
                  <p className="text-xs text-gray-400">{row.companies?.email ?? ""}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(row.created_at).toLocaleString("da-DK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
