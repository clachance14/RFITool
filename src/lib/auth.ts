import { supabase } from './supabase'

// Hardcoded credentials for MVP
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'rfiware2025'

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@rfiware.com',
        password: ADMIN_PASSWORD,
      })

      if (error) throw error

      return { success: true }
    }

    return { 
      success: false, 
      error: 'Invalid username or password' 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error

    return { session, error: null }
  } catch (error) {
    return { 
      session: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) throw error

    return { session, error: null }
  } catch (error) {
    return { 
      session: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
} 