import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { AddOn, Discount, IntervalRange, FlatRange, FrequencyDiscount, FrequencyKey, TransportFee } from "@/types/settings"
import { PREDEFINED_ADD_ONS, PREDEFINED_IDS } from "@/lib/predefined-add-ons"
import PriserForm from "./PriserForm"

export default async function PriserPage() {
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

  const initialData = {
    pricing_type: (row?.pricing_type ?? "interval") as "sqm" | "interval",
    price_per_sqm: row?.price_per_sqm ?? null,
    interval_ranges: (row?.interval_ranges ?? []) as unknown as IntervalRange[],
    flat_ranges: (row?.flat_ranges ?? []) as unknown as FlatRange[],
    add_ons: (() => {
      const stored = (row?.add_ons ?? []) as unknown as AddOn[]
      const predefined = PREDEFINED_ADD_ONS.map(
        (p) => stored.find((a) => a.id === p.id) ?? { ...p, price: 0 }
      )
      const custom = stored.filter((a) => !PREDEFINED_IDS.has(a.id as never))
      return [...predefined, ...custom]
    })(),
    discounts: (row?.discounts ?? []) as unknown as Discount[],
    minimum_price: row?.minimum_price ?? null,
    frequency_discounts: (() => {
      const stored = (row?.frequency_discounts ?? []) as unknown as FrequencyDiscount[]
      const defaults: { frequency: FrequencyKey; label: string }[] = [
        { frequency: "weekly", label: "Ugentlig" },
        { frequency: "every2weeks", label: "Hver 2. uge" },
        { frequency: "every3weeks", label: "Hver 3. uge" },
        { frequency: "every4weeks", label: "Hver 4. uge" },
      ]
      return defaults.map((d) => {
        const found = stored.find((s) => s.frequency === d.frequency)
        return found ?? { frequency: d.frequency, discount_percentage: 0, enabled: false }
      })
    })(),
    transport_fee: ((row?.transport_fee ?? {}) as unknown as Partial<TransportFee>).enabled !== undefined
      ? (row!.transport_fee as unknown as TransportFee)
      : { enabled: false, base_distance_km: 0, price_per_km: 0 },
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Priser og tillæg</h1>
      <p className="text-sm text-gray-500 mb-8">
        Ændringer træder i kraft i widget&apos;en inden for 60 sekunder.
      </p>
      <PriserForm initialData={initialData} />
    </div>
  )
}
