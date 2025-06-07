import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { login as authLogin, logout as authLogout, getSession, refreshSession } from '@/lib/auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const { session, error } = await getSession()
      
      if (error) throw new Error(error)
      
      setIsAuthenticated(!!session)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check session')
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { success, error } = await authLogin(username, password)
      
      if (!success) throw new Error(error)
      
      setIsAuthenticated(true)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { success, error } = await authLogout()
      
      if (!success) throw new Error(error)
      
      setIsAuthenticated(false)
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Check session on mount and set up refresh interval
  useEffect(() => {
    checkSession()
    
    const refreshInterval = setInterval(async () => {
      const { session, error } = await refreshSession()
      if (error) {
        console.error('Session refresh failed:', error)
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(!!session)
      }
    }, 1000 * 60 * 30) // Refresh every 30 minutes
    
    return () => clearInterval(refreshInterval)
  }, [checkSession])

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkSession
  }
} 