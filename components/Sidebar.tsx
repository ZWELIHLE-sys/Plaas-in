'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'
import { BRAND } from '@/lib/constants'
import { NAV } from '@/lib/nav'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo />
        <span className={styles.brandName}>{BRAND.name}</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${active ? styles.active : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={styles.foot}>🌱 {BRAND.slogan}</div>
    </aside>
  )
}
