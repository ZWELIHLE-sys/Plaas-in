// Small status pill. Colour reflects the livestock/subscription status.
const TONES: Record<string, string> = {
  Sold: 'bg-amber-100 text-amber-800',
  Deceased: 'bg-stone-200 text-stone-700',
  Breeding: 'bg-purple-100 text-purple-800',
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
}

export function Badge({ text }: { text: string }) {
  const tone = TONES[text] ?? 'bg-green-100 text-green-800'
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{text}</span>
}
