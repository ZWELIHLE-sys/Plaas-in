import { StatCard } from './StatCard'

export function StatsGrid({
  farmers,
  livestock,
  records,
  sales,
}: {
  farmers: number
  livestock: number
  records: number
  sales: number
}) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="Farmers" value={farmers} />
      <StatCard label="Active livestock" value={livestock} />
      <StatCard label="Records processed" value={records} />
      <StatCard label="Sales logged" value={sales} />
    </section>
  )
}
