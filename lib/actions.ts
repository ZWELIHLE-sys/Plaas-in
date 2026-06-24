'use server'

// Server actions for the owner dashboard. Runs on the server (service-role key),
// so it can update records and revalidate the page that shows them.
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

const ALLOWED = new Set(['trial', 'active', 'inactive'])

export async function setSubscription(farmerId: string, status: string) {
  if (!ALLOWED.has(status)) return
  const { error } = await supabase
    .from('farmers')
    .update({ subscription_status: status })
    .eq('id', farmerId)
  if (error) throw error
  revalidatePath('/farmers')
}
