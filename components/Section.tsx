import type { ReactNode } from 'react'

// A titled white card. Use `padded` for free-form content; leave it off when the
// child is a full-width table that should sit flush to the card edges.
export function Section({
  title,
  children,
  padded = false,
}: {
  title: string
  children: ReactNode
  padded?: boolean
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <h2 className="border-b border-stone-200 px-5 py-4 text-lg font-semibold">{title}</h2>
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}
