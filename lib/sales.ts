// Sales domain: recording a sale (and auto-marking the animal Sold) and
// reporting the recent sales ledger + total income over WhatsApp.
import { supabase } from '@/lib/supabase'
import { formatRand, formatDate, toISODate } from '@/lib/format'
import type { ParsedSale } from '@/lib/parser'

export async function logSale(farmerId: string, s: ParsedSale): Promise<string> {
  const item = s.item_details ?? null

  // If the sold item is a known animal tag, mark that animal Sold (never deleted).
  let soldNote = ''
  if (item) {
    const { data: animal } = await supabase
      .from('animals')
      .select('id,animal_id')
      .eq('farmer_id', farmerId)
      .ilike('animal_id', item)
      .limit(1)
      .maybeSingle()
    if (animal) {
      await supabase.from('animals').update({ status: 'Sold' }).eq('id', animal.id)
      soldNote = ` ${(animal as { animal_id: string }).animal_id} marked Sold.`
    }
  }

  const { error } = await supabase.from('sales').insert({
    farmer_id: farmerId,
    date: toISODate(new Date()),
    product_type: s.product_type ?? null,
    item_details: item,
    sale_type: s.sale_type ?? 'Direct',
    buyer_name: s.buyer_name ?? null,
    sale_location: s.sale_location ?? null,
    amount: s.amount ?? null,
  })
  if (error) throw error

  const ledger = s.amount != null ? ` Ledger +${formatRand(s.amount)}.` : ''
  return `✅ Sale recorded.${soldNote}${ledger}`.trim()
}

export async function salesReport(farmerId: string): Promise<string> {
  const { data, error } = await supabase
    .from('sales')
    .select('date,item_details,sale_type,buyer_name,amount')
    .eq('farmer_id', farmerId)
    .order('date', { ascending: false })
    .limit(5)

  if (error) throw error
  if (!data || data.length === 0) {
    return '💰 No sales recorded yet. Log one e.g. "Sold Bull-02 at Dundee Auction for R18,000".'
  }

  const total = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const lines = data.map((r) => {
    const amt = r.amount != null ? formatRand(Number(r.amount)) : '—'
    const bits = [r.item_details, r.sale_type, r.buyer_name].filter(Boolean).join(', ')
    return `• ${formatDate(r.date as string)} — ${bits} (${amt})`
  })
  return `💰 Recent sales (total ${formatRand(total)}):\n${lines.join('\n')}`
}
