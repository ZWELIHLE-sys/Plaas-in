import { getDashboardData } from '@/lib/queries'
import { HealthLog } from '@/components/HealthLog'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  const { health } = await getDashboardData()
  return <HealthLog records={health} />
}
