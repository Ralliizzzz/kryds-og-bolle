"use client"

import { useState } from "react"
import { extendTrial, setStatus, deleteCompany } from "../actions"
import type { SubscriptionStatus } from "@/types/database"

const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: "trial", label: "Prøveperiode" },
  { value: "active", label: "Aktiv" },
  { value: "cancelled", label: "Opsagt" },
  { value: "expired", label: "Udløbet" },
]

export default function CompanyActions({
  companyId,
  currentStatus,
}: {
  companyId: string
  currentStatus: SubscriptionStatus
}) {
  const [days, setDays] = useState(30)
  const [extending, setExtending] = useState(false)
  const [settingStatus, setSettingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExtend() {
    setExtending(true)
    setError(null)
    try {
      await extendTrial(companyId, days)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
    } finally {
      setExtending(false)
    }
  }

  async function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as SubscriptionStatus
    setSettingStatus(true)
    setError(null)
    try {
      await setStatus(companyId, status)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
    } finally {
      setSettingStatus(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Er du sikker? Dette sletter firmaet og alle dets data permanent.")) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCompany(companyId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          min={1}
          max={365}
          className="w-14 border border-gray-200 rounded px-1.5 py-1 text-xs"
        />
        <button
          onClick={handleExtend}
          disabled={extending}
          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          {extending ? "..." : "Forlæng trial"}
        </button>
      </div>
      <select
        defaultValue={currentStatus}
        onChange={handleStatus}
        disabled={settingStatus}
        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 text-left"
      >
        {deleting ? "Sletter..." : "Slet firma"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
