import { getDashboardData } from '@/lib/queries'
import { SalesLedger } from '@/components/SalesLedger'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const { sales } = await getDashboardData()
  return <SalesLedger sales={sales} />
}
