import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreateReadOnlyUserProps {
  onUserCreated?: () => void;
}

export function CreateReadOnlyUser({ onUserCreated }: CreateReadOnlyUserProps) {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: 'readonly123'
  });
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/create-readonly-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      setCreatedUser(result.user);
      setFormData({ email: '', fullName: '', password: 'readonly123' });
      
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCreatedUser(null);
    setError(null);
    setFormData({ email: '', fullName: '', password: 'readonly123' });
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gray-600 hover:bg-gray-700"
      >
        <Eye className="h-4 w-4 mr-2" />
        Create Read-Only User
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {!createdUser ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Create Read-Only User</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This user will be able to view RFIs and projects but cannot create or edit anything.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temporary Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The user can change this password after logging in.
                    </p>
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                      {error}
                    </div>
                  )}
                </form>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-green-600">User Created Successfully! 🎉</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Share these credentials with the user for read-only access.
                  </p>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={createdUser.email}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdUser.email, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={createdUser.tempPassword}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdUser.tempPassword, 'password')}
                      >
                        {copiedField === 'password' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">This user can:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>✅ View all RFIs and projects</li>
                      <li>✅ Navigate through the application</li>
                      <li>❌ Create or edit RFIs</li>
                      <li>❌ Create or edit projects</li>
                      <li>❌ Access admin features</li>
                    </ul>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 