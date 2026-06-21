import { getDashboardData } from '@/lib/queries'
import { RecentLivestock } from '@/components/RecentLivestock'

export const dynamic = 'force-dynamic'

export default async function LivestockPage() {
  const { farmers, animals } = await getDashboardData()

  const farmerNames: Record<string, string> = {}
  for (const f of farmers) {
    farmerNames[f.id] = f.name ?? f.phone
  }

  return <RecentLivestock animals={animals} farmerNames={farmerNames} />
}
