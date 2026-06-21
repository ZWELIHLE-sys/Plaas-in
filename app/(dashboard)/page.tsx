// Overview — KPIs + charts only.
import { getDashboardData } from '@/lib/queries'
import { StatsGrid } from '@/components/StatsGrid'
import { Section } from '@/components/Section'
import { HerdDonut } from '@/components/HerdDonut'
import { IncomeBar } from '@/components/IncomeBar'
import { formatRand } from '@/lib/format'
import styles from './layout.module.css'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const { farmers, animals, health, sales, error } = await getDashboardData()

  const activeAnimals = animals.filter((a) => a.status === 'Active')
  const records = animals.length + health.length + sales.length
  const income = sales.reduce((sum, s) => sum + (s.amount ?? 0), 0)

  const herdCounts = new Map<string, number>()
  for (const a of activeAnimals) {
    const s = a.species ?? 'Other'
    herdCounts.set(s, (herdCounts.get(s) ?? 0) + 1)
  }
  const herdData = [...herdCounts.entries()].map(([name, value]) => ({ name, value }))

  const incomeMap = new Map<string, number>()
  for (const s of sales) {
    if (s.amount == null) continue
    const key = new Date(s.date).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' })
    incomeMap.set(key, (incomeMap.get(key) ?? 0) + s.amount)
  }
  const incomeData = [...incomeMap.entries()].map(([name, value]) => ({ name, value })).reverse()

  return (
    <>
      {error && <div className={styles.error}>Could not load data: {error}</div>}

      <StatsGrid
        farmers={farmers.length}
        livestock={activeAnimals.length}
        records={records}
        income={formatRand(income)}
      />

      <div className={styles.chartsRow}>
        <Section title="Herd composition" padded>
          <HerdDonut data={herdData} />
        </Section>
        <Section title="Income by month" padded>
          <IncomeBar data={incomeData} />
        </Section>
      </div>
    </>
  )
}
