"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Eye, Settings, Users, Mail, Cog, FileText, Shield, Plus, Edit, Trash2 } from 'lucide-react';

// Mock user data - in real app this would come from a database
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner', status: 'active', lastLogin: '2024-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active', lastLogin: '2024-01-14' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'rfi_user', status: 'active', lastLogin: '2024-01-13' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'view_only', status: 'inactive', lastLogin: '2024-01-10' },
];

const userRoles = {
  'owner': { label: 'Owner', color: 'bg-purple-100 text-purple-800', description: 'Full system access including user management' },
  'admin': { label: 'Admin', color: 'bg-blue-100 text-blue-800', description: 'Manage RFIs, projects, and most settings' },
  'project_manager': { label: 'Project Manager', color: 'bg-green-100 text-green-800', description: 'Manage projects and respond to RFIs' },
  'rfi_user': { label: 'RFI User', color: 'bg-yellow-100 text-yellow-800', description: 'Create and edit RFIs' },
  'view_only': { label: 'View Only', color: 'bg-gray-100 text-gray-800', description: 'Read-only access to RFIs and projects' },
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('branding');
  
  // Current saved values
  const [savedContractorLogo, setSavedContractorLogo] = useState<string | null>(
    localStorage.getItem('contractor_logo') || null
  );
  const [savedClientLogo, setSavedClientLogo] = useState<string | null>(
    localStorage.getItem('client_logo') || null
  );
  const [savedCompanyName, setSavedCompanyName] = useState<string>(
    localStorage.getItem('company_name') || ''
  );
  const [savedClientName, setSavedClientName] = useState<string>(
    localStorage.getItem('client_name') || ''
  );

  // Working values (unsaved changes)
  const [contractorLogo, setContractorLogo] = useState<string | null>(savedContractorLogo);
  const [clientLogo, setClientLogo] = useState<string | null>(savedClientLogo);
  const [companyName, setCompanyName] = useState<string>(savedCompanyName);
  const [clientName, setClientName] = useState<string>(savedClientName);

  // User management state
  const [users, setUsers] = useState(mockUsers);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'rfi_user'
  });

  // System settings state
  const [rfiNumberFormat, setRfiNumberFormat] = useState(localStorage.getItem('rfi_number_format') || 'RFI-{YYYY}-{####}');
  const [defaultDueDays, setDefaultDueDays] = useState(parseInt(localStorage.getItem('default_due_days') || '7'));
  const [emailNotifications, setEmailNotifications] = useState(localStorage.getItem('email_notifications') === 'true');
  const [autoAssignPM, setAutoAssignPM] = useState(localStorage.getItem('auto_assign_pm') === 'true');

  const contractorFileRef = useRef<HTMLInputElement>(null);
  const clientFileRef = useRef<HTMLInputElement>(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = 
    contractorLogo !== savedContractorLogo || 
    clientLogo !== savedClientLogo || 
    companyName !== savedCompanyName || 
    clientName !== savedClientName;

  const handleLogoUpload = async (file: File, type: 'contractor' | 'client') => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 and update working state only (don't save yet)
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      if (type === 'contractor') {
        setContractorLogo(base64);
      } else {
        setClientLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (type: 'contractor' | 'client') => {
    if (type === 'contractor') {
      setContractorLogo(null);
    } else {
      setClientLogo(null);
    }
  };

  const handleSaveAll = () => {
    // Save all changes to localStorage
    if (contractorLogo) {
      localStorage.setItem('contractor_logo', contractorLogo);
    } else {
      localStorage.removeItem('contractor_logo');
    }
    
    if (clientLogo) {
      localStorage.setItem('client_logo', clientLogo);
    } else {
      localStorage.removeItem('client_logo');
    }
    
    localStorage.setItem('company_name', companyName);
    localStorage.setItem('client_name', clientName);

    // Update saved state to match current state
    setSavedContractorLogo(contractorLogo);
    setSavedClientLogo(clientLogo);
    setSavedCompanyName(companyName);
    setSavedClientName(clientName);
    
    alert('All changes saved successfully!');
  };

  const handleDiscardChanges = () => {
    if (hasUnsavedChanges && confirm('Are you sure you want to discard your unsaved changes?')) {
      setContractorLogo(savedContractorLogo);
      setClientLogo(savedClientLogo);
      setCompanyName(savedCompanyName);
      setClientName(savedClientName);
    }
  };

  const handleSaveSystemSettings = () => {
    localStorage.setItem('rfi_number_format', rfiNumberFormat);
    localStorage.setItem('default_due_days', defaultDueDays.toString());
    localStorage.setItem('email_notifications', emailNotifications.toString());
    localStorage.setItem('auto_assign_pm', autoAssignPM.toString());
    alert('System settings saved successfully!');
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleChangeUserRole = (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      alert('A user with this email already exists');
      return;
    }

    // Add new user
    const user = {
      id: Date.now().toString(), // Simple ID generation
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      status: 'active' as const,
      lastLogin: 'Never'
    };

    setUsers([...users, user]);
    
    // Reset form and close modal
    setNewUser({ name: '', email: '', role: 'rfi_user' });
    setShowAddUser(false);
    
    alert(`User ${user.name} added successfully!`);
  };

  const handleCancelAddUser = () => {
    setNewUser({ name: '', email: '', role: 'rfi_user' });
    setShowAddUser(false);
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Eye },
    { id: 'users', label: 'Users & Permissions', icon: Users },
    { id: 'projects', label: 'Project Settings', icon: FileText },
    { id: 'system', label: 'System Settings', icon: Cog },
    { id: 'notifications', label: 'Notifications', icon: Mail },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-8">
              {/* Company Information */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
                  {(companyName !== savedCompanyName || clientName !== savedClientName) && (
                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                      Modified
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contractor Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter contractor company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Company Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter client company name"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={handleSaveAll} 
                      disabled={!hasUnsavedChanges}
                      className={`${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      Save All Changes
                    </Button>
                    {hasUnsavedChanges && (
                      <Button 
                        onClick={handleDiscardChanges} 
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Discard Changes
                      </Button>
                    )}
                    {hasUnsavedChanges && (
                      <span className="text-sm text-orange-600 font-medium">
                        ⚠ You have unsaved changes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Logos */}
              {(contractorLogo || clientLogo) && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Logos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contractorLogo && (
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Contractor Logo</h3>
                        <img
                          src={contractorLogo}
                          alt="Contractor Logo"
                          className="h-20 mx-auto object-contain border border-gray-200 rounded bg-gray-50 p-2"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveLogo('contractor')}
                          className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                    {clientLogo && (
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Client Logo</h3>
                        <img
                          src={clientLogo}
                          alt="Client Logo"
                          className="h-20 mx-auto object-contain border border-gray-200 rounded bg-gray-50 p-2"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveLogo('client')}
                          className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Logo Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {!contractorLogo && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Contractor Logo</h2>
                      {contractorLogo !== savedContractorLogo && (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          Modified
                        </span>
                      )}
                    </div>
                    
                    <div
                      onClick={() => contractorFileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Upload Contractor Logo</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    
                    <input
                      ref={contractorFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'contractor');
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {!clientLogo && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Client Logo</h2>
                      {clientLogo !== savedClientLogo && (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          Modified
                        </span>
                      )}
                    </div>
                    
                    <div
                      onClick={() => clientFileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Upload Client Logo</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    
                    <input
                      ref={clientFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'client');
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Logo Preview */}
              {(contractorLogo || clientLogo) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Logo Preview</h2>
                    {hasUnsavedChanges && (
                      <span className="text-sm text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                        Preview (Unsaved)
                      </span>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      {contractorLogo && (
                        <img
                          src={contractorLogo}
                          alt="Contractor Logo Preview"
                          className="h-12 object-contain"
                        />
                      )}
                      <div className="flex-1 text-center">
                        <h3 className="text-lg font-bold text-gray-900">Request for Information</h3>
                        <p className="text-sm text-gray-600">Sample Project Name</p>
                      </div>
                      {clientLogo && (
                        <img
                          src={clientLogo}
                          alt="Client Logo Preview"
                          className="h-12 object-contain"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      This is how your logos will appear on RFI documents
                      {hasUnsavedChanges && " (after saving)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users & Permissions Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <Button onClick={() => setShowAddUser(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {/* User Roles Legend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">User Roles & Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(userRoles).map(([key, role]) => (
                    <div key={key} className="flex items-start space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${role.color}`}>
                        {role.label}
                      </span>
                      <p className="text-xs text-gray-600">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            {Object.entries(userRoles).map(([key, role]) => (
                              <option key={key} value={key}>{role.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.lastLogin}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(user.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFI Number Format
                  </label>
                  <input
                    type="text"
                    value={rfiNumberFormat}
                    onChange={(e) => setRfiNumberFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RFI-{YYYY}-{####}"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use &#123;YYYY&#125; for year, &#123;####&#125; for sequential number</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default RFI Due Days
                  </label>
                  <input
                    type="number"
                    value={defaultDueDays}
                    onChange={(e) => setDefaultDueDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default days until RFI response is due</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Send email notifications for RFI updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-assign Project Manager</h3>
                    <p className="text-sm text-gray-600">Automatically assign RFIs to project managers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAssignPM}
                      onChange={(e) => setAutoAssignPM(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <Button onClick={handleSaveSystemSettings} className="bg-blue-600 hover:bg-blue-700">
                Save System Settings
              </Button>
            </div>
          )}

          {/* Project Settings Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Configuration</h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Settings</h3>
                <p className="text-gray-600">Configure default project settings, templates, and workflows.</p>
                <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email & Notification Center</h3>
                <p className="text-gray-600">Configure email templates, notification preferences, and alert settings.</p>
                <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
              </div>
            </div>
          )}

          {/* Add User Modal */}
          {showAddUser && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={(e) => e.target === e.currentTarget && handleCancelAddUser()}
            >
              <div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUser();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelAddUser();
                  }
                }}
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(userRoles).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {userRoles[newUser.role as keyof typeof userRoles]?.description}
                    </p>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelAddUser}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddUser}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add User
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 