"use server"

import { createClient } from "@/lib/supabase/server"
import type { QuoteSettingsData } from "@/types/settings"

export async function saveSettings(data: QuoteSettingsData): Promise<{ error?: string }> {
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
      add_ons: data.add_ons,
      discounts: data.discounts,
      minimum_price: data.minimum_price,
      opening_hours: data.opening_hours,
    })
    .eq("company_id", user.id)

  if (error) return { error: "Kunne ikke gemme indstillinger" }
  return {}
}
