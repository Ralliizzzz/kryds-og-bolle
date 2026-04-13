import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { OpeningHours } from "@/types/settings"
import SettingsForm from "./SettingsForm"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const result = await supabase
    .from("quote_settings")
    .select("opening_hours")
    .eq("company_id", user.id)
    .single()

  const row = result.data as Pick<QuoteSettingsRow, "opening_hours"> | null

  const openingHours = (row?.opening_hours ?? {
    mon: { open: "08:00", close: "16:00" },
    tue: { open: "08:00", close: "16:00" },
    wed: { open: "08:00", close: "16:00" },
    thu: { open: "08:00", close: "16:00" },
    fri: { open: "08:00", close: "16:00" },
    sat: null,
    sun: null,
  }) as unknown as OpeningHours

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Indstillinger</h1>
      <p className="text-sm text-gray-500 mb-8">
        Konfigurer åbningstider og embed-kode til din widget.
      </p>
      <SettingsForm initialOpeningHours={openingHours} companyId={user.id} />
    </div>
  )
}
