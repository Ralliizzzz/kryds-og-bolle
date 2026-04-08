// Delte settings-typer brugt af dashboard OG widget API
// Widget importerer fra widget/src/types.ts (samme shape, ingen cross-import)

export interface AddOn {
  id: string
  name: string
  price: number
}

export interface Discount {
  id: string
  name: string
  type: "percent" | "fixed"
  value: number
}

export interface IntervalRange {
  min: number
  max: number
  price: number
}

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
export type OpeningHours = Record<DayKey, { open: string; close: string } | null>

export interface QuoteSettingsData {
  pricing_type: "sqm" | "interval"
  price_per_sqm: number | null
  interval_ranges: IntervalRange[]
  add_ons: AddOn[]
  discounts: Discount[]
  minimum_price: number | null
  opening_hours: OpeningHours
}
