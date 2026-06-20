// Livestock domain actions: registering animals and building the herd report.
import { supabase } from '@/lib/supabase'
import { pluralSpecies } from '@/lib/format'
import type { ParsedAnimal } from '@/lib/parser'

export async function registerAnimals(
  farmerId: string,
  animals: ParsedAnimal[],
): Promise<string> {
  const rows: Record<string, unknown>[] = []
  const summaries: string[] = []

  for (const a of animals) {
    const qty = a.quantity && a.quantity > 0 ? a.quantity : 1
    for (let i = 0; i < qty; i++) {
      rows.push({
        farmer_id: farmerId,
        species: a.species ?? null,
        breed: a.breed ?? null,
        gender: a.gender ?? null,
        primary_product: a.primary_product ?? null,
        // Only attach a tag when a single, specifically-tagged animal is added.
        animal_id: qty === 1 ? a.animal_id ?? null : null,
        status: 'Active',
      })
    }
    const speciesWord = qty > 1 ? pluralSpecies(a.species) : a.species ?? 'animal'
    const label = [qty > 1 ? qty : '', a.breed, speciesWord].filter(Boolean).join(' ')
    summaries.push(a.animal_id && qty === 1 ? `${a.animal_id} — ${label}` : label)
  }

  const { error } = await supabase.from('animals').insert(rows)
  if (error) throw error

  return `✅ Recorded — ${summaries.join(', ')} added.`
}

export async function herdReport(farmerId: string): Promise<string> {
  const { data, error } = await supabase
    .from('animals')
    .select('species')
    .eq('farmer_id', farmerId)
    .eq('status', 'Active')

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const species = (row as { species: string | null }).species ?? 'Other'
    counts.set(species, (counts.get(species) ?? 0) + 1)
  }

  const total = data?.length ?? 0
  if (total === 0) {
    return '📊 No livestock recorded yet. Add some with e.g. "Added 3 Boer goats".'
  }

  const breakdown = [...counts.entries()].map(([s, n]) => `${s} ${n}`).join(', ')
  return `📊 Total ${total} — ${breakdown}.`
}
