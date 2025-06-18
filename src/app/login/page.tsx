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
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const { signIn, signUp, resetPassword, user, loading } = useAuth()
  const router = useRouter()

  // Helper function to determine if email domain is a common provider
  const isCommonEmailProvider = (email: string) => {
    const domain = email.toLowerCase().split('@')[1]
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']
    return commonProviders.includes(domain)
  }

  // Helper function to generate company name preview from domain
  const generateCompanyNamePreview = (email: string) => {
    const domain = email.toLowerCase().split('@')[1]
    if (!domain) return ''
    const baseName = domain.replace(/\.(com|org|net|edu|gov|ac|co\.uk|ca)$/i, '')
    return baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase() + ' Inc.'
  }

  // Update company name field behavior based on email
  useEffect(() => {
    if (email && isSignUp && !isCommonEmailProvider(email)) {
      // For business domains, clear company name (will be auto-generated)
      setCompanyName('')
    }
  }, [email, isSignUp])

  // Redirect to homepage if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace('/')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (isResetPassword) {
      const { error: resetError } = await resetPassword(email)
      if (resetError) {
        setError(resetError.message)
      } else {
        setResetEmailSent(true)
      }
      return
    }
    
    if (isSignUp) {
      // For business domains, use generated name; for personal emails, require user input
      const finalCompanyName = isCommonEmailProvider(email) 
        ? companyName 
        : generateCompanyNamePreview(email)
        
      const { error: signUpError } = await signUp(email, password, name, finalCompanyName)
      if (signUpError) {
        setError(signUpError.message)
      } else {
        router.push('/')
      }
    } else {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/')
      }
    }
  }

  const handleResetPasswordClick = () => {
    setIsResetPassword(true)
    setIsSignUp(false)
    setError(null)
    setResetEmailSent(false)
  }

  const handleBackToLogin = () => {
    setIsResetPassword(false)
    setError(null)
    setResetEmailSent(false)
  }

  const shouldShowCompanyField = isSignUp && email && isCommonEmailProvider(email)
  const shouldShowCompanyPreview = isSignUp && email && !isCommonEmailProvider(email)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {isResetPassword ? 'Reset Your Password' : isSignUp ? 'Create RFITrak Account' : 'RFITrak Login'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isResetPassword 
              ? 'Enter your email to receive a password reset link'
              : 'Professional RFI management for general contractors'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {resetEmailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700 text-sm">
                Password reset email sent! Check your inbox and follow the instructions to reset your password.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isSignUp && !isResetPassword && (
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

              {/* Company Name Field - Only for personal email providers */}
              {shouldShowCompanyField && (
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
                  <p className="mt-1 text-xs text-gray-500">
                    Personal email detected. Please enter your company name.
                  </p>
                </div>
              )}

              {/* Company Name Preview - For business domains */}
              {shouldShowCompanyPreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Assignment
                  </label>
                  <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>{generateCompanyNamePreview(email)}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Business email detected. You'll be automatically assigned to this company or join existing colleagues.
                    </p>
                  </div>
                </div>
              )}

              {!isResetPassword && (
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
              )}

              {/* Role Assignment Preview for Business Domains */}
              {shouldShowCompanyPreview && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-700">
                    <strong>Role Assignment:</strong> You'll be assigned as{' '}
                    <span className="font-medium">Super Admin</span> if you're the first user from your company, 
                    or <span className="font-medium">Admin</span> if colleagues have already signed up.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {!resetEmailSent && (
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
              {loading ? (
                isResetPassword ? 'Sending Email...' : isSignUp ? 'Creating Account...' : 'Signing in...'
              ) : (
                isResetPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign in'
              )}
            </button>
          )}

          <div className="text-center space-y-2">
            {isResetPassword ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Back to Sign In
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setName('')
                    setCompanyName('')
                    setEmail('')
                    setPassword('')
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium block w-full"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleResetPasswordClick}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Forgot your password?
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
} 