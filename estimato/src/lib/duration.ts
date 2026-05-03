export interface DurationRange {
  min: number
  max: number
  duration_minutes: number
}

export function getDurationMinutes(sqm: number | null, ranges: DurationRange[]): number {
  if (!sqm || ranges.length === 0) return 120
  const sorted = [...ranges].sort((a, b) => a.min - b.min)
  for (const r of sorted) {
    if (sqm >= r.min && sqm <= r.max) return r.duration_minutes
  }
  return sqm < sorted[0].min ? sorted[0].duration_minutes : sorted[sorted.length - 1].duration_minutes
}
