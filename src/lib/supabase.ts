import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (has elevated permissions)
// Only create this on the server side where the service role key is available
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to get admin client safely
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on the server side')
  }
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin is not available - check SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  return supabaseAdmin
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
} 