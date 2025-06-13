"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp, user, loading } = useAuth()
  const router = useRouter()

  // Redirect to homepage if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace('/')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (isSignUp) {
      const { error: signUpError } = await signUp(email, password, name, companyName)
      if (signUpError) {
        setError(signUpError.message)
      } else {
        // Successful signup - redirect will happen via useEffect when user state updates
        router.push('/')
      }
    } else {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
      } else {
        // Successful login - redirect will happen via useEffect when user state updates
        router.push('/')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create RFITrak Account' : 'RFITrak Login'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Professional RFI management for general contractors
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={cn(
                      "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
                      "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                    className={cn(
                      "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
                      "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={cn(
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
                  "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={cn(
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
                  "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm",
              "text-sm font-medium text-white bg-blue-600 hover:bg-blue-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200"
            )}
          >
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign in')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                // Clear form when switching modes
                setName('')
                setCompanyName('')
                setEmail('')
                setPassword('')
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 