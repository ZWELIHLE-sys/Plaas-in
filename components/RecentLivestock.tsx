import { Section } from './Section'
import { DataTable } from './DataTable'
import { Badge } from './Badge'
import { formatDate } from '@/lib/format'
import type { Animal } from '@/lib/types'

export function RecentLivestock({
  animals,
  farmerNames,
  tagById,
}: {
  animals: Animal[]
  farmerNames: Record<string, string>
  tagById: Record<string, string>
}) {
  const parentsOf = (a: Animal): string => {
    const mother = a.mother_id ? tagById[a.mother_id] : undefined
    const father = a.father_id ? tagById[a.father_id] : undefined
    return [mother, father].filter(Boolean).join(' × ') || '—'
  }

  return (
    <Section title="Recent livestock">
      <DataTable
        head={['Tag', 'Species', 'Breed', 'Gender', 'Gen', 'Parents', 'Status', 'Farmer', 'Added']}
        empty={'No animals yet — text "Added 3 Boer goats" to the WhatsApp number.'}
        rows={animals.slice(0, 25).map((a) => [
          a.animal_id ?? '—',
          a.species ?? '—',
          a.breed ?? '—',
          a.gender ?? '—',
          a.generation ?? 1,
          parentsOf(a),
          <Badge key={a.id} text={a.status ?? 'Active'} />,
          farmerNames[a.farmer_id] ?? '—',
          formatDate(a.created_at),
        ])}
      />
    </Section>
  )
}
