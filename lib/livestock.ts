// Livestock domain actions: registering animals (with auto-generated tags) and
// building the herd report.
import { supabase } from '@/lib/supabase'
import { pluralSpecies } from '@/lib/format'
import { farmerInitials, nextSeq, buildTag } from '@/lib/tagging'
import type { ParsedAnimal } from '@/lib/parser'

type Farmer = { id: string; name: string | null }

export async function registerAnimals(farmer: Farmer, animals: ParsedAnimal[]): Promise<string> {
  const initials = farmerInitials(farmer.name)
  // Every animal needs a tag so it can later be referenced (e.g. as a parent).
  // Auto-tags need the farmer's initials, so require a profile name first.
  const needsAuto = animals.some((a) => !a.animal_id)
  if (needsAuto && !initials) {
    return 'ℹ️ First register your profile so your animals get proper tags — send: "Register farmer: Your Name, Farm, Area".'
  }

  const rows: Record<string, unknown>[] = []
  const tags: string[] = []
  const summaries: string[] = []
  const seqBySpecies = new Map<string, number>()

  for (const a of animals) {
    const species = a.species ?? 'Animal'
    const qty = a.quantity && a.quantity > 0 ? a.quantity : 1
    const groupTags: string[] = []

    for (let i = 0; i < qty; i++) {
      let tag: string
      if (a.animal_id && qty === 1) {
        tag = a.animal_id.toUpperCase()
      } else {
        let seq = seqBySpecies.get(species)
        if (seq === undefined) seq = await nextSeq(farmer.id, species)
        tag = buildTag(initials!, species, seq)
        seqBySpecies.set(species, seq + 1)
      }
      rows.push({
        farmer_id: farmer.id,
        animal_id: tag,
        species: a.species ?? null,
        breed: a.breed ?? null,
        gender: a.gender ?? null,
        primary_product: a.primary_product ?? null,
        status: 'Active',
      })
      tags.push(tag)
      groupTags.push(tag)
    }

    const speciesWord = qty > 1 ? pluralSpecies(a.species) : a.species ?? 'animal'
    const label = [qty > 1 ? qty : '', a.breed, speciesWord].filter(Boolean).join(' ')
    summaries.push(`${label} (${groupTags.join(', ')})`)
  }

  const { error } = await supabase.from('animals').insert(rows)
  if (error) throw error

  return `✅ Recorded — ${summaries.join('; ')} added.`
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
