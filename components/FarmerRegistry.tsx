import { Section } from './Section'
import { DataTable } from './DataTable'
import { Badge } from './Badge'
import { formatDate } from '@/lib/format'
import type { Farmer } from '@/lib/types'

export function FarmerRegistry({
  farmers,
  animalCounts,
}: {
  farmers: Farmer[]
  animalCounts: Record<string, number>
}) {
  return (
    <Section title="Farmer Registry">
      <DataTable
        head={['Name', 'Farm', 'Area', 'Phone', 'Plan', 'Animals', 'Joined']}
        empty="No farmers yet — they appear automatically on first WhatsApp message."
        rows={farmers.map((f) => [
          f.name ?? '—',
          f.farm_name ?? '—',
          f.location ?? '—',
          f.phone,
          <Badge key={f.id} text={f.subscription_status ?? 'trial'} />,
          String(animalCounts[f.id] ?? 0),
          formatDate(f.created_at),
        ])}
      />
    </Section>
  )
}
