import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/app/admin/login/actions"
import { createServiceClient } from "@/lib/supabase/server"

const PLACES_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

export interface CvrCompany {
  cvrNumber: string
  companyName: string
  address: string
  city: string
  postalCode: string
  phone: string | null
  email: string | null
  alreadyImported: boolean
}

function extractCity(address: string): string {
  // "Firma ApS, Gade 1, 2100 København Ø, Denmark" → "København Ø"
  const parts = address.split(",").map((p) => p.trim())
  for (const part of parts) {
    const m = part.match(/^\d{4}\s+(.+)$/)
    if (m) return m[1]
  }
  return ""
}

function extractPostalCode(address: string): string {
  const m = address.match(/\b(\d{4})\b/)
  return m ? m[1] : ""
}

export async function POST(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })

  const { city, limit = 20 } = await req.json()

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API-nøgle mangler. Tilføj GOOGLE_PLACES_API_KEY i miljøvariablerne." },
      { status: 500 }
    )
  }

  const query = city?.trim()
    ? `rengøringsfirma i ${city.trim()}`
    : "rengøringsfirma Danmark"

  let searchRes: Response
  try {
    searchRes = await fetch(
      `${PLACES_URL}?query=${encodeURIComponent(query)}&language=da&key=${apiKey}`,
      { cache: "no-store" }
    )
  } catch {
    return NextResponse.json({ error: "Kunne ikke forbinde til Google Places" }, { status: 502 })
  }

  if (!searchRes.ok) {
    return NextResponse.json({ error: `Google Places fejl ${searchRes.status}` }, { status: 502 })
  }

  const searchData = await searchRes.json()
  if (searchData.status === "REQUEST_DENIED") {
    return NextResponse.json({ error: `API-nøgle afvist: ${searchData.error_message}` }, { status: 502 })
  }
  if (searchData.status === "ZERO_RESULTS") {
    return NextResponse.json({ companies: [], total: 0 })
  }

  const places: any[] = (searchData.results ?? []).slice(0, Math.min(Number(limit) || 20, 20))

  // Fetch phone + website via Place Details for each result
  const detailed = await Promise.all(
    places.map(async (place) => {
      try {
        const r = await fetch(
          `${DETAILS_URL}?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address&language=da&key=${apiKey}`,
          { cache: "no-store" }
        )
        const d = await r.json()
        return { ...place, ...(d.result ?? {}) }
      } catch {
        return place
      }
    })
  )

  // Dedup check against existing prospects
  const supabase = await createServiceClient()
  const { data: existing } = await supabase.from("prospects").select("source").like("source", "places-%")
  const importedSet = new Set(
    (existing ?? []).map((p) => p.source?.replace("places-", "")).filter(Boolean)
  )

  const companies: CvrCompany[] = detailed.map((place) => ({
    cvrNumber: place.place_id,
    companyName: place.name ?? "Ukendt",
    address: place.formatted_address ?? "",
    city: extractCity(place.formatted_address ?? ""),
    postalCode: extractPostalCode(place.formatted_address ?? ""),
    phone: place.formatted_phone_number ?? null,
    email: null,
    alreadyImported: importedSet.has(place.place_id),
  }))

  return NextResponse.json({ companies, total: searchData.results?.length ?? companies.length })
}
