"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Lock, Mail, Building, Shield, Eye, EyeOff, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role_name: string;
  role_id: number;
  created_at: string;
}

interface LoadProfileError {
  step: string;
  message: string;
  details?: any;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<LoadProfileError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    setDetailedError(null);

    try {
      // Step 1: Check authentication
      console.log('Step 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        throw { step: 'Authentication', message: 'Authentication failed', details: authError };
      }

      if (!user) {
        console.log('No authenticated user found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('✓ User authenticated:', user.id);

      // Step 2: Get company_users data
      console.log('Step 2: Fetching company_users data...');
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('user_id, role_id, company_id')
        .eq('user_id', user.id)
        .single();

      if (companyUserError) {
        console.error('Company users error:', companyUserError);
        throw { 
          step: 'Company Users', 
          message: 'Failed to find your company association', 
          details: companyUserError 
        };
      }

      console.log('✓ Company users data:', companyUserData);

      // Step 3: Get user details
      console.log('Step 3: Fetching user details...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, created_at')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('User data error:', userError);
        throw { 
          step: 'User Data', 
          message: 'Failed to load your user information', 
          details: userError 
        };
      }

      console.log('✓ User data:', userData);

      // Step 4: Get company details
      console.log('Step 4: Fetching company details...');
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyUserData.company_id)
        .single();

      if (companyError) {
        console.error('Company data error:', companyError);
        throw { 
          step: 'Company Data', 
          message: 'Failed to load your company information', 
          details: companyError 
        };
      }

      console.log('✓ Company data:', companyData);

      // Step 5: Build profile object
      console.log('Step 5: Building profile object...');
      const roleNames = {
        0: 'Super Admin',
        1: 'Admin', 
        2: 'Project Manager',
        3: 'RFI User',
        4: 'View Only',
        5: 'Client'
      };

      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || '',
        company_name: companyData.name,
        role_name: roleNames[companyUserData.role_id as keyof typeof roleNames] || `Role ${companyUserData.role_id}`,
        role_id: companyUserData.role_id,
        created_at: userData.created_at
      };

      console.log('✓ Profile loaded successfully:', userProfile);
      setProfile(userProfile);
      setFullName(userProfile.full_name);

    } catch (err: any) {
      console.error('Error loading profile:', err);
      
      if (err.step) {
        setDetailedError(err);
        setError(`Failed at step: ${err.step}. ${err.message}`);
      } else {
        setError('Failed to load profile information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update full name in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Profile updated successfully!');
      // Reload profile to show updated data
      await loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800 mb-2">Failed to Load Profile</h3>
              <p className="text-red-700 mb-3">
                {error || 'Unable to load your profile information.'}
              </p>
              
              {detailedError && (
                <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                  <p className="text-sm font-medium text-red-800">Debug Information:</p>
                  <p className="text-sm text-red-700 mt-1">
                    <strong>Failed Step:</strong> {detailedError.step}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {detailedError.message}
                  </p>
                  {detailedError.details && (
                    <p className="text-sm text-red-700">
                      <strong>Details:</strong> {JSON.stringify(detailedError.details, null, 2)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <Button 
                  onClick={loadProfile}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="sm"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
          <X className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{profile.email}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <Building className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{profile.company_name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <Shield className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{profile.role_name}</span>
              </div>
            </div>

            <Button
              onClick={updateProfile}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </div>

        {/* Password Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Lock className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Password Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Password Requirements:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Use a strong, unique password</li>
              </ul>
            </div>

            <Button
              onClick={updatePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Account Created:</span>
            <span className="ml-2 text-gray-600">
              {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 