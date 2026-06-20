import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

// A presentational table. `rows` cells may be plain text or React nodes (badges).
export function DataTable({
  head,
  rows,
  empty,
}: {
  head: string[]
  rows: ReactNode[][]
  empty: string
}) {
  if (rows.length === 0) {
    return <p className={styles.empty}>{empty}</p>
  }
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className={styles.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={styles.row}>
              {row.map((cell, j) => (
                <td key={j} className={styles.td}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
