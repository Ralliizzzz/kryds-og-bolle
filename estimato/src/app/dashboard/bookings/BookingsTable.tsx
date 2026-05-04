"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { BookingWithLead } from "./page"
import { updateBookingStatus } from "./actions"

const STATUS_LABEL: Record<string, string> = {
  pending: "Afventer",
  confirmed: "Bekræftet",
  cancelled: "Aflyst",
}
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-gray-100 text-gray-400",
}
const PROPERTY_LABEL: Record<string, string> = {
  house: "Villa / Hus", apartment: "Lejlighed", commercial: "Erhverv",
}

interface Props {
  upcoming: BookingWithLead[]
  past: BookingWithLead[]
  counts: { all: number; pending: number; confirmed: number; cancelled: number }
  activeStatus: string
}

export default function BookingsTable({ upcoming, past, counts, activeStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const tabs = [
    { key: "all", label: "Alle", count: counts.all },
    { key: "pending", label: "Afventer", count: counts.pending },
    { key: "confirmed", label: "Bekræftede", count: counts.confirmed },
    { key: "cancelled", label: "Aflyste", count: counts.cancelled },
  ]

  function navigate(status: string) {
    router.push(`/dashboard/bookings${status === "all" ? "" : `?status=${status}`}`)
  }

  function handleStatusChange(bookingId: string, status: BookingWithLead["status"]) {
    startTransition(async () => {
      await updateBookingStatus(bookingId, status)
      router.refresh()
    })
  }

  const totalVisible = upcoming.length + past.length

  return (
    <>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeStatus === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeStatus === tab.key ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-400"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {totalVisible === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
          <p className="text-gray-300 text-4xl mb-3">📅</p>
          <p className="text-sm text-gray-500 font-medium">Ingen bookinger</p>
          <p className="text-xs text-gray-400 mt-1">
            Bookinger oprettes når kunder vælger &quot;Book tid&quot; i widget&apos;en.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kommende</p>
          <div className="flex flex-col gap-2">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} isPending={isPending} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tidligere</p>
          <div className="flex flex-col gap-2 opacity-60">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} isPending={isPending} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function BookingCard({
  booking: b,
  isPending,
  onStatusChange,
}: {
  booking: BookingWithLead
  isPending: boolean
  onStatusChange: (id: string, status: BookingWithLead["status"]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(b.scheduled_at)
  const isToday = new Date().toDateString() === date.toDateString()
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString()

  const dayLabel = isToday
    ? "I dag"
    : isTomorrow
    ? "I morgen"
    : date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })

  const timeLabel = date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const breakdown = b.lead.price_breakdown
  const logistics = b.lead.logistics

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
      {/* Hoved-række */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Dato-boks */}
          <div className="shrink-0 w-14 text-center bg-gray-50 rounded-xl py-2 px-1 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase">
              {date.toLocaleDateString("da-DK", { month: "short" })}
            </p>
            <p className="text-xl font-bold leading-tight text-gray-800">{date.getDate()}</p>
            <p className="text-xs text-blue-600 font-semibold">{timeLabel}</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[b.status]}`}>
                {STATUS_LABEL[b.status]}
              </span>
              {isToday && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-600 text-white">
                  I dag
                </span>
              )}
            </div>
            <p className="font-semibold text-sm text-gray-900">{b.lead.name}</p>
            <p className="text-xs text-gray-400 truncate">{b.lead.address}</p>

            <div className="flex items-center gap-3 mt-2">
              {b.lead.phone && (
                <a href={`tel:${b.lead.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 5.93 5.93l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
                  </svg>
                  {b.lead.phone}
                </a>
              )}
              {b.lead.email && (
                <a href={`mailto:${b.lead.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {b.lead.email}
                </a>
              )}
              <span className="text-xs text-gray-400 ml-auto font-semibold">
                {b.lead.price.toLocaleString("da-DK")} kr
              </span>
            </div>
          </div>

          <svg
            className={`w-4 h-4 text-gray-300 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Dag-label + status-knapper */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 capitalize">{dayLabel}</p>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {b.status !== "confirmed" && b.status !== "cancelled" && (
              <button
                disabled={isPending}
                onClick={() => onStatusChange(b.id, "confirmed")}
                className="text-xs px-3 py-1.5 rounded-lg font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                Bekræft
              </button>
            )}
            {b.status !== "cancelled" && (
              <button
                disabled={isPending}
                onClick={() => onStatusChange(b.id, "cancelled")}
                className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Aflys
              </button>
            )}
            {b.status === "cancelled" && (
              <button
                disabled={isPending}
                onClick={() => onStatusChange(b.id, "pending")}
                className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                Genåbn
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Udvidet detaljevisning */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/40">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
            {b.lead.sqm && <Detail label="Størrelse">{b.lead.sqm} m²</Detail>}
            {b.lead.property_type && (
              <Detail label="Ejendomstype">{PROPERTY_LABEL[b.lead.property_type] ?? b.lead.property_type}</Detail>
            )}
          </div>

          {/* Logistik */}
          {logistics && (() => {
            const h = Math.floor(logistics.drive_minutes / 60)
            const m = logistics.drive_minutes % 60
            const driveLabel = h > 0 ? `${h} t ${m > 0 ? `${m} min` : ""}`.trim() : `${m} min`
            return (
              <div className="mb-4 bg-white border border-gray-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Logistik</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span className="font-medium text-gray-700">{logistics.nearest_branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>{logistics.distance_km} km</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{driveLabel} kørsel</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Prisspecifikation */}
          {breakdown && (
            <div className="mb-4 bg-white border border-gray-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prisspecifikation</p>
              <div className="space-y-1">
                <PriceLine label={`Grundpris${b.lead.sqm ? ` (${b.lead.sqm} m²)` : ""}`} value={`${Number(breakdown.base ?? 0).toLocaleString("da-DK")} kr`} />
                {Array.isArray(breakdown.add_ons) && breakdown.add_ons.map((a: Record<string, unknown>, i: number) => (
                  <PriceLine key={i} label={String(a.name)} value={`+${Number(a.price).toLocaleString("da-DK")} kr`} />
                ))}
                {!!breakdown.transport_fee && (
                  <PriceLine label="Kørsel" value={`+${Number((breakdown.transport_fee as Record<string, unknown>).amount ?? 0).toLocaleString("da-DK")} kr`} />
                )}
                {!!breakdown.discount && (
                  <PriceLine label={String((breakdown.discount as Record<string, unknown>).name)} value={`${Number((breakdown.discount as Record<string, unknown>).value ?? 0).toLocaleString("da-DK")} kr`} green />
                )}
                {!!breakdown.frequency_discount && (
                  <PriceLine label={String((breakdown.frequency_discount as Record<string, unknown>).name)} value={`${Number((breakdown.frequency_discount as Record<string, unknown>).value ?? 0).toLocaleString("da-DK")} kr`} green />
                )}
                <div className="pt-1 mt-1 border-t border-gray-100 flex justify-between">
                  <span className="text-xs font-bold text-gray-700">I alt inkl. moms</span>
                  <span className="text-sm font-bold text-gray-900">{b.lead.price.toLocaleString("da-DK")} kr</span>
                </div>
              </div>
            </div>
          )}

          {/* Kommentarer */}
          {b.lead.notes && (
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Kommentarer</p>
              <p className="text-sm text-gray-700 leading-relaxed">{b.lead.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  )
}

function PriceLine({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${green ? "text-green-600" : "text-gray-500"}`}>{label}</span>
      <span className={`text-xs font-semibold ${green ? "text-green-600" : "text-gray-700"}`}>{value}</span>
    </div>
  )
}
