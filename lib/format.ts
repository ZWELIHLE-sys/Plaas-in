// Small, pure formatting helpers shared by the dashboard and reply builders.

// "Goat" -> "Goats", "Sheep" -> "Sheep", "Cattle" -> "Cattle".
export function pluralSpecies(species?: string): string {
  if (!species) return 'animals'
  if (/^(sheep|cattle)$/i.test(species)) return species
  return `${species}s`
}

// ISO timestamp -> "20 Jun 2026" (South African locale).
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}
