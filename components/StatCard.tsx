export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-bold text-green-800">{value}</div>
      <div className="mt-1 text-sm text-stone-500">{label}</div>
    </div>
  )
}
