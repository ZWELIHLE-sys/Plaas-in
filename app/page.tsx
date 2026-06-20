// Plaas-In owner dashboard. A thin Server Component: it fetches the data, derives
// a few totals, and hands everything to focused presentational components.
import { getDashboardData } from '@/lib/queries'
import { Header } from '@/components/Header'
import { StatsGrid } from '@/components/StatsGrid'
import { HerdBreakdown } from '@/components/HerdBreakdown'
import { FarmerRegistry } from '@/components/FarmerRegistry'
import { RecentLivestock } from '@/components/RecentLivestock'

// Always render fresh data (this reads the database on each request).
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { farmers, animals, healthCount, salesCount, error } = await getDashboardData()

  const activeAnimals = animals.filter((a) => a.status === 'Active')
  const recordsProcessed = animals.length + healthCount + salesCount

  const herdCounts = new Map<string, number>()
  for (const a of activeAnimals) {
    const s = a.species ?? 'Other'
    herdCounts.set(s, (herdCounts.get(s) ?? 0) + 1)
  }

  const animalCounts: Record<string, number> = {}
  for (const a of animals) {
    animalCounts[a.farmer_id] = (animalCounts[a.farmer_id] ?? 0) + 1
  }

  const farmerNames: Record<string, string> = {}
  for (const f of farmers) {
    farmerNames[f.id] = f.name ?? f.phone
  }

  return (
    <main className="min-h-full bg-stone-50 text-stone-900">
      <Header />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            Could not load data: {error}. Check your Supabase keys in <code>.env.local</code>.
          </div>
        )}

        <StatsGrid
          farmers={farmers.length}
          livestock={activeAnimals.length}
          records={recordsProcessed}
          sales={salesCount}
        />
        <HerdBreakdown counts={[...herdCounts.entries()]} />
        <FarmerRegistry farmers={farmers} animalCounts={animalCounts} />
        <RecentLivestock animals={animals} farmerNames={farmerNames} />

        <p className="pt-2 text-center text-sm text-stone-400">
          Records are stored securely and are never deleted — sold or deceased animals keep their
          history.
        </p>
      </div>
    </main>
  )
}
