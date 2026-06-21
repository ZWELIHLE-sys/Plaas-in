// Shell for every dashboard view: fixed sidebar + main area with a sticky topbar.
// Each route under (dashboard) renders only its own module into {children}.
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import styles from './layout.module.css'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar />
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
