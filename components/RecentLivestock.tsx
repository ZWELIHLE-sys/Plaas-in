import { Section } from './Section'
import { DataTable } from './DataTable'
import { Badge } from './Badge'
import { formatDate } from '@/lib/format'
import type { Animal } from '@/lib/types'

export function RecentLivestock({
  animals,
  farmerNames,
}: {
  animals: Animal[]
  farmerNames: Record<string, string>
}) {
  return (
    <Section title="Recent livestock">
      <DataTable
        head={['Tag', 'Species', 'Breed', 'Gender', 'Status', 'Farmer', 'Added']}
        empty={'No animals yet — text "Added 3 Boer goats" to the WhatsApp number.'}
        rows={animals.slice(0, 25).map((a) => [
          a.animal_id ?? '—',
          a.species ?? '—',
          a.breed ?? '—',
          a.gender ?? '—',
          <Badge key={a.id} text={a.status ?? 'Active'} />,
          farmerNames[a.farmer_id] ?? '—',
          formatDate(a.created_at),
        ])}
      />
    </Section>
  )
}
