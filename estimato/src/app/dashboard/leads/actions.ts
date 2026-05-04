"use server"

import { createClient } from "@/lib/supabase/server"
import type { LeadRow } from "@/types/database"
import { sendBookingConfirmedToCustomer } from "@/lib/notify"
import { getDurationMinutes } from "@/lib/duration"
import type { DurationRange } from "@/lib/duration"

export async function updateLeadStatus(
  leadId: string,
  status: LeadRow["status"]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Ikke autoriseret")

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("company_id", user.id)

  if (error) throw new Error("Kunne ikke opdatere status")
}

export async function bookLeadForCustomer(leadId: string, scheduledAt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Ikke autoriseret")

  const [leadResult, settingsResult, companyResult] = await Promise.all([
    supabase.from("leads").select("id, name, email, address, sqm, property_type, price").eq("id", leadId).eq("company_id", user.id).single(),
    supabase.from("quote_settings").select("duration_ranges").eq("company_id", user.id).single(),
    supabase.from("companies").select("company_name, email, phone").eq("id", user.id).single(),
  ])

  if (!leadResult.data) throw new Error("Lead ikke fundet")

  const [, bookingResult] = await Promise.all([
    supabase.from("leads").update({ status: "booked" }).eq("id", leadId).eq("company_id", user.id),
    supabase.from("bookings").insert({ company_id: user.id, lead_id: leadId, scheduled_at: scheduledAt, status: "confirmed" }).select("id").single(),
  ])

  if (bookingResult.error) throw new Error("Kunne ikke oprette booking")

  const lead = leadResult.data
  const company = companyResult.data
  if (lead.email && company) {
    const durationMinutes = getDurationMinutes(lead.sqm ?? null, (settingsResult.data?.duration_ranges ?? []) as DurationRange[])
    await sendBookingConfirmedToCustomer(company, lead, scheduledAt, durationMinutes).catch((e) =>
      console.error("[notify] Bekræftelsesmail fejlede:", e)
    )
  }
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Ikke autoriseret")

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("company_id", user.id)

  if (error) throw new Error("Kunne ikke slette lead")
}
