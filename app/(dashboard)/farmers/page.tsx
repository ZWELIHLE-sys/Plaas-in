import { getDashboardData } from '@/lib/queries'
import { FarmerRegistry } from '@/components/FarmerRegistry'

export const dynamic = 'force-dynamic'

export default async function FarmersPage() {
  const { farmers, animals } = await getDashboardData()

  const animalCounts: Record<string, number> = {}
  for (const a of animals) {
    animalCounts[a.farmer_id] = (animalCounts[a.farmer_id] ?? 0) + 1
  }

  return <FarmerRegistry farmers={farmers} animalCounts={animalCounts} />
}
