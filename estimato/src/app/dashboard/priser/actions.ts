"use server"

import { createClient } from "@/lib/supabase/server"
import type { AddOn, Discount, IntervalRange, FlatRange, FrequencyDiscount, TransportFee } from "@/types/settings"

export interface PriserData {
  pricing_type: "sqm" | "interval"
  price_per_sqm: number | null
  interval_ranges: IntervalRange[]
  flat_ranges: FlatRange[]
  add_ons: AddOn[]
  discounts: Discount[]
  minimum_price: number | null
  frequency_discounts: FrequencyDiscount[]
  transport_fee: TransportFee
}

export async function savePriser(data: PriserData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Ikke autoriseret" }

  const { error } = await supabase
    .from("quote_settings")
    .update({
      pricing_type: data.pricing_type,
      price_per_sqm: data.price_per_sqm,
      interval_ranges: data.interval_ranges,
      flat_ranges: data.flat_ranges,
      add_ons: data.add_ons,
      discounts: data.discounts,
      minimum_price: data.minimum_price,
      frequency_discounts: data.frequency_discounts,
      transport_fee: data.transport_fee,
    })
    .eq("company_id", user.id)

  if (error) return { error: "Kunne ikke gemme prisindstillinger" }
  return {}
}
