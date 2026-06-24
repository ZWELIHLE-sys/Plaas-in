// Shared data types used across the data layer and the dashboard UI.

export type Farmer = {
  id: string
  name: string | null
  farm_name: string | null
  phone: string
  location: string | null
  subscription_status: string | null
  created_at: string
}

export type Animal = {
  id: string
  animal_id: string | null
  species: string | null
  breed: string | null
  gender: string | null
  status: string | null
  breeding_status: string | null
  farmer_id: string
  mother_id: string | null
  father_id: string | null
  generation: number | null
  created_at: string
}

export type HealthRecord = {
  id: string
  farmer_id: string
  date: string
  action_type: string | null
  target: string | null
  chemical_used: string | null
  withdrawal_until: string | null
}

export type SaleRecord = {
  id: string
  farmer_id: string
  date: string
  item_details: string | null
  sale_type: string | null
  buyer_name: string | null
  sale_location: string | null
  amount: number | null
}
