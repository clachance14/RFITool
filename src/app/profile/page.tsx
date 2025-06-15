"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Lock, Mail, Building, Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role_name: string;
  role_id: number;
  last_sign_in: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('Loading profile for user:', user.id);

      // Get user profile with company and role information using separate queries for better reliability
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('user_id, role_id, company_id')
        .eq('user_id', user.id)
        .single();

      if (companyUserError) {
        console.error('Error fetching company_users:', companyUserError);
        throw new Error(`Company user data not found: ${companyUserError.message}`);
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, created_at, last_sign_in_at')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error(`User data not found: ${userError.message}`);
      }

      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyUserData.company_id)
        .single();

      if (companyError) {
        console.error('Error fetching company data:', companyError);
        throw new Error(`Company data not found: ${companyError.message}`);
      }

      console.log('Profile data loaded:', { companyUserData, userData, companyData });

      // Get role name
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
        role_name: roleNames[companyUserData.role_id as keyof typeof roleNames] || 'Unknown',
        role_id: companyUserData.role_id,
        last_sign_in: userData.last_sign_in_at || 'Never',
        created_at: userData.created_at
      };

      setProfile(userProfile);
      setFullName(userProfile.full_name);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile information');
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p>Failed to load profile information. Please try refreshing the page.</p>
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
          <div>
            <span className="font-medium text-gray-700">Last Sign In:</span>
            <span className="ml-2 text-gray-600">
              {profile.last_sign_in === 'Never' ? 'Never' : new Date(profile.last_sign_in).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 