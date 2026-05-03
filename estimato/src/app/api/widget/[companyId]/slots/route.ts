import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getDurationMinutes } from "@/lib/duration"
import type { DurationRange } from "@/lib/duration"

function parseDateAndMinutes(iso: string): { date: string; minutesFromMidnight: number } | null {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  return {
    date: match[1],
    minutesFromMidnight: parseInt(match[2]) * 60 + parseInt(match[3]),
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")
  const mode = searchParams.get("mode")
  const sqmParam = searchParams.get("sqm")
  const sqm = sqmParam ? Number(sqmParam) : null

  const supabase = await createServiceClient()
  const { data: settings } = await supabase
    .from("quote_settings")
    .select("opening_hours, duration_ranges")
    .eq("company_id", companyId)
    .single()

  if (!settings) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 })
  }

  const openingHours = settings.opening_hours as Record<string, { open: string; close: string } | null>
  const durationRanges = (settings.duration_ranges ?? []) as DurationRange[]
  const durationMinutes = getDurationMinutes(sqm, durationRanges)

  const days = mode === "dates" ? 30 : 14
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + days)

  // Hent bookinger med lead's sqm for at beregne varighed pr. booking
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at, leads(sqm)")
    .eq("company_id", companyId)
    .neq("status", "cancelled")
    .gte("scheduled_at", today.toISOString())
    .lte("scheduled_at", future.toISOString())

  // Byg booking-intervaller per dato
  const bookingRanges: Record<string, { startMinutes: number; durationMinutes: number }[]> = {}
  for (const booking of existingBookings ?? []) {
    const parsed = parseDateAndMinutes(booking.scheduled_at)
    if (!parsed) continue
    const bLead = (booking.leads as unknown) as { sqm: number | null } | null
    const bDuration = getDurationMinutes(bLead?.sqm ?? null, durationRanges)
    if (!bookingRanges[parsed.date]) bookingRanges[parsed.date] = []
    bookingRanges[parsed.date].push({ startMinutes: parsed.minutesFromMidnight, durationMinutes: bDuration })
  }

  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const slots: string[] = []

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dayKey = dayNames[date.getDay()]
    const hours = openingHours[dayKey]
    if (!hours) continue

    const [openH] = hours.open.split(":").map(Number)
    const [closeH] = hours.close.split(":").map(Number)
    const closeMinutes = closeH * 60

    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    const dateKey = `${y}-${mo}-${dd}`
    const dayBookings = bookingRanges[dateKey] ?? []

    for (let h = openH; h < closeH; h++) {
      const slotStartMinutes = h * 60
      const slotEndMinutes = slotStartMinutes + durationMinutes

      if (slotEndMinutes > closeMinutes) break

      const overlaps = dayBookings.some(
        (b) => slotStartMinutes < b.startMinutes + b.durationMinutes && slotEndMinutes > b.startMinutes
      )

      if (!overlaps) {
        slots.push(`${dateKey}T${String(h).padStart(2, "0")}:00:00`)
      }
    }
  }

  if (mode === "dates") {
    const dates = [...new Set(slots.map((s) => s.substring(0, 10)))]
    return NextResponse.json(dates, {
      headers: { "Access-Control-Allow-Origin": "*" },
    })
  }

  const filtered = dateStr
    ? slots.filter((s) => s.startsWith(dateStr))
    : slots.slice(0, 20)

  return NextResponse.json(filtered, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  })
}
