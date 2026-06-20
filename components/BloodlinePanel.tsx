import { Section } from './Section'
import { DataTable } from './DataTable'
import type { Animal } from '@/lib/types'

// Shows only animals that have a recorded parent — the bloodline/breeding records.
// Given its own section so this flagship feature is front and centre.
export function BloodlinePanel({
  animals,
  tagById,
}: {
  animals: Animal[]
  tagById: Record<string, string>
}) {
  const births = animals.filter((a) => a.mother_id || a.father_id)
  const tagOf = (id: string | null) => (id ? tagById[id] ?? '—' : '—')

  return (
    <Section title="Bloodline & breeding">
      <DataTable
        head={['Animal', 'Species', 'Mother', 'Father', 'Generation']}
        empty={'No bloodline records yet — text "New calf born. Mother Cow-04, Father Bull-01".'}
        rows={births.map((a) => [
          a.animal_id ?? '—',
          a.species ?? '—',
          tagOf(a.mother_id),
          tagOf(a.father_id),
          `Gen ${a.generation ?? 1}`,
        ])}
      />
    </Section>
  )
}
