'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import styles from './Charts.module.css'

const COLORS: Record<string, string> = {
  Cattle: '#8b5e3c',
  Goat: '#e08a2b',
  Sheep: '#5b8def',
  Pig: '#d96a9a',
  Other: '#9aa39b',
}

export function HerdDonut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p className={styles.empty}>No livestock recorded yet.</p>

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donutChart}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={COLORS[d.name] ?? COLORS.Other} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #e4e8df',
                boxShadow: '0 4px 16px rgba(16,32,20,0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className={styles.donutCenter}>
          <span className={styles.donutTotal}>{total}</span>
          <span className={styles.donutLabel}>animals</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {data.map((d) => (
          <li key={d.name} className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles[d.name] ?? styles.Other}`} />
            {d.name}
            <span className={styles.legendCount}>· {d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
