"use client"

import { useState, useTransition } from "react"
import type { AddOn, Discount, IntervalRange, FlatRange, FrequencyDiscount, TransportFee } from "@/types/settings"
import { savePriser, type PriserData } from "./actions"
import { PREDEFINED_IDS } from "@/lib/predefined-add-ons"
import type { FrequencyKey } from "@/types/settings"

const FREQUENCY_LABELS: Record<FrequencyKey, string> = {
  weekly: "Ugentlig",
  every2weeks: "Hver 2. uge",
  every3weeks: "Hver 3. uge",
  every4weeks: "Hver 4. uge",
}

interface Props {
  initialData: PriserData
}

export default function PriserForm({ initialData }: Props) {
  const [data, setData] = useState<PriserData>(initialData)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof PriserData>(key: K, value: PriserData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await savePriser(data)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  function addAddOn() {
    update("add_ons", [...data.add_ons, { id: crypto.randomUUID(), name: "", price: 0 }])
  }
  function updateAddOn(id: string, field: keyof AddOn, value: string | number) {
    update("add_ons", data.add_ons.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }
  function removeAddOn(id: string) {
    update("add_ons", data.add_ons.filter((a) => a.id !== id))
  }

  function updateFrequency(frequency: FrequencyDiscount["frequency"], field: keyof FrequencyDiscount, value: number | boolean) {
    update("frequency_discounts", data.frequency_discounts.map((f) =>
      f.frequency === frequency ? { ...f, [field]: value } : f
    ))
  }

  function addDiscount() {
    update("discounts", [
      ...data.discounts,
      { id: crypto.randomUUID(), name: "", type: "percent" as const, value: 10 },
    ])
  }
  function updateDiscount(id: string, field: keyof Discount, value: string | number) {
    update("discounts", data.discounts.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }
  function removeDiscount(id: string) {
    update("discounts", data.discounts.filter((d) => d.id !== id))
  }

  function addRange() {
    const last = data.interval_ranges.at(-1)
    update("interval_ranges", [...data.interval_ranges, {
      min: last ? last.max + 1 : 0,
      max: last ? last.max + 20 : 20,
      price_per_m2: 0,
    }])
  }
  function updateRange(idx: number, field: keyof IntervalRange, value: number) {
    update("interval_ranges", data.interval_ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  function removeRange(idx: number) {
    update("interval_ranges", data.interval_ranges.filter((_, i) => i !== idx))
  }

  function addFlatRange() {
    const last = data.flat_ranges.at(-1)
    update("flat_ranges", [...data.flat_ranges, {
      min: last ? last.max + 1 : 0,
      max: last ? last.max + 20 : 20,
      price: 0,
    }])
  }
  function updateFlatRange(idx: number, field: keyof FlatRange, value: number) {
    update("flat_ranges", data.flat_ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  function removeFlatRange(idx: number) {
    update("flat_ranges", data.flat_ranges.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Prismodel */}
      <Card title="Prismodel">
        <div className="flex gap-2 mb-5">
          {(["interval", "sqm"] as const).map((type) => (
            <button
              key={type}
              onClick={() => update("pricing_type", type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                data.pricing_type === type
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {type === "sqm" ? "Pris i alt" : "Pris pr. m²"}
            </button>
          ))}
        </div>

        {data.pricing_type === "sqm" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Angiv en fast pris for hver størrelsesinterval. F.eks. 0–50 m² → 200 kr i alt.
            </p>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Fra (m²)</span><span>Til (m²)</span><span>Pris i alt (kr)</span><span />
            </div>
            {data.flat_ranges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                <input type="number" min="0" className={input} value={r.min} onChange={(e) => updateFlatRange(idx, "min", Number(e.target.value))} />
                <input type="number" min="0" className={input} value={r.max} onChange={(e) => updateFlatRange(idx, "max", Number(e.target.value))} />
                <input type="number" min="0" className={input} value={r.price} onChange={(e) => updateFlatRange(idx, "price", Number(e.target.value))} />
                <RemoveBtn onClick={() => removeFlatRange(idx)} />
              </div>
            ))}
            <button onClick={addFlatRange} className={btnAdd}>+ Tilføj interval</button>
          </div>
        )}

        {data.pricing_type === "interval" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Angiv en pris pr. m² for hver størrelsesinterval. Endelig pris = areal × pris pr. m².
            </p>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Fra (m²)</span><span>Til (m²)</span><span>Pris pr. m² (kr)</span><span />
            </div>
            {data.interval_ranges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                <input type="number" min="0" className={input} value={r.min} onChange={(e) => updateRange(idx, "min", Number(e.target.value))} />
                <input type="number" min="0" className={input} value={r.max} onChange={(e) => updateRange(idx, "max", Number(e.target.value))} />
                <input type="number" min="0" className={input} value={r.price_per_m2} onChange={(e) => updateRange(idx, "price_per_m2", Number(e.target.value))} />
                <RemoveBtn onClick={() => removeRange(idx)} />
              </div>
            ))}
            <button onClick={addRange} className={btnAdd}>+ Tilføj interval</button>
          </div>
        )}

        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimumspris (kr, valgfri)</label>
          <input
            type="number"
            min="0"
            className={input}
            value={data.minimum_price ?? ""}
            onChange={(e) => update("minimum_price", e.target.value ? Number(e.target.value) : null)}
            placeholder="F.eks. 300"
          />
          <p className="text-xs text-gray-400 mt-1">Prisen vises aldrig lavere end dette beløb i widget&apos;en.</p>
        </div>

        <SaveRow onSave={handleSave} isPending={isPending} saved={saved} error={saveError} />
      </Card>

      {/* Tilvalg */}
      <Card title="Tilvalg">
        <p className="text-sm text-gray-500 mb-5">
          Tilvalg kunden kan vælge i widget&apos;en. Sæt pris til 0 for at skjule et tilvalg.
        </p>

        <SectionLabel>Foruddefinerede</SectionLabel>
        <div className="grid grid-cols-[1fr_140px] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
          <span>Navn</span><span>Pris (kr)</span>
        </div>
        {data.add_ons.filter((a) => PREDEFINED_IDS.has(a.id as never)).map((a) => (
          <div key={a.id} className="grid grid-cols-[1fr_140px] gap-2 mb-2">
            <div className={`${input} bg-gray-50 text-gray-400 cursor-default`}>{a.name}</div>
            <input type="number" min="0" className={input} value={a.price} onChange={(e) => updateAddOn(a.id, "price", Number(e.target.value))} placeholder="0" />
          </div>
        ))}

        <SectionLabel className="mt-5">Egne tilvalg</SectionLabel>
        {data.add_ons.filter((a) => !PREDEFINED_IDS.has(a.id as never)).length > 0 && (
          <div className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Navn</span><span>Pris (kr)</span><span />
          </div>
        )}
        {data.add_ons.filter((a) => !PREDEFINED_IDS.has(a.id as never)).map((a) => (
          <div key={a.id} className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2">
            <input type="text" className={input} value={a.name} onChange={(e) => updateAddOn(a.id, "name", e.target.value)} placeholder="F.eks. Vinduespolering" />
            <input type="number" min="0" className={input} value={a.price} onChange={(e) => updateAddOn(a.id, "price", Number(e.target.value))} />
            <RemoveBtn onClick={() => removeAddOn(a.id)} />
          </div>
        ))}
        <button onClick={addAddOn} className={btnAdd}>+ Tilføj eget tilvalg</button>

        <SaveRow onSave={handleSave} isPending={isPending} saved={saved} error={saveError} />
      </Card>

      {/* Hyppighedsrabat */}
      <Card title="Hyppighedsrabat">
        <p className="text-sm text-gray-500 mb-5">
          Giv rabat til kunder der bestiller fast rengøring. Sæt 0% for at skjule en frekvens.
        </p>
        <div className="grid grid-cols-[auto_1fr_140px] gap-x-4 gap-y-3 items-center">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Aktiv</div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Frekvens</div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rabat (%)</div>
          {data.frequency_discounts.map((f) => (
            <>
              <input key={`${f.frequency}-cb`} type="checkbox" checked={f.enabled} onChange={(e) => updateFrequency(f.frequency, "enabled", e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
              <span key={`${f.frequency}-lbl`} className="text-sm text-gray-700">{FREQUENCY_LABELS[f.frequency]}</span>
              <input key={`${f.frequency}-pct`} type="number" min="0" max="100" className={input} value={f.discount_percentage} disabled={!f.enabled} onChange={(e) => updateFrequency(f.frequency, "discount_percentage", Number(e.target.value))} placeholder="0" />
            </>
          ))}
        </div>
        <SaveRow onSave={handleSave} isPending={isPending} saved={saved} error={saveError} />
      </Card>

      {/* Transportgebyr */}
      <Card title="Transportgebyr">
        <p className="text-sm text-gray-500 mb-5">
          Tilføj et kørselsgebyr baseret på afstanden fra din adresse til kunden. Kræver at du har sat en adresse op under Indstillinger.
        </p>
        <div className="flex items-center gap-3 mb-5">
          <input type="checkbox" id="transport-enabled" checked={data.transport_fee.enabled} onChange={(e) => update("transport_fee", { ...data.transport_fee, enabled: e.target.checked })} className="w-4 h-4 accent-blue-600 cursor-pointer" />
          <label htmlFor="transport-enabled" className="text-sm font-medium text-gray-700 cursor-pointer">Aktiver transportgebyr</label>
        </div>
        {data.transport_fee.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inkluderet afstand (km)</label>
              <input type="number" min="0" className={input} value={data.transport_fee.base_distance_km || ""} onChange={(e) => update("transport_fee", { ...data.transport_fee, base_distance_km: Number(e.target.value) })} placeholder="F.eks. 10" />
              <p className="text-xs text-gray-400 mt-1">Ingen gebyr inden for denne afstand.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pris pr. km (kr)</label>
              <input type="number" min="0" className={input} value={data.transport_fee.price_per_km || ""} onChange={(e) => update("transport_fee", { ...data.transport_fee, price_per_km: Number(e.target.value) })} placeholder="F.eks. 5" />
              <p className="text-xs text-gray-400 mt-1">Kr. pr. km ud over inkluderet afstand.</p>
            </div>
          </div>
        )}
        <SaveRow onSave={handleSave} isPending={isPending} saved={saved} error={saveError} />
      </Card>

      {/* Rabatter */}
      <Card title="Rabatter">
        <p className="text-sm text-gray-500 mb-5">
          Rabatter kunden kan vælge i widget&apos;en (f.eks. tilbagevendende kunde, studierabat).
        </p>
        {data.discounts.length > 0 && (
          <div className="grid grid-cols-[1fr_130px_100px_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Navn</span><span>Type</span><span>Værdi</span><span />
          </div>
        )}
        {data.discounts.map((d) => (
          <div key={d.id} className="grid grid-cols-[1fr_130px_100px_auto] gap-2 mb-2">
            <input type="text" className={input} value={d.name} onChange={(e) => updateDiscount(d.id, "name", e.target.value)} placeholder="F.eks. Tilbagevendende kunde" />
            <select className={input} value={d.type} onChange={(e) => updateDiscount(d.id, "type", e.target.value)}>
              <option value="percent">Procent (%)</option>
              <option value="fixed">Fast beløb (kr)</option>
            </select>
            <div className="relative">
              <input type="number" min="0" className={input} value={d.value} onChange={(e) => updateDiscount(d.id, "value", Number(e.target.value))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                {d.type === "percent" ? "%" : "kr"}
              </span>
            </div>
            <RemoveBtn onClick={() => removeDiscount(d.id)} />
          </div>
        ))}
        <button onClick={addDiscount} className={btnAdd}>+ Tilføj rabat</button>
        <SaveRow onSave={handleSave} isPending={isPending} saved={saved} error={saveError} />
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  )
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 ${className}`}>{children}</p>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-9 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 text-lg leading-none">
      ×
    </button>
  )
}

function SaveRow({ onSave, isPending, saved, error }: { onSave: () => void; isPending: boolean; saved: boolean; error: string | null }) {
  return (
    <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
      <button onClick={onSave} disabled={isPending} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
        {isPending ? "Gemmer..." : "Gem"}
      </button>
      {saved && (
        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Gemt — widget opdateres inden for 60 sek.
        </span>
      )}
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}

const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
const btnAdd = "text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-1 mt-1"
