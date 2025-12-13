// Service-related types for enhanced schema
import { Database } from './database.types'

export type LocationType = Database['public']['Enums']['location_type']
export type UrgencyLevel = Database['public']['Enums']['urgency_level']
export type PriceType = Database['public']['Enums']['price_type']

export type ServiceCategory = Database['public']['Tables']['service_categories']['Row']
export type ServiceCategoryInsert = Database['public']['Tables']['service_categories']['Insert']
export type ServiceCategoryUpdate = Database['public']['Tables']['service_categories']['Update']

export type ServiceRequest = Database['public']['Tables']['service_requests']['Row']
export type ServiceRequestInsert = Database['public']['Tables']['service_requests']['Insert']
export type ServiceRequestUpdate = Database['public']['Tables']['service_requests']['Update']

export type HelperService = Database['public']['Tables']['helper_services']['Row']
export type HelperServiceInsert = Database['public']['Tables']['helper_services']['Insert']
export type HelperServiceUpdate = Database['public']['Tables']['helper_services']['Update']

export type HelperProfile = Database['public']['Tables']['helper_profiles']['Row']
export type HelperProfileInsert = Database['public']['Tables']['helper_profiles']['Insert']
export type HelperProfileUpdate = Database['public']['Tables']['helper_profiles']['Update']

export type SurgePricingRule = Database['public']['Tables']['surge_pricing_rules']['Row']
export type SurgePricingRuleInsert = Database['public']['Tables']['surge_pricing_rules']['Insert']
export type SurgePricingRuleUpdate = Database['public']['Tables']['surge_pricing_rules']['Update']

// Working hours type
export interface WorkingHours {
  monday: {start: string; end: string; available: boolean}
  tuesday: {start: string; end: string; available: boolean}
  wednesday: {start: string; end: string; available: boolean}
  thursday: {start: string; end: string; available: boolean}
  friday: {start: string; end: string; available: boolean}
  saturday: {start: string; end: string; available: boolean}
  sunday: {start: string; end: string; available: boolean}
}

// Service type details examples
export interface PlumbingDetails {
  pipe_length?: number // for pipe repair (in feet)
  number_of_taps?: number // for tap fixing
  job_description?: string // for cariphering
}

export interface ElectricalDetails {
  number_of_points?: number // for wiring
  number_of_switches?: number // for switch repair
  number_of_appliances?: number // for appliance fixing
}

export interface CleaningDetails {
  number_of_rooms?: number // for home cleaning
  area_sqft?: number // for office cleaning
  hours_required?: number // for deep cleaning
}

export interface VehicleRepairDetails {
  vehicle_type?: 'car' | 'bike' | 'scooter'
  breakdown_location?: string // for highway emergency
  issue_description?: string
}

export type ServiceTypeDetails = 
  | PlumbingDetails 
  | ElectricalDetails 
  | CleaningDetails 
  | VehicleRepairDetails 
  | Record<string, unknown>

// Helper matching result
export interface NearbyHelper {
  helper_id: string
  helper_name: string
  distance_km: number
  rating: number
  total_reviews: number
  hourly_rate: number
  is_available: boolean
  response_time_minutes: number | null
}

// Price calculation params
export interface CalculatePriceParams {
  category_id: string
  quantity: number
  urgency: UrgencyLevel
  location_type: LocationType
  helper_id?: string | null
}

// Helper search params
export interface FindNearbyHelpersParams {
  category_id: string
  latitude: number
  longitude: number
  urgency?: UrgencyLevel | null
  max_distance_km?: number | null
  limit?: number | null
}
