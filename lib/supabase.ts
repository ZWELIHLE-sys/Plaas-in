// Server-side Supabase client for Plaas-In.
// Uses the SERVICE ROLE key, so this file must ONLY ever be imported from
// server code (route handlers, server actions) — never from a Client Component.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  // Fail loudly in dev/build logs instead of silently misbehaving at runtime.
  console.warn(
    '[plaas-in] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. ' +
      'Database calls will fail until you add them to your environment.',
  )
}

export const supabase = createClient(url ?? '', serviceRoleKey ?? '', {
  auth: { persistSession: false },
})

// Find the farmer for a WhatsApp phone number, creating a trial record on first contact.
export async function getOrCreateFarmer(phone: string) {
  const { data: existing } = await supabase
    .from('farmers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('farmers')
    .insert({ phone })
    .select('*')
    .single()

  if (error) throw error
  return created
}
