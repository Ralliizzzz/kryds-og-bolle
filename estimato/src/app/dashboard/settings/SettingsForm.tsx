"use client"

import { useState, useTransition, useRef } from "react"
import type { OpeningHours, DayKey, Location } from "@/types/settings"
import { saveSettings, saveServiceArea, saveContactInfo } from "./actions"

const DAY_LABELS: Record<string, string> = {
  mon: "Mandag", tue: "Tirsdag", wed: "Onsdag", thu: "Torsdag",
  fri: "Fredag", sat: "Lørdag", sun: "Søndag",
}
const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

const EMPTY_BRANCH: Location = {
  name: "", street_address: "", postal_code: "", city: "",
  country: "Danmark", lat: null, lon: null, max_distance_km: 0,
}

interface Props {
  initialOpeningHours: OpeningHours
  initialMainLocation: Location
  initialBranchLocations: Location[]
  companyId: string
  initialCompanyName: string
  initialEmail: string
  initialPhone: string
}

export default function SettingsForm({
  initialOpeningHours, initialMainLocation, initialBranchLocations,
  companyId, initialCompanyName, initialEmail, initialPhone,
}: Props) {
  const [openingHours, setOpeningHours] = useState<OpeningHours>(initialOpeningHours)
  const [mainLocation, setMainLocation] = useState<Location>(initialMainLocation)
  const [branches, setBranches] = useState<Location[]>(initialBranchLocations)

  const [savedHours, setSavedHours] = useState(false)
  const [savedArea, setSavedArea] = useState(false)
  const [errorHours, setErrorHours] = useState<string | null>(null)
  const [errorArea, setErrorArea] = useState<string | null>(null)

  const [pendingHours, startHours] = useTransition()
  const [pendingArea, startArea] = useTransition()

  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [contactEmail, setContactEmail] = useState(initialEmail)
  const [contactPhone, setContactPhone] = useState(initialPhone)
  const [savedContact, setSavedContact] = useState(false)
  const [errorContact, setErrorContact] = useState<string | null>(null)
  const [pendingContact, startContact] = useTransition()

  function handleSaveContact() {
    setErrorContact(null)
    startContact(async () => {
      const result = await saveContactInfo(companyName, contactEmail, contactPhone)
      if (result.error) setErrorContact(result.error)
      else setSavedContact(true)
    })
  }

  function toggleDay(day: DayKey, open: boolean) {
    setOpeningHours((prev) => ({ ...prev, [day]: open ? { open: "08:00", close: "16:00" } : null }))
    setSavedHours(false)
  }
  function updateHour(day: DayKey, field: "open" | "close", value: string) {
    const current = openingHours[day]
    if (!current) return
    setOpeningHours((prev) => ({ ...prev, [day]: { ...current, [field]: value } }))
    setSavedHours(false)
  }
  function handleSaveHours() {
    setErrorHours(null)
    startHours(async () => {
      const result = await saveSettings(openingHours)
      if (result.error) setErrorHours(result.error)
      else setSavedHours(true)
    })
  }

  function addBranch() {
    setBranches((prev) => [...prev, { ...EMPTY_BRANCH }])
    setSavedArea(false)
  }
  function updateBranch(idx: number, updated: Location) {
    setBranches((prev) => prev.map((b, i) => i === idx ? updated : b))
    setSavedArea(false)
  }
  function removeBranch(idx: number) {
    setBranches((prev) => prev.filter((_, i) => i !== idx))
    setSavedArea(false)
  }
  function handleSaveArea() {
    setErrorArea(null)
    startArea(async () => {
      const result = await saveServiceArea(mainLocation, branches)
      if (result.error) setErrorArea(result.error)
      else setSavedArea(true)
    })
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Kontaktoplysninger */}
      <Card title="Kontaktoplysninger" description="Bruges til at sende dig email og SMS, når der kommer nye leads.">
        <div className="flex flex-col gap-4">
          <Field label="Firmanavn">
            <input type="text" className={inp} value={companyName} onChange={(e) => { setCompanyName(e.target.value); setSavedContact(false) }} placeholder="Jensens Rengøring ApS" />
          </Field>
          <Field label="Email til notifikationer">
            <input type="email" className={inp} value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setSavedContact(false) }} placeholder="din@email.dk" />
          </Field>
          <Field label="Telefon til SMS-notifikationer">
            <input type="tel" className={inp} value={contactPhone} onChange={(e) => { setContactPhone(e.target.value); setSavedContact(false) }} placeholder="+45 12 34 56 78" />
            <p className="text-xs text-gray-400 mt-1">Bruges til SMS når nye leads kommer ind.</p>
          </Field>
        </div>
        <SaveRow onSave={handleSaveContact} isPending={pendingContact} saved={savedContact} error={errorContact} />
      </Card>

      {/* Serviceområde */}
      <Card title="Serviceområde" description="Angiv din adresse og den maksimale afstand du kører. Kunder uden for serviceområdet kan ikke bestille via widget'en.">
        <SectionLabel>Primær adresse</SectionLabel>
        <LocationFields
          loc={mainLocation}
          onUpdate={(updated) => { setMainLocation(updated); setSavedArea(false) }}
          showName={false}
        />

        {branches.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Afdelinger</SectionLabel>
            {branches.map((b, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-4 mb-3 relative bg-gray-50/50">
                <button
                  onClick={() => removeBranch(idx)}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 text-lg leading-none"
                >
                  ×
                </button>
                <LocationFields loc={b} onUpdate={(updated) => updateBranch(idx, updated)} showName={true} />
              </div>
            ))}
          </div>
        )}

        <button onClick={addBranch} className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-1 mt-3">
          + Tilføj afdeling
        </button>

        <SaveRow onSave={handleSaveArea} isPending={pendingArea} saved={savedArea} error={errorArea} />
      </Card>

      {/* Åbningstider */}
      <Card title="Åbningstider" description="Kunder kan kun booke tider inden for dit åbningstidsinterval.">
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => {
            const hours = openingHours[day]
            const isOpen = hours !== null
            return (
              <div key={day} className="flex items-center gap-4 py-1">
                <div className="w-28 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={isOpen}
                    onChange={(e) => toggleDay(day, e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className={`text-sm font-medium cursor-pointer select-none ${isOpen ? "text-gray-800" : "text-gray-400"}`}
                  >
                    {DAY_LABELS[day]}
                  </label>
                </div>
                {isOpen ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" className={`${inp} w-28`} value={hours!.open} onChange={(e) => updateHour(day, "open", e.target.value)} />
                    <span className="text-gray-400 text-xs">–</span>
                    <input type="time" className={`${inp} w-28`} value={hours!.close} onChange={(e) => updateHour(day, "close", e.target.value)} />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Lukket</span>
                )}
              </div>
            )
          })}
        </div>
        <SaveRow onSave={handleSaveHours} isPending={pendingHours} saved={savedHours} error={errorHours} />
      </Card>
    </div>
  )
}

function LocationFields({ loc, onUpdate, showName }: { loc: Location; onUpdate: (updated: Location) => void; showName: boolean }) {
  const [query, setQuery] = useState(loc.street_address || "")
  const [suggestions, setSuggestions] = useState<{ text: string; id: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const geocoded = !!(loc.lat && loc.lon)

  async function onInput(val: string) {
    setQuery(val)
    onUpdate({ ...loc, street_address: val, lat: null, lon: null })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bbr?mode=autocomplete&q=${encodeURIComponent(val)}`)
        if (!res.ok) return
        const data: { text: string; id: string }[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch { /* ignore */ }
    }, 300)
  }

  async function onSelect(s: { text: string; id: string }) {
    setQuery(s.text)
    setSuggestions([])
    setShowSuggestions(false)
    setGeocoding(true)
    try {
      const res = await fetch(`/api/bbr?mode=lookup&id=${s.id}`)
      if (res.ok) {
        const data: { lat: number | null; lon: number | null } = await res.json()
        onUpdate({ ...loc, street_address: s.text, lat: data.lat, lon: data.lon })
      } else {
        onUpdate({ ...loc, street_address: s.text, lat: null, lon: null })
      }
    } catch {
      onUpdate({ ...loc, street_address: s.text, lat: null, lon: null })
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {showName && (
        <Field label="Navn på afdeling">
          <input type="text" className={inp} value={loc.name} onChange={(e) => onUpdate({ ...loc, name: e.target.value })} placeholder="F.eks. København, Aarhus" />
        </Field>
      )}

      <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setTimeout(() => setShowSuggestions(false), 150) }}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <div className="relative">
          <input type="text" className={inp} value={query} onChange={(e) => onInput(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder="Begynd at taste adresse..." autoComplete="off" />
          {geocoded && !geocoding && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-semibold pointer-events-none">✓ Fundet</span>
          )}
          {geocoding && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">Henter...</span>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
            {suggestions.map((s) => (
              <div key={s.id} className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0" onMouseDown={() => onSelect(s)}>
                {s.text}
              </div>
            ))}
          </div>
        )}
        {!geocoded && !geocoding && query.length > 0 && (
          <p className="text-xs text-amber-500 mt-1">Vælg en adresse fra listen for at aktivere afstandsbegrænsning.</p>
        )}
      </div>

      <Field label="Maks. afstand (km)">
        <input type="number" min="0" className={inp} value={loc.max_distance_km ?? ""} onChange={(e) => onUpdate({ ...loc, max_distance_km: Number(e.target.value) })} placeholder="F.eks. 30" />
        <p className="text-xs text-gray-400 mt-1">Sæt til 0 for ingen begrænsning.</p>
      </Field>
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{children}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
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
          Gemt
        </span>
      )}
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
