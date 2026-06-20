import { Section } from './Section'

export function HerdBreakdown({ counts }: { counts: [string, number][] }) {
  return (
    <Section title="Herd by species (active)" padded>
      {counts.length === 0 ? (
        <p className="text-stone-500">No livestock recorded yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {counts.map(([species, n]) => (
            <span
              key={species}
              className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-900"
            >
              {species}: {n}
            </span>
          ))}
        </div>
      )}
    </Section>
  )
}
