// Breeding-status actions: castration. A castrated male can no longer breed, so
// it is excluded from being recorded as a father (enforced in lib/bloodline.ts).
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/format'

export async function castrateAnimal(
  farmerId: string,
  tag: string | undefined,
  reason: string | undefined,
): Promise<string> {
  if (!tag) {
    return 'ℹ️ Which animal? e.g. "Castrate Bull-03, reason: fattening".'
  }

  const { data: animal } = await supabase
    .from('animals')
    .select('id,animal_id,gender,breeding_status')
    .eq('farmer_id', farmerId)
    .ilike('animal_id', tag)
    .limit(1)
    .maybeSingle()

  if (!animal) {
    return `⚠️ I can't find ${tag}. Register the animal first, then castrate it.`
  }

  const a = animal as { id: string; animal_id: string; gender: string | null; breeding_status: string | null }
  if (a.breeding_status === 'Castrated') {
    return `ℹ️ ${a.animal_id} is already recorded as Castrated.`
  }
  if (a.gender && a.gender !== 'Male') {
    return `ℹ️ ${a.animal_id} is recorded as ${a.gender}. Castration applies to males.`
  }

  const { error } = await supabase
    .from('animals')
    .update({
      breeding_status: 'Castrated',
      castration_date: toISODate(new Date()),
      castration_reason: reason ?? null,
    })
    .eq('id', a.id)
  if (error) throw error

  const why = reason ? ` (reason: ${reason})` : ''
  return `✅ ${a.animal_id} marked Castrated${why}. It can no longer be recorded as a father.`
}
