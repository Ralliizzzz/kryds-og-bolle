import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { AddOn, Discount, IntervalRange, OpeningHours } from "@/types/settings"
import SettingsForm from "./SettingsForm"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const result = await supabase
    .from("quote_settings")
    .select("*")
    .eq("company_id", user.id)
    .single()

  const row = result.data as QuoteSettingsRow | null

  // Normaliser JSONB-felter til korrekte typer
  const settings = {
    pricing_type: (row?.pricing_type ?? "sqm") as "sqm" | "interval",
    price_per_sqm: row?.price_per_sqm ?? null,
    interval_ranges: (row?.interval_ranges ?? []) as unknown as IntervalRange[],
    add_ons: (row?.add_ons ?? []) as unknown as AddOn[],
    discounts: (row?.discounts ?? []) as unknown as Discount[],
    minimum_price: row?.minimum_price ?? null,
    opening_hours: (row?.opening_hours ?? {
      mon: { open: "08:00", close: "16:00" },
      tue: { open: "08:00", close: "16:00" },
      wed: { open: "08:00", close: "16:00" },
      thu: { open: "08:00", close: "16:00" },
      fri: { open: "08:00", close: "16:00" },
      sat: null,
      sun: null,
    }) as unknown as OpeningHours,
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Indstillinger</h1>
      <p className="text-sm text-gray-500 mb-8">
        Ændringer træder i kraft i widget&apos;en inden for 60 sekunder.
      </p>
      <SettingsForm initialSettings={settings} companyId={user.id} />
    </div>
  )
}
