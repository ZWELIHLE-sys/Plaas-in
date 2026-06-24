import { Users, Beef, ClipboardList, Banknote } from 'lucide-react'
import { StatCard } from './StatCard'
import styles from './StatsGrid.module.css'

export function StatsGrid({
  farmers,
  livestock,
  records,
  income,
}: {
  farmers: number
  livestock: number
  records: number
  income: string
}) {
  return (
    <section className={styles.grid}>
      <StatCard icon={<Users size={22} />} label="Farmers" value={farmers} />
      <StatCard icon={<Beef size={22} />} label="Active livestock" value={livestock} />
      <StatCard icon={<ClipboardList size={22} />} label="Records processed" value={records} />
      <StatCard icon={<Banknote size={22} />} label="Income" value={income} />
    </section>
  )
}
