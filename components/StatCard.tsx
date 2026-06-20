import styles from './StatCard.module.css'

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.card}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}
