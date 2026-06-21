'use client'

import { usePathname } from 'next/navigation'
import { BRAND } from '@/lib/constants'
import { NAV } from '@/lib/nav'
import styles from './Topbar.module.css'

export function Topbar() {
  const pathname = usePathname()
  const title = NAV.find((n) => n.href === pathname)?.label ?? 'Dashboard'

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>
      <span className={styles.slogan}>{BRAND.slogan}</span>
    </header>
  )
}
