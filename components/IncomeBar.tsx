'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { formatRand } from '@/lib/format'
import styles from './Charts.module.css'

const rand = (v: unknown) => formatRand(Number(v) || 0)

export function IncomeBar({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p className={styles.empty}>No sales recorded yet.</p>

  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a8a57" />
              <stop offset="100%" stopColor="#045c3a" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1ec" />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={rand}
          />
          <Tooltip
            formatter={rand}
            cursor={{ fill: 'rgba(0,122,77,0.06)' }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e4e8df',
              boxShadow: '0 4px 16px rgba(16,32,20,0.1)',
            }}
          />
          <Bar dataKey="value" fill="url(#incomeGrad)" radius={[8, 8, 0, 0]} maxBarSize={54}>
            <LabelList dataKey="value" position="top" formatter={rand} fontSize={11} fill="#45504a" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
