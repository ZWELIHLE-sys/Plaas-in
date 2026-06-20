import { BRAND } from '@/lib/constants'

export function Header() {
  return (
    <header className="bg-green-800 text-white">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {BRAND.emoji} {BRAND.name}
          </h1>
          <span className="text-sm font-medium text-green-200">— {BRAND.slogan}</span>
        </div>
        <p className="mt-1 text-green-100">Owner Dashboard — {BRAND.tagline}</p>
      </div>
    </header>
  )
}
