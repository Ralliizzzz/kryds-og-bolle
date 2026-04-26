"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { LeadRow } from "@/types/database"
import { updateLeadStatus } from "./actions"

const STATUS_LABEL: Record<string, string> = {
  new: "Ny", contacted: "Kontaktet", booked: "Booket",
}
const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-50 text-blue-600",
  contacted: "bg-amber-50 text-amber-600",
  booked: "bg-emerald-50 text-emerald-600",
}
const ACTION_LABEL: Record<string, string> = {
  book: "Booking", callback: "Ring op", email: "Email",
}
const ACTION_STYLE: Record<string, string> = {
  book: "bg-violet-50 text-violet-600",
  callback: "bg-orange-50 text-orange-600",
  email: "bg-gray-100 text-gray-500",
}

interface Props {
  leads: LeadRow[]
  counts: { all: number; new: number; contacted: number; booked: number }
  activeStatus: string
}

export default function LeadsTable({ leads, counts, activeStatus }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tabs = [
    { key: "all", label: "Alle", count: counts.all },
    { key: "new", label: "Nye", count: counts.new },
    { key: "contacted", label: "Kontaktet", count: counts.contacted },
    { key: "booked", label: "Booket", count: counts.booked },
  ]

  function navigate(status: string) {
    router.push(`/dashboard/leads${status === "all" ? "" : `?status=${status}`}`)
  }

  function handleStatusChange(leadId: string, newStatus: string) {
    startTransition(async () => {
      await updateLeadStatus(leadId, newStatus as LeadRow["status"])
      router.refresh()
    })
  }

  return (
    <>
      {/* Tabs */}
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

      {/* Tom tilstand */}
      {leads.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
          <p className="text-gray-300 text-4xl mb-3">📭</p>
          <p className="text-sm text-gray-500 font-medium">Ingen leads</p>
          {activeStatus === "all" && (
            <p className="text-xs text-gray-400 mt-1">
              <Link href="/dashboard/embed" className="text-blue-600 hover:underline font-medium">
                Installer widget&apos;en
              </Link>{" "}
              for at begynde at modtage leads.
            </p>
          )}
        </div>
      )}

      {/* Leads */}
      {leads.length > 0 && (
        <div className="flex flex-col gap-2">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
              {/* Hoved-række */}
              <div
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[lead.status]}`}>
                      {STATUS_LABEL[lead.status]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLE[lead.action_type]}`}>
                      {ACTION_LABEL[lead.action_type]}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-400 truncate">{lead.address}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {lead.price.toLocaleString("da-DK")} kr
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                  </p>
                </div>

                <svg
                  className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedId === lead.id ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Udvidet */}
              {expandedId === lead.id && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
                    {lead.email && (
                      <Detail label="Email">
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                      </Detail>
                    )}
                    {lead.phone && (
                      <Detail label="Telefon">
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">{lead.phone}</a>
                      </Detail>
                    )}
                    {lead.sqm && <Detail label="Størrelse">{lead.sqm} m²</Detail>}
                    {lead.property_type && (
                      <Detail label="Ejendomstype">
                        {{ house: "Villa/Hus", apartment: "Lejlighed", commercial: "Erhverv" }[lead.property_type] ?? lead.property_type}
                      </Detail>
                    )}
                    <Detail label="Modtaget">
                      {new Date(lead.created_at).toLocaleString("da-DK", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </Detail>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                    <div className="flex gap-2">
                      {(["new", "contacted", "booked"] as const).map((s) => (
                        <button
                          key={s}
                          disabled={lead.status === s || isPending}
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, s) }}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                            lead.status === s
                              ? `${STATUS_STYLE[s]} border-current cursor-default`
                              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                          } disabled:opacity-50`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-gray-700">{children}</p>
    </div>
  )
}
