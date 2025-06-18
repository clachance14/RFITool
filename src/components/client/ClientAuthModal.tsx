"use client";

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToken: string;
  companyName?: string;
  onLoginSuccess?: () => void;
}

export function ClientAuthModal({ 
  isOpen, 
  onClose, 
  clientToken, 
  companyName,
  onLoginSuccess 
}: ClientAuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isResetPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
          return;
        }
        setResetEmailSent(true);
        return;
      }

      if (isSignUp) {
        const { error } = await signUp(email, password, name, companyName || 'Client Company');
        if (error) {
          setError(error.message);
          return;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          return;
        }
      }

      // Store client token for portal access
      sessionStorage.setItem('client_portal_access', 'true');
      sessionStorage.setItem('client_token', clientToken);
      
      onLoginSuccess?.();
      onClose();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordClick = () => {
    setIsResetPassword(true);
    setIsSignUp(false);
    setError(null);
    setResetEmailSent(false);
  };

  const handleBackToLogin = () => {
    setIsResetPassword(false);
    setError(null);
    setResetEmailSent(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
              </h3>
              <p className="text-sm text-gray-600">
                {isResetPassword 
                  ? 'Enter your email to receive a password reset link'
                  : `Access your RFI portal for ${companyName || 'your company'}`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {resetEmailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-700 text-sm">
                Password reset email sent! Check your inbox and follow the instructions to reset your password.
              </p>
            </div>
          ) : (
            <>
              {isSignUp && !isResetPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {!isResetPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {!resetEmailSent && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {isResetPassword ? (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Reset Email</span>
                    </>
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </>
              )}
            </button>
          )}

          <div className="text-center space-y-2">
            {isResetPassword ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Back to Sign In
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-600 hover:text-blue-700 text-sm block w-full"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"}
                </button>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleResetPasswordClick}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Forgot your password?
                  </button>
                )}
              </>
            )}
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="text-xs text-gray-600">
            <p className="mb-2">
              <strong>What you get with an account:</strong>
            </p>
            <ul className="space-y-1">
              <li>• View all RFIs for your company</li>
              <li>• Access project reports and dashboards</li>
              <li>• Track response history and status</li>
              <li>• Get notifications for new RFIs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 