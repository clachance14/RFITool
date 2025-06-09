import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { login as authLogin, logout as authLogout, getSession, refreshSession, AuthUser } from '@/lib/auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const { session, error } = await getSession()
      
      if (error) throw new Error(error)
      
      setIsAuthenticated(!!session)
      setUser(session?.user || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check session')
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { user, error } = await authLogin(email, password)
      
      if (error) throw new Error(error)
      
      setIsAuthenticated(true)
      setUser(user)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { error } = await authLogout()
      
      if (error) throw new Error(error)
      
      setIsAuthenticated(false)
      setUser(null)
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
        setUser(null)
      } else {
        setIsAuthenticated(!!session)
        setUser(session?.user || null)
      }
    }, 1000 * 60 * 30) // Refresh every 30 minutes
    
    return () => clearInterval(refreshInterval)
  }, [checkSession])

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    checkSession
  }
} 