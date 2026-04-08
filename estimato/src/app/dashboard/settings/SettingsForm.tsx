"use client"

import { useState, useTransition } from "react"
import type { QuoteSettingsData, AddOn, Discount, IntervalRange, DayKey } from "@/types/settings"
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
  initialSettings: QuoteSettingsData
  companyId: string
}

export default function SettingsForm({ initialSettings, companyId }: Props) {
  const [settings, setSettings] = useState<QuoteSettingsData>(initialSettings)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof QuoteSettingsData>(key: K, value: QuoteSettingsData[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await saveSettings(settings)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  // ── Tilvalg (add-ons) ──────────────────────────────────────────────────────
  function addAddOn() {
    const newAddOn: AddOn = { id: crypto.randomUUID(), name: "", price: 0 }
    update("add_ons", [...settings.add_ons, newAddOn])
  }
  function updateAddOn(id: string, field: keyof AddOn, value: string | number) {
    update(
      "add_ons",
      settings.add_ons.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    )
  }
  function removeAddOn(id: string) {
    update("add_ons", settings.add_ons.filter((a) => a.id !== id))
  }

  // ── Rabatter ───────────────────────────────────────────────────────────────
  function addDiscount() {
    const newDiscount: Discount = {
      id: crypto.randomUUID(),
      name: "",
      type: "percent",
      value: 10,
    }
    update("discounts", [...settings.discounts, newDiscount])
  }
  function updateDiscount(id: string, field: keyof Discount, value: string | number) {
    update(
      "discounts",
      settings.discounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }
  function removeDiscount(id: string) {
    update("discounts", settings.discounts.filter((d) => d.id !== id))
  }

  // ── Intervalpriser ─────────────────────────────────────────────────────────
  function addRange() {
    const last = settings.interval_ranges.at(-1)
    const newRange: IntervalRange = {
      min: last ? last.max + 1 : 0,
      max: last ? last.max + 20 : 20,
      price: 0,
    }
    update("interval_ranges", [...settings.interval_ranges, newRange])
  }
  function updateRange(idx: number, field: keyof IntervalRange, value: number) {
    update(
      "interval_ranges",
      settings.interval_ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    )
  }
  function removeRange(idx: number) {
    update(
      "interval_ranges",
      settings.interval_ranges.filter((_, i) => i !== idx)
    )
  }

  // ── Åbningstider ───────────────────────────────────────────────────────────
  function toggleDay(day: DayKey, open: boolean) {
    update("opening_hours", {
      ...settings.opening_hours,
      [day]: open ? { open: "08:00", close: "16:00" } : null,
    })
  }
  function updateHour(day: DayKey, field: "open" | "close", value: string) {
    const current = settings.opening_hours[day]
    if (!current) return
    update("opening_hours", {
      ...settings.opening_hours,
      [day]: { ...current, [field]: value },
    })
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── 1. Prismodel ── */}
      <Section title="Prismodel">
        <div className="flex gap-2 mb-4">
          {(["sqm", "interval"] as const).map((type) => (
            <button
              key={type}
              onClick={() => update("pricing_type", type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                settings.pricing_type === type
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {type === "sqm" ? "Kr. pr. m²" : "Intervalpriser"}
            </button>
          ))}
        </div>

        {settings.pricing_type === "sqm" && (
          <Field label="Pris pr. m² (kr)">
            <input
              type="number"
              min="0"
              className={input}
              value={settings.price_per_sqm ?? ""}
              onChange={(e) =>
                update("price_per_sqm", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="F.eks. 12"
            />
          </Field>
        )}

        {settings.pricing_type === "interval" && (
          <div>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Fra (m²)</span>
              <span>Til (m²)</span>
              <span>Pris (kr)</span>
              <span />
            </div>
            {settings.interval_ranges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.min}
                  onChange={(e) => updateRange(idx, "min", Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.max}
                  onChange={(e) => updateRange(idx, "max", Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.price}
                  onChange={(e) => updateRange(idx, "price", Number(e.target.value))}
                />
                <button
                  onClick={() => removeRange(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
                  title="Fjern"
                >
                  ×
                </button>
              </div>
            ))}
            <button onClick={addRange} className={btnSecondary}>
              + Tilføj interval
            </button>
          </div>
        )}

        <Field label="Minimumspris (kr, valgfri)" className="mt-4">
          <input
            type="number"
            min="0"
            className={input}
            value={settings.minimum_price ?? ""}
            onChange={(e) =>
              update("minimum_price", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="F.eks. 300"
          />
          <p className="text-xs text-gray-400 mt-1">
            Prisen vises aldrig lavere end dette beløb i widget&apos;en.
          </p>
        </Field>
      </Section>

      {/* ── 2. Tilvalg ── */}
      <Section title="Tilvalg">
        <p className="text-sm text-gray-500 mb-3">
          Ekstra ydelser kunden kan vælge til. Vises i widget&apos;en efter prisberegningen.
        </p>
        {settings.add_ons.length > 0 && (
          <div className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Navn</span>
            <span>Pris (kr)</span>
            <span />
          </div>
        )}
        {settings.add_ons.map((a) => (
          <div key={a.id} className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2">
            <input
              type="text"
              className={input}
              value={a.name}
              onChange={(e) => updateAddOn(a.id, "name", e.target.value)}
              placeholder="F.eks. Vinduespolering"
            />
            <input
              type="number"
              min="0"
              className={input}
              value={a.price}
              onChange={(e) => updateAddOn(a.id, "price", Number(e.target.value))}
            />
            <button
              onClick={() => removeAddOn(a.id)}
              className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={addAddOn} className={btnSecondary}>
          + Tilføj tilvalg
        </button>
      </Section>

      {/* ── 3. Rabatter ── */}
      <Section title="Rabatter">
        <p className="text-sm text-gray-500 mb-3">
          Rabatter kunden kan vælge i widget&apos;en (f.eks. tilbagevendende kunde).
        </p>
        {settings.discounts.length > 0 && (
          <div className="grid grid-cols-[1fr_130px_100px_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Navn</span>
            <span>Type</span>
            <span>Værdi</span>
            <span />
          </div>
        )}
        {settings.discounts.map((d) => (
          <div key={d.id} className="grid grid-cols-[1fr_130px_100px_auto] gap-2 mb-2">
            <input
              type="text"
              className={input}
              value={d.name}
              onChange={(e) => updateDiscount(d.id, "name", e.target.value)}
              placeholder="F.eks. Tilbagevendende kunde"
            />
            <select
              className={input}
              value={d.type}
              onChange={(e) => updateDiscount(d.id, "type", e.target.value)}
            >
              <option value="percent">Procent (%)</option>
              <option value="fixed">Fast beløb (kr)</option>
            </select>
            <div className="relative">
              <input
                type="number"
                min="0"
                className={input}
                value={d.value}
                onChange={(e) => updateDiscount(d.id, "value", Number(e.target.value))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                {d.type === "percent" ? "%" : "kr"}
              </span>
            </div>
            <button
              onClick={() => removeDiscount(d.id)}
              className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={addDiscount} className={btnSecondary}>
          + Tilføj rabat
        </button>
      </Section>

      {/* ── 4. Åbningstider ── */}
      <Section title="Åbningstider">
        <p className="text-sm text-gray-500 mb-4">
          Kunder kan kun booke tider inden for dit åbningstidsinterval.
        </p>
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => {
            const hours = settings.opening_hours[day]
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
            ✓ Gemt — widget opdateres inden for 60 sek.
          </span>
        )}
        {saveError && (
          <span className="text-sm text-red-500">{saveError}</span>
        )}
      </div>

      {/* ── Widget embed-kode ── */}
      <Section title="Embed-kode">
        <p className="text-sm text-gray-500 mb-3">
          Indsæt denne kode på din hjemmeside for at vise prisberegner-widget&apos;en.
        </p>
        <EmbedCode companyId={companyId} />
      </Section>
    </div>
  )
}

// ── Hjælpekomponenter ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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

const btnSecondary =
  "text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-1"
