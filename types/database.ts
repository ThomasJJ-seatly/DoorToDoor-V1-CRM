export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'rep'
export type PaymentStatus = 'paid' | 'pending' | 'failed'
export type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'other'
export type DeliveryStatus = 'delivered' | 'pending' | 'na'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface DailyActivity {
  id: string
  user_id: string
  date: string
  suburb: string
  doors_knocked: number
  conversations: number
  presentations: number
  sales_count: number
  hours_worked: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  user_id: string
  sale_date: string
  customer_business_name: string
  customer_suburb: string
  customer_address: string | null
  customer_contact_name: string | null
  customer_phone: string | null
  customer_email: string | null
  product: string
  unit_price: number
  quantity: number
  total_value: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  delivery_status: DeliveryStatus
  commission: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  business_name: string
  suburb: string | null
  address: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  first_sale_date: string | null
  last_sale_date: string | null
  total_spend: number
  total_orders: number
  notes: string | null
}

export interface SaleWithUser extends Sale {
  user: { full_name: string; email: string }
}

export interface Database {
  public: {
    PostgrestVersion: "12"
    Tables: {
      users: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
        Relationships: []
      }
      daily_activity: {
        Row: DailyActivity
        Insert: Omit<DailyActivity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DailyActivity, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Sale, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id'>
        Update: Partial<Omit<Customer, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      calculate_commission: {
        Args: { p_user_id: string; p_sale_date: string; p_quantity: number }
        Returns: number
      }
    }
    Enums: {
      user_role: UserRole
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      delivery_status: DeliveryStatus
    }
    CompositeTypes: Record<string, never>
  }
}
