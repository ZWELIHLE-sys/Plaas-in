// Animal tag generation: <INITIALS>-<SPECIES>-<NNN>, e.g. JD-GOAT-007.
// Initials come from the farmer's profile name; species is spelled out; the number
// is the next in sequence for that farmer + species.
import { supabase } from '@/lib/supabase'

export function farmerInitials(name: string | null): string | null {
  if (!name) return null
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  return parts
    .map((p) => p[0]!.toUpperCase())
    .join('')
    .slice(0, 3)
}

// How many animals of this species the farmer already has -> next sequence start.
export async function nextSeq(farmerId: string, species: string): Promise<number> {
  const { count } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('farmer_id', farmerId)
    .eq('species', species)
  return (count ?? 0) + 1
}

export function buildTag(initials: string, species: string, seq: number): string {
  return `${initials}-${species.toUpperCase()}-${String(seq).padStart(3, '0')}`
}
