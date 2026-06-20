// Health domain actions: logging a health event (dipping / vaccination /
// treatment) and reporting recent health history over WhatsApp.
import { supabase } from '@/lib/supabase'
import { addDays, formatDate, toISODate } from '@/lib/format'
import type { ParsedHealth } from '@/lib/parser'

export async function logHealth(farmerId: string, h: ParsedHealth): Promise<string> {
  const today = new Date()
  const withdrawalUntil =
    h.withdrawal_days && h.withdrawal_days > 0 ? toISODate(addDays(today, h.withdrawal_days)) : null

  const row = {
    farmer_id: farmerId,
    date: toISODate(today),
    section: 'Livestock',
    target: h.target ?? null,
    action_type: h.action_type ?? 'Treatment',
    chemical_used: h.chemical_used ?? null,
    withdrawal_until: withdrawalUntil,
    notes: h.notes ?? null,
  }

  const { error } = await supabase.from('health_log').insert(row)
  if (error) throw error

  const summary = [row.action_type, row.target, row.chemical_used].filter(Boolean).join(', ')
  let reply = `✅ Health log updated — ${summary}, today.`
  if (withdrawalUntil) {
    reply += `\n⚠️ Withdrawal until ${formatDate(withdrawalUntil)} — do not sell or slaughter before then.`
  }
  return reply
}

export async function healthReport(farmerId: string): Promise<string> {
  const { data, error } = await supabase
    .from('health_log')
    .select('date,action_type,target,chemical_used')
    .eq('farmer_id', farmerId)
    .order('date', { ascending: false })
    .limit(5)

  if (error) throw error
  if (!data || data.length === 0) {
    return '📋 No health records yet. Log one e.g. "Vaccinated 10 calves for Blackquarter".'
  }

  const lines = data.map((r) => {
    const bits = [r.action_type, r.target, r.chemical_used].filter(Boolean).join(', ')
    return `• ${formatDate(r.date as string)} — ${bits}`
  })
  return `📋 Recent health records:\n${lines.join('\n')}`
}
