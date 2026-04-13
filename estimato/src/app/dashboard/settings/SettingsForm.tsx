"use client"

import { useState, useTransition } from "react"
import type { OpeningHours, DayKey } from "@/types/settings"
import { saveSettings } from "./actions"

const DAY_LABELS: Record<string, string> = {
  mon: "Mandag",
  tue: "Tirsdag",
  wed: "Onsdag",
  thu: "Torsdag",
  fri: "Fredag",
  sat: "Lørdag",
  sun: "Søndag",
}
const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

interface Props {
  initialOpeningHours: OpeningHours
  companyId: string
}

export default function SettingsForm({ initialOpeningHours, companyId }: Props) {
  const [openingHours, setOpeningHours] = useState<OpeningHours>(initialOpeningHours)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleDay(day: DayKey, open: boolean) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: open ? { open: "08:00", close: "16:00" } : null,
    }))
    setSaved(false)
  }

  function updateHour(day: DayKey, field: "open" | "close", value: string) {
    const current = openingHours[day]
    if (!current) return
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...current, [field]: value },
    }))
    setSaved(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await saveSettings(openingHours)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Åbningstider ── */}
      <Section title="Åbningstider">
        <p className="text-sm text-gray-500 mb-4">
          Kunder kan kun booke tider inden for dit åbningstidsinterval.
        </p>
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => {
            const hours = openingHours[day]
            const isOpen = hours !== null
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={isOpen}
                    onChange={(e) => toggleDay(day, e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className={`text-sm font-medium cursor-pointer select-none ${
                      isOpen ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </label>
                </div>
                {isOpen ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      className={`${input} w-28 text-sm`}
                      value={hours!.open}
                      onChange={(e) => updateHour(day, "open", e.target.value)}
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      className={`${input} w-28 text-sm`}
                      value={hours!.close}
                      onChange={(e) => updateHour(day, "close", e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Lukket</span>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Gem-knap ── */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {isPending ? "Gemmer..." : "Gem indstillinger"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Gemt
          </span>
        )}
        {saveError && (
          <span className="text-sm text-red-500">{saveError}</span>
        )}
      </div>

      {/* ── Embed-kode ── */}
      <Section title="Embed-kode">
        <p className="text-sm text-gray-500 mb-3">
          Indsæt denne kode på din hjemmeside for at vise prisberegner-widget&apos;en.
        </p>
        <EmbedCode companyId={companyId} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function EmbedCode({ companyId }: { companyId: string }) {
  const [copied, setCopied] = useState(false)
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato.dk"

  const code = `<script src="${appUrl}/widget.js" data-company="${companyId}"></script>\n<div id="lead-widget"></div>`

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors font-medium"
      >
        {copied ? "Kopieret ✓" : "Kopiér"}
      </button>
    </div>
  )
}

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
