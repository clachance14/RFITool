"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { signIn, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            RFITrak Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Professional RFI management for general contractors
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
} 