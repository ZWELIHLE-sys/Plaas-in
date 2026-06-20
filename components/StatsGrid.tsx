import { StatCard } from './StatCard'
import styles from './StatsGrid.module.css'

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
    <section className={styles.grid}>
      <StatCard label="Farmers" value={farmers} />
      <StatCard label="Active livestock" value={livestock} />
      <StatCard label="Records processed" value={records} />
      <StatCard label="Sales logged" value={sales} />
    </section>
  )
}
