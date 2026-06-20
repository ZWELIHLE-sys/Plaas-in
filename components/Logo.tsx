import styles from './Logo.module.css'

// Plaas-In sprout mark. Pure SVG so it scales crisply and inherits colour from
// CSS (currentColor). Sizing/colour live in Logo.module.css — no inline styles.
export function Logo() {
  return (
    <span className={styles.mark} aria-hidden="true">
      <svg viewBox="0 0 32 32" className={styles.icon} role="img">
        <circle cx="16" cy="16" r="16" className={styles.disc} />
        <path
          className={styles.stem}
          d="M16 25v-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          className={styles.leaf}
          d="M16 17c0-4 3-6.5 7-6.8-.2 4-2.8 6.8-7 6.8Z"
        />
        <path
          className={styles.leaf}
          d="M16 19c0-3.4-2.6-5.6-6-5.9.2 3.5 2.4 5.9 6 5.9Z"
        />
      </svg>
    </span>
  )
}
