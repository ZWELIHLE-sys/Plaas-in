import styles from './Badge.module.css'

// Maps a status string to a tone class defined in Badge.module.css.
const TONE: Record<string, string> = {
  Active: styles.active,
  Sold: styles.warn,
  Deceased: styles.neutral,
  Breeding: styles.purple,
  active: styles.active,
  trial: styles.info,
}

export function Badge({ text }: { text: string }) {
  const tone = TONE[text] ?? styles.active
  return <span className={`${styles.badge} ${tone}`}>{text}</span>
}
