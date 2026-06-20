import { Section } from './Section'
import styles from './HerdBreakdown.module.css'

export function HerdBreakdown({ counts }: { counts: [string, number][] }) {
  return (
    <Section title="Herd by species (active)" padded>
      {counts.length === 0 ? (
        <p className={styles.empty}>No livestock recorded yet.</p>
      ) : (
        <div className={styles.pills}>
          {counts.map(([species, n]) => (
            <span key={species} className={styles.pill}>
              <span className={styles.species}>{species}</span>
              <span className={styles.count}>{n}</span>
            </span>
          ))}
        </div>
      )}
    </Section>
  )
}
