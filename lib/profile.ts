// Farmer profile actions: saving the farmer's name, farm and area/location.
import { supabase } from '@/lib/supabase'
import type { ParsedProfile } from '@/lib/parser'

export async function updateProfile(
  farmerId: string,
  profile: ParsedProfile,
): Promise<string> {
  const patch: Record<string, unknown> = {}
  if (profile.name) patch.name = profile.name
  if (profile.farm_name) patch.farm_name = profile.farm_name
  if (profile.location) patch.location = profile.location

  if (Object.keys(patch).length === 0) {
    return 'ℹ️ To register, send: "Register farmer: Your Name, Farm Name, Area".'
  }

  const { error } = await supabase.from('farmers').update(patch).eq('id', farmerId)
  if (error) throw error

  const parts = [profile.name, profile.farm_name, profile.location].filter(Boolean)
  return `✅ Profile saved — ${parts.join(', ')}. Welcome aboard!`
}
