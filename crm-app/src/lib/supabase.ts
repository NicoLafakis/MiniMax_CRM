import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fnljrbrvoprncsnltjzx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubGpyYnJ2b3BybmNzbmx0anp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTE2NzgsImV4cCI6MjA3NzI4NzY3OH0.gXJ6_s4X_-BuYX2ylVesypuqU6Tv59y4YpWtIpn1BZE'

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
