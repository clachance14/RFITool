"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Eye, Settings, Users, Mail, Cog, FileText, Plus, Edit, Trash2, Download } from 'lucide-react';
import { AdminProjectSection } from '@/components/project/AdminProjectSection';
import { ExportSection } from '@/components/admin/ExportSection';

import { NotificationCenter } from '@/components/admin/NotificationCenter';

import { ClientAssignmentsTable } from '@/components/admin/ClientAssignmentsTable';
import { PermissionGate } from '@/components/PermissionGate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// User role mapping from role_id to role string
const ROLE_MAPPING = {
  0: 'app_owner',     // App owner - sees all companies (system admin)
  1: 'super_admin',   // Company super admin - first user, can manage company
  2: 'admin',         // Admin - manages own projects only
  3: 'rfi_user',      // Regular RFI user
  4: 'view_only',     // View only user
  5: 'client_collaborator' // Client user
} as const;

const userRoles = {
  'app_owner': { label: 'App Owner', color: 'bg-red-100 text-red-800', description: 'System administrator with full cross-company access' },
  'super_admin': { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', description: 'Company administrator with user management capabilities' },
  'admin': { label: 'Admin', color: 'bg-blue-100 text-blue-800', description: 'Manage own RFIs and projects' },
  'rfi_user': { label: 'RFI User', color: 'bg-yellow-100 text-yellow-800', description: 'Create and edit RFIs' },
  'view_only': { label: 'View Only', color: 'bg-gray-100 text-gray-800', description: 'Read-only access to RFIs and projects' },
  'client_collaborator': { label: 'Client', color: 'bg-orange-100 text-orange-800', description: 'View RFIs and project data, respond to RFIs' },
};

export default function AdminPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('branding');

  // Check URL params for tab selection and load localStorage values
  useEffect(() => {
    const loadCompanyData = async () => {
      // Only run on client side
      if (typeof window !== 'undefined' && session?.user?.id) {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab && ['branding', 'users', 'export', 'projects', 'system', 'notifications'].includes(tab)) {
          setActiveTab(tab);
        }

        // Load contractor logo from database first, fallback to localStorage
        let contractorLogo = null;
        try {
          const { data: userCompany } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', session.user.id)
            .single();
            
          if (userCompany) {
            const { data: company } = await supabase
              .from('companies')
              .select('logo_url')
              .eq('id', userCompany.company_id)
              .single();
              
            contractorLogo = company?.logo_url || localStorage.getItem('contractor_logo') || null;
          }
        } catch (error) {
          // Fallback to localStorage if database query fails
          contractorLogo = localStorage.getItem('contractor_logo') || null;
        }

        // Load other saved values from localStorage
        const clientLogo = localStorage.getItem('client_logo') || null;
        const companyName = localStorage.getItem('company_name') || '';
        const clientName = localStorage.getItem('client_name') || '';
        
        setSavedContractorLogo(contractorLogo);
        setSavedClientLogo(clientLogo);
        setSavedCompanyName(companyName);
        setSavedClientName(clientName);
        
        setContractorLogo(contractorLogo);
        setClientLogo(clientLogo);
        setCompanyName(companyName);
        setClientName(clientName);

        // Load system settings
        const rfiFormat = localStorage.getItem('rfi_number_format') || 'RFI-{YYYY}-{####}';
        const dueDays = parseInt(localStorage.getItem('default_due_days') || '7');
        const emailNotifs = localStorage.getItem('email_notifications') === 'true';
        const autoAssign = localStorage.getItem('auto_assign_pm') === 'true';
        
        setRfiNumberFormat(rfiFormat);
        setDefaultDueDays(dueDays);
        setEmailNotifications(emailNotifs);
        setAutoAssignPM(autoAssign);
      }
    };

    loadCompanyData();
  }, [session?.user?.id]);
  
  // Current saved values
  const [savedContractorLogo, setSavedContractorLogo] = useState<string | null>(null);
  const [savedClientLogo, setSavedClientLogo] = useState<string | null>(null);
  const [savedCompanyName, setSavedCompanyName] = useState<string>('');
  const [savedClientName, setSavedClientName] = useState<string>('');

  // Working values (unsaved changes)
  const [contractorLogo, setContractorLogo] = useState<string | null>(savedContractorLogo);
  const [clientLogo, setClientLogo] = useState<string | null>(savedClientLogo);
  const [companyName, setCompanyName] = useState<string>(savedCompanyName);
  const [clientName, setClientName] = useState<string>(savedClientName);

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'rfi_user',
    companyId: ''
  });

  // Fetch companies for company selection
  const fetchCompanies = useCallback(async () => {
    try {
      setCompaniesLoading(true);
      
      // Get all companies (App Owners can see all, others see only their own)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companyError) {
        console.error('Error fetching companies:', companyError);
        return;
      }

      setCompanies(companyData || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.id) return;

      try {
        setUsersLoading(true);
        
        // Get current user's company
        const { data: currentUserCompany, error: companyError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', session.user.id)
          .single();

        if (companyError || !currentUserCompany) {
          console.error('Error fetching user company:', companyError);
          return;
        }

        // Set current user's company ID for the form default
        setCurrentUserCompanyId(currentUserCompany.company_id);

        // Also fetch companies when we fetch users
        fetchCompanies();

        // First get company users with their role information
        const { data: companyUsers, error: companyUsersError } = await supabase
          .from('company_users')
          .select('user_id, role_id')
          .eq('company_id', currentUserCompany.company_id);

        if (companyUsersError) {
          console.error('Error fetching company users:', companyUsersError);
          return;
        }

        if (!companyUsers?.length) {
          setUsers([]);
          return;
        }

        // Get detailed user information from auth.users
        const userIds = companyUsers.map(cu => cu.user_id);
        
        // Query auth.users directly for comprehensive user data
        const { data: authUsers, error: authUsersError } = await supabase
          .from('auth.users')
          .select('id, email, raw_user_meta_data, created_at, updated_at, last_sign_in_at')
          .in('id', userIds);

        if (authUsersError) {
          // Fallback to regular users table if auth.users is not accessible
          const { data: regularUsers, error: regularUsersError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', userIds);

           if (regularUsersError) {
             console.error('Error fetching regular users:', regularUsersError);
             return;
           }

           // Transform regular users data
           const transformedUsers = companyUsers?.map((cu: any) => {
             const user = regularUsers?.find(u => u.id === cu.user_id);
             
             return {
               id: cu.user_id,
               name: user?.full_name || user?.email || 'Unknown User',
               email: user?.email || 'No email',
               avatar_url: null,
               role: ROLE_MAPPING[cu.role_id as keyof typeof ROLE_MAPPING] || 'rfi_user',
               status: 'active',
               lastLogin: 'Never',
               createdAt: 'Unknown',
               updatedAt: 'Unknown'
             };
           }) || [];

          setUsers(transformedUsers);
          return;
        }

        // Transform the data to include comprehensive user information
        const transformedUsers = companyUsers?.map((cu: any) => {
          const authUser = authUsers?.find(u => u.id === cu.user_id);
          const fullName = authUser?.raw_user_meta_data?.full_name || 
                          authUser?.raw_user_meta_data?.name ||
                          authUser?.email?.split('@')[0] || 
                          'Unknown User';
          
          return {
            id: cu.user_id,
            name: fullName,
            email: authUser?.email || 'No email',
            avatar_url: authUser?.raw_user_meta_data?.avatar_url || null,
                             role: ROLE_MAPPING[cu.role_id as keyof typeof ROLE_MAPPING] || 'rfi_user',
                 status: 'active',
                 lastLogin: authUser?.last_sign_in_at ? 
                   new Date(authUser.last_sign_in_at).toLocaleDateString() : 'Never',
                 createdAt: authUser?.created_at ? 
                   new Date(authUser.created_at).toLocaleDateString() : 'Unknown',
                 updatedAt: authUser?.updated_at ? 
                   new Date(authUser.updated_at).toLocaleDateString() : 'Unknown'
          };
        }) || [];

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [session?.user?.id, fetchCompanies]);

  // System settings state
  const [rfiNumberFormat, setRfiNumberFormat] = useState('RFI-{YYYY}-{####}');
  const [defaultDueDays, setDefaultDueDays] = useState(7);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [autoAssignPM, setAutoAssignPM] = useState(false);

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

    try {
      // For contractor logos, upload to Supabase Storage and save to database
      if (type === 'contractor') {
        // Upload to Supabase Storage
        const { uploadLogo } = await import('@/lib/storage');
        const { url, error } = await uploadLogo(file, 'COMPANY_LOGOS');
        
        if (error) {
          alert('Failed to upload contractor logo: ' + error);
          return;
        }
        
        if (url) {
          // Save to database via API endpoint (bypasses RLS)
          try {
            const response = await fetch('/api/admin/update-company-logo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ logoUrl: url }),
            });

            const result = await response.json();

            if (!response.ok) {
              alert('Failed to save contractor logo: ' + result.error);
              return;
            }

            setContractorLogo(url);
            alert('Contractor logo uploaded and saved successfully!');
          } catch (error) {
            alert('Failed to save contractor logo: ' + error);
            return;
          }
        }
      } else {
        // For client logos, keep the existing base64 behavior
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setClientLogo(base64);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      alert('Failed to upload logo: ' + error);
    }
  };

  const handleRemoveLogo = (type: 'contractor' | 'client') => {
    if (type === 'contractor') {
      setContractorLogo(null);
    } else {
      setClientLogo(null);
    }
  };

  const handleSaveAll = () => {
    // For contractor logo, if it's already saved to database (URL format), don't save to localStorage
    // Only save to localStorage if it's base64 (old format)
    if (contractorLogo) {
      if (contractorLogo.startsWith('http')) {
        // It's a URL from database, don't save to localStorage
        localStorage.removeItem('contractor_logo');
      } else {
        // It's base64, save to localStorage for backward compatibility
        localStorage.setItem('contractor_logo', contractorLogo);
      }
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from your company?')) {
      return;
    }

    try {
      // Remove user from company_users table (this doesn't delete the user, just removes them from the company)
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user from company:', error);
        alert('Failed to remove user from company');
        return;
      }

      // Update local state
      setUsers(users.filter((u: any) => u.id !== userId));
    } catch (error) {
      console.error('Error removing user from company:', error);
      alert('Failed to remove user from company');
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      // Find the role_id for the new role
      const roleId = Object.entries(ROLE_MAPPING).find(([id, role]) => role === newRole)?.[0];
      
      if (!roleId) {
        alert('Invalid role selected');
        return;
      }

      // Update the role in the database
      const { error } = await supabase
        .from('company_users')
        .update({ role_id: parseInt(roleId) })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role');
        return;
      }

      // Update local state
      setUsers(users.map((u: any) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleAddUser = async () => {
    console.log('=== ADD USER DEBUG ===');
    console.log('User data:', newUser);
    console.log('Session:', session?.user?.email);
    
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.companyId.trim()) {
      alert('Please fill in all required fields including company selection');
      return;
    }

    // Check if email already exists in the selected company
    const usersInSelectedCompany = await getUsersInCompany(newUser.companyId);
    if (usersInSelectedCompany?.some((u: any) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      alert('A user with this email already exists in the selected company');
      return;
    }

    try {
      // Find the role_id for the selected role first
      const roleId = Object.entries(ROLE_MAPPING).find(([id, role]) => role === newUser.role)?.[0];
      
      console.log('Role mapping:', { role: newUser.role, roleId, ROLE_MAPPING });
      
      if (!roleId) {
        alert('Invalid role selected');
        return;
      }

      // Check if user already exists in users table
      let userId;
      let isNewUser = false;
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, status')
        .eq('email', newUser.email.trim().toLowerCase())
        .single();

      if (existingUser) {
        // User exists, just add them to the selected company
        console.log('Existing user found:', existingUser);
        userId = existingUser.id;
      } else {
        console.log('No existing user found, sending invitation...');
        // Send invitation via API route
        const invitePayload = {
          email: newUser.email.trim().toLowerCase(),
          fullName: newUser.name.trim(),
          companyId: newUser.companyId, // Use selected company
          roleId: parseInt(roleId),
          invitedBy: session?.user?.email || 'system'
        };
        
        console.log('Sending invitation with payload:', invitePayload);
        
        const response = await fetch('/api/admin/invite-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(invitePayload),
        });

        const result = await response.json();

        console.log('Invitation API response:', { status: response.status, result });

        if (!response.ok) {
          console.error('Error sending invitation:', result.error);
          alert('Failed to send invitation: ' + result.error);
          return;
        }

        if (!result.success || !result.user) {
          alert('Failed to create invitation - no user data returned');
          return;
        }

        userId = result.user.id;
        isNewUser = true;
      }

      // Add to local state
      const user = {
        id: userId,
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        avatar_url: null,
        role: newUser.role,
        status: isNewUser ? 'invited' as const : 'active' as const,
        lastLogin: isNewUser ? 'Invited' : 'Never',
        createdAt: 'Today',
        updatedAt: 'Today'
      };

      setUsers([...users, user]);
      
      // Reset form and close modal
      setNewUser({ name: '', email: '', role: 'rfi_user', companyId: '' });
      setShowAddUser(false);
      
      const selectedCompany = companies.find(c => c.id === newUser.companyId);
      if (isNewUser) {
        alert(`Invitation sent to ${user.name} (${user.email}) for ${selectedCompany?.name || 'selected company'}!\n\nThey will receive an email with instructions to set up their account and can then log in with full access.`);
      } else {
        alert(`User ${user.name} added to ${selectedCompany?.name || 'selected company'} successfully!`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  // Helper function to get users in a specific company
  const getUsersInCompany = async (companyId: string) => {
    try {
      const { data: companyUsers, error } = await supabase
        .from('company_users')
        .select(`
          user_id,
          users!inner(email, full_name)
        `)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching company users:', error);
        return [];
      }

      return companyUsers?.map(cu => ({
        id: cu.user_id,
        email: (cu.users as any).email,
        full_name: (cu.users as any).full_name
      })) || [];
    } catch (error) {
      console.error('Error in getUsersInCompany:', error);
      return [];
    }
  };

  const handleCancelAddUser = () => {
    setNewUser({ name: '', email: '', role: 'rfi_user', companyId: '' });
    setShowAddUser(false);
  };

  // Function to open add user modal with default company
  const handleOpenAddUser = () => {
    setNewUser({ 
      name: '', 
      email: '', 
      role: 'rfi_user', 
      companyId: '' // Don't auto-default to current user's company
    });
    setShowAddUser(true);
  };









  // Function to create a new company
  const handleCreateCompany = async (companyName: string) => {
    try {
      const response = await fetch('/api/admin/create-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: companyName.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error creating company:', result.error);
        alert('Failed to create company: ' + result.error);
        return;
      }

      if (!result.success || !result.company) {
        alert('Failed to create company - no company data returned');
        return;
      }

      // Add to local companies list
      setCompanies(prev => [...prev, result.company]);
      
      // Auto-select the newly created company
      setNewUser(prev => ({ ...prev, companyId: result.company.id }));
      
      alert(`Company "${companyName}" created successfully!`);
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company: ' + error);
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Eye },
    { id: 'users', label: 'Users & Permissions', icon: Users },
    { id: 'export', label: 'Export RFIs', icon: Download },
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
                <div className="flex space-x-2">
                  <PermissionGate permission="create_user">
                    <Button onClick={handleOpenAddUser} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="create_user">
                    <Button 
                      onClick={() => {
                        setNewUser({ ...newUser, role: 'client_collaborator' });
                        handleOpenAddUser();
                      }} 
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </PermissionGate>
                </div>
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
                {usersLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading users...</span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No users found in your company.</div>
                  </div>
                ) : (
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Since</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <PermissionGate 
                            permission="edit_user_roles"
                            fallback={
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${userRoles[user.role as keyof typeof userRoles]?.color}`}>
                                {userRoles[user.role as keyof typeof userRoles]?.label}
                              </span>
                            }
                          >
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              {Object.entries(userRoles).map(([key, role]) => (
                                <option key={key} value={key}>{role.label}</option>
                              ))}
                            </select>
                          </PermissionGate>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{user.lastLogin}</div>
                          {user.updatedAt && user.updatedAt !== 'Unknown' && (
                            <div className="text-xs text-gray-500">Updated: {user.updatedAt}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(user.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <PermissionGate permission="delete_user">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Client Project Assignments Section */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <ClientAssignmentsTable />
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
            <AdminProjectSection />
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <ExportSection />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationCenter />
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
                  <p className="text-sm text-gray-600 mt-1">
                    Invite a new user to their respective company. For client users, select their client company (not your contractor company).
                  </p>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  {/* Helper info showing current user's company */}
                  {currentUserCompanyId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Your company:</strong> {companies.find(c => c.id === currentUserCompanyId)?.name || 'Loading...'}
                        <br />
                        <span className="text-blue-600">
                          For client users like Joe Smith, select their client company (different from yours).
                        </span>
                      </p>
                    </div>
                  )}

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
                      Company *
                    </label>
                    <div className="flex space-x-2">
                      {companiesLoading ? (
                        <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                          Loading companies...
                        </div>
                      ) : (
                        <select
                          value={newUser.companyId}
                          onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select the user's company</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <Button
                        type="button"
                        onClick={() => {
                          const companyName = prompt('Enter the name of the new company:');
                          if (companyName?.trim()) {
                            handleCreateCompany(companyName.trim());
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                      >
                        + Add Company
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the company this user belongs to. For client users, choose their client company (not your contractor company). Users will only see RFIs related to their company.
                    </p>
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