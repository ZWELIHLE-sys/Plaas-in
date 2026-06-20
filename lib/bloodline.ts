// Bloodline domain: registering a birth with parent links + generation,
// detecting inbreeding risk, and reporting an animal's lineage over WhatsApp.
import { supabase } from '@/lib/supabase'
import { OFFSPRING } from '@/lib/constants'
import type { ParsedBirth } from '@/lib/parser'

type AnimalRow = {
  id: string
  animal_id: string | null
  species: string | null
  mother_id: string | null
  father_id: string | null
  generation: number | null
}

const COLS = 'id,animal_id,species,mother_id,father_id,generation'

async function findByTag(farmerId: string, tag: string): Promise<AnimalRow | null> {
  const { data } = await supabase
    .from('animals')
    .select(COLS)
    .eq('farmer_id', farmerId)
    .ilike('animal_id', tag)
    .limit(1)
    .maybeSingle()
  return (data as AnimalRow) ?? null
}

async function findById(id: string): Promise<AnimalRow | null> {
  const { data } = await supabase.from('animals').select(COLS).eq('id', id).maybeSingle()
  return (data as AnimalRow) ?? null
}

// Build the next auto tag for a farmer's new birth, e.g. CALF-008.
async function nextTag(farmerId: string, species: string | null): Promise<string> {
  const prefix = (species && OFFSPRING[species]?.prefix) || 'ANML'
  const { count } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('farmer_id', farmerId)
  return `${prefix}-${String((count ?? 0) + 1).padStart(3, '0')}`
}

function inbreedingWarning(mother: AnimalRow | null, father: AnimalRow | null): string | null {
  if (!mother || !father) return null
  if (mother.id === father.id) return 'Inbreeding risk: mother and father are the same animal.'

  const parentChild =
    father.id === mother.mother_id ||
    father.id === mother.father_id ||
    mother.id === father.mother_id ||
    mother.id === father.father_id
  if (parentChild) return 'Inbreeding risk: this is a parent–offspring pairing.'

  const motherParents = [mother.mother_id, mother.father_id].filter(Boolean)
  const fatherParents = [father.mother_id, father.father_id].filter(Boolean)
  if (motherParents.some((id) => fatherParents.includes(id))) {
    return 'Inbreeding risk: the parents share a common ancestor (siblings).'
  }
  return null
}

export async function registerBirth(farmerId: string, b: ParsedBirth): Promise<string> {
  const mother = b.mother_tag ? await findByTag(farmerId, b.mother_tag) : null
  const father = b.father_tag ? await findByTag(farmerId, b.father_tag) : null

  const species = b.species ?? mother?.species ?? father?.species ?? null
  const generation = Math.max(mother?.generation ?? 0, father?.generation ?? 0) + 1
  const tag = b.animal_id?.toUpperCase() ?? (await nextTag(farmerId, species))

  const { error } = await supabase.from('animals').insert({
    farmer_id: farmerId,
    animal_id: tag,
    species,
    breed: b.breed ?? null,
    gender: b.gender ?? null,
    mother_id: mother?.id ?? null,
    father_id: father?.id ?? null,
    generation,
    status: 'Active',
  })
  if (error) throw error

  const offspring = (species && OFFSPRING[species]?.name) || 'Animal'
  const parents =
    [mother?.animal_id, father?.animal_id].filter(Boolean).join(' × ') || 'unknown parents'
  let reply = `✅ ${offspring} registered (${tag}). Linked to ${parents} (Gen ${generation}).`

  const warn = inbreedingWarning(mother, father)
  if (warn) reply += `\n⚠️ ${warn}`
  // Flag parents the farmer named but we couldn't find, so records stay accurate.
  const missing = [
    b.mother_tag && !mother ? `mother ${b.mother_tag}` : null,
    b.father_tag && !father ? `father ${b.father_tag}` : null,
  ].filter(Boolean)
  if (missing.length) reply += `\nℹ️ Couldn't find ${missing.join(' and ')} — register them to complete the bloodline.`
  return reply
}

export async function showBloodline(farmerId: string, tag: string): Promise<string> {
  const animal = await findByTag(farmerId, tag)
  if (!animal) return `❓ I couldn't find ${tag}. Check the tag and try again.`

  const mother = animal.mother_id ? await findById(animal.mother_id) : null
  const father = animal.father_id ? await findById(animal.father_id) : null
  const tagOf = (a: AnimalRow | null) => a?.animal_id ?? '—'

  const lines = [
    `🧬 Bloodline of ${animal.animal_id} (Gen ${animal.generation ?? 1})`,
    `Mother: ${tagOf(mother)}`,
    `   ↳ her parents: ${tagOf(mother && mother.mother_id ? await findById(mother.mother_id) : null)} × ${tagOf(mother && mother.father_id ? await findById(mother.father_id) : null)}`,
    `Father: ${tagOf(father)}`,
    `   ↳ his parents: ${tagOf(father && father.mother_id ? await findById(father.mother_id) : null)} × ${tagOf(father && father.father_id ? await findById(father.father_id) : null)}`,
  ]
  return lines.join('\n')
}
