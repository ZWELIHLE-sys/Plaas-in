'use client'

import { useTransition } from 'react'
import { setSubscription } from '@/lib/actions'
import styles from './SubscriptionToggle.module.css'

const OPTIONS = ['trial', 'active', 'inactive'] as const

export function SubscriptionToggle({ farmerId, status }: { farmerId: string; status: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      className={`${styles.select} ${styles[status] ?? ''}`}
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value
        startTransition(() => {
          void setSubscription(farmerId, value)
        })
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o[0].toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  )
}
