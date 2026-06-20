// Read-side data access for the owner dashboard. Keeps all dashboard Supabase
// queries in one place so the page component stays presentational.
import { supabase } from '@/lib/supabase'
import type { Animal, Farmer, HealthRecord } from '@/lib/types'

export type DashboardData = {
  farmers: Farmer[]
  animals: Animal[]
  health: HealthRecord[]
  salesCount: number
  error: string | null
}

export async function getDashboardData(): Promise<DashboardData> {
  const [farmersRes, animalsRes, healthRes, salesRes] = await Promise.all([
    supabase
      .from('farmers')
      .select('id,name,farm_name,phone,location,subscription_status,created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('animals')
      .select('id,animal_id,species,breed,gender,status,farmer_id,created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('health_log')
      .select('id,farmer_id,date,action_type,target,chemical_used,withdrawal_until')
      .order('date', { ascending: false }),
    supabase.from('sales').select('id', { count: 'exact', head: true }),
  ])

  return {
    farmers: (farmersRes.data ?? []) as Farmer[],
    animals: (animalsRes.data ?? []) as Animal[],
    health: (healthRes.data ?? []) as HealthRecord[],
    salesCount: salesRes.count ?? 0,
    error: farmersRes.error?.message ?? animalsRes.error?.message ?? null,
  }
}
