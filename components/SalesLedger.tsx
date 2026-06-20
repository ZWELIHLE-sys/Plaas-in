import { Section } from './Section'
import { DataTable } from './DataTable'
import { formatDate, formatRand } from '@/lib/format'
import type { SaleRecord } from '@/lib/types'

export function SalesLedger({ sales }: { sales: SaleRecord[] }) {
  const total = sales.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  return (
    <Section title={`Sales ledger — ${formatRand(total)} total`}>
      <DataTable
        head={['Date', 'Item', 'Type', 'Buyer', 'Location', 'Amount']}
        empty={'No sales yet — text "Sold Bull-02 at Dundee Auction for R18,000".'}
        rows={sales.slice(0, 15).map((r) => [
          formatDate(r.date),
          r.item_details ?? '—',
          r.sale_type ?? '—',
          r.buyer_name ?? '—',
          r.sale_location ?? '—',
          r.amount != null ? formatRand(r.amount) : '—',
        ])}
      />
    </Section>
  )
}
