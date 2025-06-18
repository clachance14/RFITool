"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup' | null;

export default function HeroSection() {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  
  // Debug: Check if signUp function is available
  console.log('signUp function available:', typeof signUp === 'function');
  console.log('signIn function available:', typeof signIn === 'function');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { authMode, email, name, companyName, isResetPassword });
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isResetPassword) {
        console.log('Attempting password reset...');
        if (!email.trim()) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        
        const { error } = await resetPassword(email.trim());
        if (error) {
          console.error('Password reset error:', error);
          setError(error.message);
        } else {
          console.log('Password reset email sent');
          setResetEmailSent(true);
          setMessage('Password reset email sent! Check your inbox.');
        }
      } else if (authMode === 'login') {
        console.log('Attempting login...');
        if (!email.trim() || !password.trim()) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        
        const { error } = await signIn(email.trim(), password);
        if (error) {
          console.error('Login error:', error);
          setError(error.message);
        } else {
          console.log('Login successful');
          setMessage('Login successful! Redirecting...');
          setAuthMode(null);
        }
      } else if (authMode === 'signup') {
        console.log('Attempting signup...');
        // Validate required fields
        if (!email.trim() || !password.trim() || !name.trim() || !companyName.trim()) {
          console.log('Validation failed: missing fields');
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        
        // Validate name length
        if (name.trim().length < 2) {
          console.log('Validation failed: name too short');
          setError('Name must be at least 2 characters long');
          setLoading(false);
          return;
        }
        
        // Validate company name length
        if (companyName.trim().length < 2) {
          console.log('Validation failed: company name too short');
          setError('Company name must be at least 2 characters long');
          setLoading(false);
          return;
        }
        
        // Validate password length
        if (password.length < 6) {
          console.log('Validation failed: password too short');
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          console.log('Validation failed: invalid email format');
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }
        
        console.log('All validations passed, calling signUp...');
        const { error } = await signUp(email.trim(), password, name.trim(), companyName.trim());
        if (error) {
          console.error('Signup error:', error);
          setError(error.message);
        } else {
          console.log('Signup successful');
          setMessage('Account created successfully! Please check your email to verify your account before signing in.');
        }
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);
      setError('An unexpected error occurred');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsResetPassword(false);
    setEmail('');
    setPassword('');
    setName('');
    setCompanyName('');
    setError(null);
    setMessage(null);
    setResetEmailSent(false);
  };

  const closeAuthModal = () => {
    setAuthMode(null);
    setIsResetPassword(false);
    setName('');
    setError(null);
    setMessage(null);
    setResetEmailSent(false);
  };

  const handleResetPasswordClick = () => {
    setIsResetPassword(true);
    setError(null);
    setMessage(null);
    setResetEmailSent(false);
  };

  const handleBackToLogin = () => {
    setIsResetPassword(false);
    setError(null);
    setMessage(null);
    setResetEmailSent(false);
  };

  return (
    <>
      <div className="bg-gray-50 text-gray-900 font-sans">
        <div className="max-w-5xl mx-auto px-4 py-12">

          {/* HERO SECTION */}
          <section className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Stop Losing Time to RFI Chaos</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              No more lost emails, messy PDFs, or confusing spreadsheets. Our lightning-fast RFI tool generates clean PDFs, sends automatic alerts, and tracks status—all in one place.
            </p>
            <button 
              onClick={() => openAuthModal('signup')}
              className="inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Start Your First RFI – It's Free
            </button>
          </section>

          {/* SOCIAL PROOF */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-6 text-center">Trusted by Field-Tested Professionals</h2>
            <div className="bg-gray-200 h-40 flex items-center justify-center rounded-lg text-gray-600 font-semibold mb-4">
              [LOGO GRID PLACEHOLDER]
            </div>
            <p className="text-center mb-4">"Over 2,000 RFIs submitted in the past 30 days."</p>
            <div className="bg-gray-200 h-40 flex items-center justify-center rounded-lg text-gray-600 font-semibold">
              [CASE STUDY GRAPHIC]
            </div>
          </section>

          {/* PROBLEM */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-6">The Old Way is Costing You More</h2>
            <ul className="list-disc list-inside text-lg space-y-2 mb-6">
              <li>RFIs get lost in email</li>
              <li>Field teams wait days for answers</li>
              <li>No status visibility</li>
              <li>Rework and delays pile up</li>
            </ul>
            <div className="bg-gray-200 h-40 flex items-center justify-center rounded-lg text-gray-600 font-semibold">
              [EMAIL CHAOS DIAGRAM]
            </div>
          </section>

          {/* SOLUTION */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-6">Here's How It Works</h2>
            <ol className="list-decimal list-inside text-lg space-y-2 mb-6">
              <li>Fill out a clean, simple form</li>
              <li>Generate a PDF automatically</li>
              <li>Submit & track status from a dashboard</li>
            </ol>
            <div className="bg-gray-200 h-40 flex items-center justify-center rounded-lg text-gray-600 font-semibold">
              [PROCESS FLOW GRAPHIC]
            </div>
          </section>

          {/* FEATURES */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-6">Features That Actually Help</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-2">Instant PDF Generation</h3>
                <p>Never format another document manually.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-2">Email Notifications</h3>
                <p>Automatic alerts when answers are sent.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-2">Mobile-Friendly</h3>
                <p>Submit RFIs directly from the jobsite.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-2">Status Dashboard</h3>
                <p>Always know what's pending or overdue.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-2">Searchable Log</h3>
                <p>Find any RFI in seconds—no spreadsheets needed.</p>
              </div>
            </div>
          </section>

          {/* FOUNDER STORY */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-4">Why I Built This</h2>
            <p className="mb-4">
              I've spent 15 years managing industrial construction projects and got tired of watching simple questions turn into costly problems. This tool was built for field teams like yours—fast, simple, and bulletproof.
            </p>
            <p className="italic mb-4">— Cory, Construction Manager & Creator</p>
            <div className="bg-gray-200 h-40 flex items-center justify-center rounded-lg text-gray-600 font-semibold">
              [FOUNDER INFO GRAPHIC]
            </div>
          </section>

          {/* VALUE STACK */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-4">Everything You Need. One Simple Price.</h2>
            <div className="bg-white border-l-4 border-blue-600 p-6 rounded-lg shadow">
              <ul className="list-none space-y-2 mb-4">
                <li>✅ Unlimited RFIs on 1 active project</li>
                <li>✅ Branded PDF output</li>
                <li>✅ Full email tracking</li>
                <li>✅ Mobile + desktop dashboard</li>
                <li>✅ Priority support</li>
              </ul>
              <p className="font-bold text-lg">All for just $49/month per project</p>
              <p>🎁 Bonus: Free onboarding call + template pack</p>
            </div>
          </section>

          {/* URGENCY */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-2">Only 17 Early Access Slots Left</h2>
            <p className="mb-4">Beta pricing ends June 30. Next price: $79/month.</p>
            <div className="bg-gray-200 h-24 flex items-center justify-center rounded-lg text-gray-600 font-semibold">
              [COUNTDOWN TIMER PLACEHOLDER]
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <strong>Can my foreman use it from the jobsite?</strong>
                <p>Yes! It works great on mobile.</p>
              </div>
              <div>
                <strong>Do I have to install anything?</strong>
                <p>Nope. 100% web-based. Nothing to install.</p>
              </div>
              <div>
                <strong>Can I export the data?</strong>
                <p>Yes, export full logs anytime.</p>
              </div>
              <div>
                <strong>How is this better than email?</strong>
                <p>Faster, trackable, and built to prevent things from falling through the cracks.</p>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Stop Wasting Time on RFIs?</h2>
            <button 
              onClick={() => openAuthModal('signup')}
              className="inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Start Your First RFI – It's Free
            </button>
            <p className="mt-4">
              Questions? Email us at{' '}
              <a href="mailto:support@yourapp.com" className="text-blue-600 underline">
                support@yourapp.com
              </a>
            </p>
            <p className="mt-2">
              Already have an account?{' '}
              <button 
                onClick={() => openAuthModal('login')}
                className="text-blue-600 underline hover:text-blue-700"
              >
                Sign in here
              </button>
            </p>
          </section>

        </div>
      </div>

      {/* AUTH MODAL */}
      {authMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6" role="dialog" aria-modal="true">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isResetPassword ? 'Reset Password' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
              <button 
                onClick={closeAuthModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {resetEmailSent ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-green-700 text-sm">
                    Password reset email sent! Check your inbox and follow the instructions to reset your password.
                  </p>
                </div>
              ) : (
                <>
                  {authMode === 'signup' && !isResetPassword && (
                    <>
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required={authMode === 'signup'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                          minLength={2}
                          maxLength={100}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          id="company"
                          type="text"
                          required={authMode === 'signup'}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your company name"
                          minLength={2}
                          maxLength={100}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>

                  {!isResetPassword && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your password"
                        minLength={6}
                      />
                      {authMode === 'signup' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Password must be at least 6 characters long
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                  {message}
                </div>
              )}

              {!resetEmailSent && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isResetPassword ? 'Sending email...' : authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </span>
                  ) : (
                    isResetPassword ? 'Send Reset Email' : authMode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              )}
            </form>

            <div className="mt-4 text-center space-y-2">
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
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-blue-600 hover:text-blue-700 text-sm block w-full"
                  >
                    {authMode === 'login' 
                      ? "Don't have an account? Sign up" 
                      : 'Already have an account? Sign in'
                    }
                  </button>
                  {authMode === 'login' && (
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
          </div>
        </div>
      )}
    </>
  );
} 