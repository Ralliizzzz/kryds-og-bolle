"use server"

import { createClient } from "@/lib/supabase/server"
import type { OpeningHours } from "@/types/settings"

export async function saveSettings(openingHours: OpeningHours): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Ikke autoriseret" }

  const { error } = await supabase
    .from("quote_settings")
    .update({ opening_hours: openingHours })
    .eq("company_id", user.id)

  if (error) return { error: "Kunne ikke gemme indstillinger" }
  return {}
}
