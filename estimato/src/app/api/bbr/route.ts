import { NextResponse } from "next/server"

// DAWA: Danmarks Adresser Web API (gratis, ingen auth)
const DAWA_BASE = "https://api.dataforsyningen.dk"
// Datafordeler BBR API (kræver gratis brugernavn+kodeord fra datafordeler.dk)
const BBR_BASE = "https://services.datafordeler.dk/BBR/BBRPublic/1/REST"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q) {
    return NextResponse.json({ error: "Mangler q parameter" }, { status: 400 })
  }

  const mode = searchParams.get("mode") ?? "autocomplete"

  if (mode === "autocomplete") {
    // Adresse-autocomplete — returnerer også adgangsadresseid så vi kan springe ekstra opslag over
    const res = await fetch(
      `${DAWA_BASE}/adresser/autocomplete?q=${encodeURIComponent(q)}&per_side=6&fuzzy=true`,
      { next: { revalidate: 0 } }
    )
    const data = await res.json()
    const suggestions = data.map((item: { tekst: string; adresse: { id: string; adgangsadresseid: string } }) => ({
      text: item.tekst,
      id: item.adresse.id,
      adgangsadresseid: item.adresse.adgangsadresseid,
    }))
    return NextResponse.json(suggestions)
  }

  if (mode === "lookup") {
    // Hent adressedata inkl. BBR-information
    const addressId = searchParams.get("id")
    if (!addressId) {
      return NextResponse.json({ error: "Mangler id" }, { status: 400 })
    }

    // Brug adgangsadresseid fra query param hvis tilgængeligt (sparer et API-kald)
    // Ellers hent det fra DAWA adresse-opslag
    let adgangId = searchParams.get("adgangsadresseid")

    if (!adgangId) {
      const res = await fetch(`${DAWA_BASE}/adresser/${addressId}`, {
        next: { revalidate: 0 },
      })
      const addr = await res.json()
      // adgangsadresse er et nested objekt — ikke et fladt felt
      adgangId = addr.adgangsadresse?.id ?? null
    }

    // Hent adressebetegnelse
    const addrRes = await fetch(`${DAWA_BASE}/adresser/${addressId}`, {
      next: { revalidate: 0 },
    })
    const addr = await addrRes.json()

    let sqm: number | null = null
    let propertyType: string | null = null

    if (adgangId) {
      const username = process.env.DATAFORDELER_USERNAME
      const password = process.env.DATAFORDELER_PASSWORD

      if (username && password) {
        try {
          // Datafordeler BBR API erstatter det nedlagte bbrlight/enheder
          const bbrRes = await fetch(
            `${BBR_BASE}/enhed?AdresseIdentificerer=${adgangId}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&format=JSON`,
            { next: { revalidate: 0 } }
          )
          if (bbrRes.ok) {
            const bbrData = await bbrRes.json()
            const enhed = Array.isArray(bbrData) ? bbrData[0] : null
            if (enhed) {
              // Feltnavne fra BBR 2.4 schema (services.datafordeler.dk)
              sqm =
                enhed.enh027ArealTilBeboelse ??
                enhed.enh026EnhedensSamledeAreal ??
                null

              const anvend: string | undefined = enhed.enh020EnhedensAnvendelse
              if (anvend) {
                const kode = String(anvend)
                if (["110", "120", "130", "185"].includes(kode)) propertyType = "house"
                else if (["140", "150", "160"].includes(kode)) propertyType = "apartment"
                else propertyType = "commercial"
              }
            }
          }
        } catch {
          // BBR-lookup fejlede — returner uden m²
        }
      }
    }

    return NextResponse.json({
      address: addr.adressebetegnelse,
      sqm,
      propertyType,
    })
  }

  return NextResponse.json({ error: "Ukendt mode" }, { status: 400 })
}
