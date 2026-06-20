// Small, pure helpers shared by the dashboard, reply builders and date math.

// "Goat" -> "Goats", "Sheep" -> "Sheep", "Cattle" -> "Cattle".
export function pluralSpecies(species?: string): string {
  if (!species) return 'animals'
  if (/^(sheep|cattle)$/i.test(species)) return species
  return `${species}s`
}

// ISO timestamp or date -> "20 Jun 2026" (South African locale).
export function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// JS Date -> "YYYY-MM-DD" for Postgres `date` columns.
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
