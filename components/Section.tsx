import type { ReactNode } from 'react'
import styles from './Section.module.css'

// A titled white card. Use `padded` for free-form content; leave it off when the
// child is a full-width table that should sit flush to the card edges.
export function Section({
  title,
  children,
  padded = false,
}: {
  title: string
  children: ReactNode
  padded?: boolean
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <div className={padded ? styles.bodyPadded : undefined}>{children}</div>
    </section>
  )
}
