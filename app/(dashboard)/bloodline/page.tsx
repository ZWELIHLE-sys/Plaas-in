import { getDashboardData } from '@/lib/queries'
import { Section } from '@/components/Section'
import { BloodlineTree } from '@/components/BloodlineTree'
import { BloodlinePanel } from '@/components/BloodlinePanel'

export const dynamic = 'force-dynamic'

export default async function BloodlinePage() {
  const { animals } = await getDashboardData()

  const tagById: Record<string, string> = {}
  for (const a of animals) {
    tagById[a.id] = a.animal_id ?? '—'
  }

  return (
    <>
      <Section title="Family tree (dam lines)" padded>
        <BloodlineTree animals={animals} tagById={tagById} />
      </Section>
      <BloodlinePanel animals={animals} tagById={tagById} />
    </>
  )
}
