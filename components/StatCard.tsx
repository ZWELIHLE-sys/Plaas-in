import type { ReactNode } from 'react'
import styles from './StatCard.module.css'

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: ReactNode
}) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <div>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
      </div>
    </div>
  )
}
