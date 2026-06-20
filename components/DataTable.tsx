import type { ReactNode } from 'react'

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
    return <p className="px-5 py-6 text-stone-500">{empty}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-stone-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-5 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-stone-50">
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3">
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
