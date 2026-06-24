// Bloodline domain: registering births (litters) with parent links + generation,
// enforcing breeding rules (parents must exist; mother Female; father Male & intact),
// inbreeding detection, and lineage reporting over WhatsApp.
import { supabase } from '@/lib/supabase'
import { OFFSPRING } from '@/lib/constants'
import { farmerInitials, nextSeq, buildTag } from '@/lib/tagging'
import type { ParsedBirth } from '@/lib/parser'

type Farmer = { id: string; name: string | null }

type AnimalRow = {
  id: string
  animal_id: string | null
  species: string | null
  gender: string | null
  breeding_status: string | null
  mother_id: string | null
  father_id: string | null
  generation: number | null
}

const COLS = 'id,animal_id,species,gender,breeding_status,mother_id,father_id,generation'

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

function inbreedingWarning(mother: AnimalRow, father: AnimalRow): string | null {
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

export async function registerBirth(farmer: Farmer, b: ParsedBirth): Promise<string> {
  const initials = farmerInitials(farmer.name)
  if (!initials) {
    return 'ℹ️ First register your profile so newborns get proper tags — send: "Register farmer: Your Name, Farm, Area".'
  }

  // Mother is required, and must already be a registered female.
  if (!b.mother_tag) {
    return 'ℹ️ Which mother? e.g. "Cow-04 gave birth to a calf, father Bull-01".'
  }
  const mother = await findByTag(farmer.id, b.mother_tag)
  if (!mother) {
    return `⚠️ I can't find ${b.mother_tag}. Please register the mother first, then record the birth again.`
  }
  if (mother.gender && mother.gender !== 'Female') {
    return `⚠️ ${mother.animal_id} is recorded as ${mother.gender}, but a mother must be Female. Please check the record.`
  }

  // Father is optional, but if named must exist, be male, and not be castrated.
  let father: AnimalRow | null = null
  if (b.father_tag) {
    father = await findByTag(farmer.id, b.father_tag)
    if (!father) {
      return `⚠️ I can't find ${b.father_tag}. Please register the father first, then record the birth again.`
    }
    if (father.gender && father.gender !== 'Male') {
      return `⚠️ ${father.animal_id} is recorded as ${father.gender}, but a father must be Male.`
    }
    if (father.breeding_status === 'Castrated') {
      return `⚠️ ${father.animal_id} is castrated and cannot be a father.`
    }
  }

  const species = b.species ?? mother.species ?? father?.species ?? 'Animal'
  const generation = Math.max(mother.generation ?? 0, father?.generation ?? 0) + 1
  const qty = b.quantity && b.quantity > 0 ? b.quantity : 1

  let seq = await nextSeq(farmer.id, species)
  const rows: Record<string, unknown>[] = []
  const tags: string[] = []
  for (let i = 0; i < qty; i++) {
    const tag =
      b.animal_id && qty === 1 ? b.animal_id.toUpperCase() : buildTag(initials, species, seq++)
    rows.push({
      farmer_id: farmer.id,
      animal_id: tag,
      species: b.species ?? mother.species ?? null,
      breed: b.breed ?? null,
      gender: b.gender ?? null,
      mother_id: mother.id,
      father_id: father?.id ?? null,
      generation,
      status: 'Active',
    })
    tags.push(tag)
  }

  const { error } = await supabase.from('animals').insert(rows)
  if (error) throw error

  const word =
    qty > 1 ? OFFSPRING[species]?.plural ?? 'offspring' : OFFSPRING[species]?.name ?? 'Animal'
  const parents = [mother.animal_id, father?.animal_id].filter(Boolean).join(' × ')
  let reply = `✅ ${qty > 1 ? qty + ' ' : ''}${word} registered (${tags.join(', ')}). Linked to ${parents} (Gen ${generation}).`

  if (father) {
    const warn = inbreedingWarning(mother, father)
    if (warn) reply += `\n⚠️ ${warn}`
  }
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
