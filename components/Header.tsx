import { BRAND } from '@/lib/constants'
import { Logo } from './Logo'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brandRow}>
          <Logo />
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.name}>{BRAND.name}</h1>
              <span className={styles.slogan}>{BRAND.slogan}</span>
            </div>
            <p className={styles.tagline}>Owner Dashboard — {BRAND.tagline}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
