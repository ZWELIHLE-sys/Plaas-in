import { Section } from './Section'
import { DataTable } from './DataTable'
import { formatDate } from '@/lib/format'
import type { HealthRecord } from '@/lib/types'

export function HealthLog({ records }: { records: HealthRecord[] }) {
  return (
    <Section title="Health & vaccinations">
      <DataTable
        head={['Date', 'Action', 'Target', 'Vaccine / Medicine', 'Withdrawal until']}
        empty={'No health records yet — text "Vaccinated 10 calves for Blackquarter".'}
        rows={records.slice(0, 15).map((r) => [
          formatDate(r.date),
          r.action_type ?? '—',
          r.target ?? '—',
          r.chemical_used ?? '—',
          r.withdrawal_until ? formatDate(r.withdrawal_until) : '—',
        ])}
      />
    </Section>
  )
}
