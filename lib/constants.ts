// Central brand + domain constants for Plaas-In. One place to change naming,
// the mantra, and the livestock vocabulary the parser understands.

export const BRAND = {
  name: 'Plaas-In',
  emoji: '🌱',
  slogan: 'Agriculture is our culture',
  tagline: 'WhatsApp farm record-keeping for South African farmers',
} as const

// Recognised South African livestock breeds, grouped by species.
export const BREEDS_BY_SPECIES: Record<string, string[]> = {
  Cattle: ['Nguni', 'Boran', 'Brahman', 'Angus', 'Jersey', 'Holstein'],
  Goat: ['Boer', 'Kalahari Red', 'Saanen'],
  Sheep: ['Dorper', 'Merino'],
  Pig: ['Large White', 'Landrace'],
}

// Flat list of every known breed (handy for the parser).
export const ALL_BREEDS: string[] = Object.values(BREEDS_BY_SPECIES).flat()

export const SPECIES = ['Cattle', 'Goat', 'Sheep', 'Pig'] as const

// Young-animal names per species (used in birth confirmations).
export const OFFSPRING: Record<string, { name: string; plural: string }> = {
  Cattle: { name: 'Calf', plural: 'Calves' },
  Goat: { name: 'Kid', plural: 'Kids' },
  Sheep: { name: 'Lamb', plural: 'Lambs' },
  Pig: { name: 'Piglet', plural: 'Piglets' },
}
