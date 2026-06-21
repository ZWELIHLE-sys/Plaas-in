// Shared dashboard navigation — used by the Sidebar and the Topbar so routes and
// labels stay in sync in one place.
import {
  LayoutDashboard,
  Users,
  Beef,
  GitBranch,
  Syringe,
  Banknote,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { href: string; label: string; Icon: LucideIcon }

export const NAV: NavItem[] = [
  { href: '/', label: 'Overview', Icon: LayoutDashboard },
  { href: '/farmers', label: 'Farmers', Icon: Users },
  { href: '/livestock', label: 'Livestock', Icon: Beef },
  { href: '/bloodline', label: 'Bloodline', Icon: GitBranch },
  { href: '/health', label: 'Health & vaccinations', Icon: Syringe },
  { href: '/sales', label: 'Sales', Icon: Banknote },
]
