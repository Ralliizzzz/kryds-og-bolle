"use server"

import { createClient } from "@/lib/supabase/server"
import type { BookingRow } from "@/types/database"
import { sendBookingConfirmedToCustomer, sendBookingCancelledToCustomer } from "@/lib/notify"
import { getDurationMinutes } from "@/lib/duration"
import type { DurationRange } from "@/lib/duration"

export async function updateBookingStatus(
  bookingId: string,
  status: BookingRow["status"]
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Ikke autoriseret")

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("company_id", user.id)

  if (error) throw new Error("Kunne ikke opdatere booking")

  // Send email til kunden ved statusskift
  if (status === "confirmed" || status === "cancelled") {
    const [bookingResult, settingsResult] = await Promise.all([
      supabase
        .from("bookings")
        .select("scheduled_at, lead:leads(name, email, address, sqm, property_type, price), company:companies(company_name, email, phone)")
        .eq("id", bookingId)
        .single(),
      supabase
        .from("quote_settings")
        .select("duration_ranges")
        .eq("company_id", user.id)
        .single(),
    ])

    if (bookingResult.data) {
      const booking = bookingResult.data
      const lead = booking.lead as unknown as { name: string; email: string | null; address: string; sqm: number | null; property_type: string | null; price: number } | null
      const company = booking.company as unknown as { company_name: string; email: string; phone: string | null } | null
      const durationRanges = ((settingsResult.data?.duration_ranges ?? []) as DurationRange[])
      const durationMinutes = getDurationMinutes(lead?.sqm ?? null, durationRanges)
      if (lead?.email && company) {
        const notify = status === "confirmed"
          ? sendBookingConfirmedToCustomer(company, lead, booking.scheduled_at, durationMinutes)
          : sendBookingCancelledToCustomer(company, lead, booking.scheduled_at, durationMinutes)
        await notify.catch((e) => console.error("[notify] Statusmail fejlede:", e))
      }
    }
  }
}
