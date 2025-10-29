import { createClient } from '@supabase/supabase-js'

// Read from Vite environment; no hardcoded fallbacks. Configure via crm-app/.env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy crm-app/.env.example to .env.local and set your Supabase project values.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Customer = {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  custom_fields?: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export type Deal = {
  id: string
  user_id: string
  customer_id?: string
  title: string
  description?: string
  value: number
  stage: string
  expected_close_date?: string
  probability: number
  created_at: string
  updated_at: string
}

export type Ticket = {
  id: string
  user_id: string
  customer_id?: string
  title: string
  description?: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export type Activity = {
  id: string
  user_id: string
  customer_id?: string
  deal_id?: string
  ticket_id?: string
  type: string
  subject: string
  description?: string
  due_date?: string
  completed: boolean
  created_at: string
  updated_at: string
}

export type Contract = {
  id: string
  user_id: string
  deal_id?: string
  customer_id?: string
  title: string
  description?: string
  value: number
  start_date?: string
  end_date?: string
  status: string
  created_at: string
  updated_at: string
}

export type WorkflowRule = {
  id: string
  user_id: string
  name: string
  trigger_type: string
  trigger_value: Record<string, any>
  action_type: string
  action_value: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Attachment = {
  id: string
  user_id: string
  related_type: string
  related_id: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  created_at: string
}
