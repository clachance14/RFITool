'use client';

import React, { useState, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw, AlertTriangle, Shield, Users, FileText, Settings, Home, FolderOpen, BarChart3, FilePlus } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';

// Role preview context to override the actual user role
const RolePreviewContext = createContext<{
  previewRole: string | null;
  setPreviewRole: (role: string | null) => void;
}>({
  previewRole: null,
  setPreviewRole: () => {},
});

export const useRolePreview = () => useContext(RolePreviewContext);

// Mock permission checker for preview mode
const mockHasPermission = (role: string, permission: string): boolean => {
  switch (permission) {
    case 'create_rfi':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
    case 'edit_rfi':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
    case 'create_project':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'edit_project':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'access_admin':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'view_rfis':
      return true; // All authenticated users can view RFIs
    case 'view_projects':
      return true; // All authenticated users can view projects
    case 'view_reports':
      return true; // All authenticated users can view reports
    case 'generate_client_link':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
    case 'print_rfi':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
    case 'submit_rfi':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
    case 'respond_to_rfi':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user', 'client_collaborator'].includes(role);
    case 'close_rfi':
      return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
    case 'delete_rfi':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'export_data':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'create_user':
      return ['app_owner', 'super_admin'].includes(role);
    case 'invite_user':
      return ['app_owner', 'super_admin'].includes(role);
    case 'view_users':
      return ['app_owner', 'super_admin'].includes(role);
    case 'edit_user_roles':
      return ['app_owner'].includes(role);
    case 'delete_user':
      return ['app_owner'].includes(role);
    case 'create_readonly_user':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'delete_project':
      return ['app_owner'].includes(role);
    case 'delete_own_project':
      return ['app_owner', 'super_admin', 'admin'].includes(role);
    case 'edit_company_settings':
      return ['app_owner', 'super_admin'].includes(role);
    default:
      return false;
  }
};

const userRoles = {
  'app_owner': { 
    label: 'App Owner', 
    color: 'bg-red-100 text-red-800', 
    description: 'System administrator with full cross-company access',
    icon: Shield
  },
  'super_admin': { 
    label: 'Super Admin', 
    color: 'bg-purple-100 text-purple-800', 
    description: 'Company administrator with user management capabilities',
    icon: Users
  },
  'admin': { 
    label: 'Admin', 
    color: 'bg-blue-100 text-blue-800', 
    description: 'Manage own RFIs and projects',
    icon: Settings
  },
  'rfi_user': { 
    label: 'RFI User', 
    color: 'bg-yellow-100 text-yellow-800', 
    description: 'Create and edit RFIs',
    icon: FileText
  },
  'view_only': { 
    label: 'View Only', 
    color: 'bg-gray-100 text-gray-800', 
    description: 'Read-only access to RFIs and projects',
    icon: Eye
  },
  'client_collaborator': { 
    label: 'Client', 
    color: 'bg-orange-100 text-orange-800', 
    description: 'View RFIs and project data, respond to RFIs',
    icon: Users
  },
};

// Mock navigation items to show what each role can see
const NavigationPreview = ({ role }: { role: string }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, permission: null },
    { id: 'projects', label: 'Projects', icon: FolderOpen, permission: 'view_projects' },
    { id: 'rfi-log', label: 'RFI Log', icon: FileText, permission: 'view_rfis' },
    { id: 'create-rfi', label: 'Create RFI', icon: FilePlus, permission: 'create_rfi' },
    { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'view_reports' },
    { id: 'admin', label: 'Admin', icon: Settings, permission: 'access_admin' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Navigation Access</h4>
      <div className="space-y-2">
        {navItems.map((item) => {
          const hasAccess = !item.permission || mockHasPermission(role, item.permission);
          const IconComponent = item.icon;
          
          return (
            <div
              key={item.id}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                hasAccess 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200 opacity-60'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
              {!hasAccess && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  No Access
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Mock feature access to show what each role can do
const FeatureAccessPreview = ({ role }: { role: string }) => {
  const features = [
    { id: 'create_rfi', label: 'Create RFI', permission: 'create_rfi' },
    { id: 'edit_rfi', label: 'Edit RFI', permission: 'edit_rfi' },
    { id: 'create_project', label: 'Create Project', permission: 'create_project' },
    { id: 'edit_project', label: 'Edit Project', permission: 'edit_project' },
    { id: 'generate_client_link', label: 'Generate Client Links', permission: 'generate_client_link' },
    { id: 'print_rfi', label: 'Print RFI', permission: 'print_rfi' },
    { id: 'submit_rfi', label: 'Submit RFI', permission: 'submit_rfi' },
    { id: 'close_rfi', label: 'Close RFI', permission: 'close_rfi' },
    { id: 'delete_rfi', label: 'Delete RFI', permission: 'delete_rfi' },
    { id: 'export_data', label: 'Export Data', permission: 'export_data' },
    { id: 'create_user', label: 'Create Users', permission: 'create_user' },
    { id: 'edit_user_roles', label: 'Edit User Roles', permission: 'edit_user_roles' },
    { id: 'delete_user', label: 'Delete Users', permission: 'delete_user' },
  ];

  const allowedFeatures = features.filter(f => mockHasPermission(role, f.permission));
  const deniedFeatures = features.filter(f => !mockHasPermission(role, f.permission));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Feature Access</h4>
      
      {allowedFeatures.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-green-700 mb-2">✅ Allowed Features</h5>
          <div className="grid grid-cols-2 gap-2">
            {allowedFeatures.map((feature) => (
              <div key={feature.id} className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200">
                {feature.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {deniedFeatures.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-red-700 mb-2">❌ Restricted Features</h5>
          <div className="grid grid-cols-2 gap-2">
            {deniedFeatures.map((feature) => (
              <div key={feature.id} className="text-xs bg-red-50 text-red-800 px-2 py-1 rounded border border-red-200">
                {feature.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function RolePreviewSection() {
  const [selectedRole, setSelectedRole] = useState<string>('super_admin');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleStartPreview = () => {
    setIsPreviewMode(true);
    // In a real implementation, this would set a context or state that affects the entire app
    localStorage.setItem('role_preview_mode', selectedRole);
    window.location.reload(); // Reload to apply the preview mode
  };

  const handleStopPreview = () => {
    setIsPreviewMode(false);
    localStorage.removeItem('role_preview_mode');
    window.location.reload(); // Reload to remove preview mode
  };

  const currentPreviewRole = localStorage.getItem('role_preview_mode');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Role Preview</h2>
          <p className="text-gray-600 mt-1">Preview how different user roles experience the application</p>
        </div>
        
        {currentPreviewRole && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Preview Mode: {userRoles[currentPreviewRole as keyof typeof userRoles]?.label}
              </span>
            </div>
            <Button onClick={handleStopPreview} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Exit Preview
            </Button>
          </div>
        )}
      </div>

      {!currentPreviewRole ? (
        <>
          {/* Role Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Role to Preview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(userRoles).map(([key, role]) => {
                const IconComponent = role.icon;
                return (
                  <div
                    key={key}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRole === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRole(key)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${role.color}`}>
                        {role.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleStartPreview} className="bg-blue-600 hover:bg-blue-700">
                <Eye className="w-4 h-4 mr-2" />
                Start Preview as {userRoles[selectedRole as keyof typeof userRoles]?.label}
              </Button>
            </div>
          </div>

          {/* Preview Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NavigationPreview role={selectedRole} />
            <FeatureAccessPreview role={selectedRole} />
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Notes</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Preview mode will reload the application to simulate the selected role</li>
                  <li>• You can exit preview mode at any time using the "Exit Preview" button</li>
                  <li>• Preview mode only affects the UI - no actual permissions are changed</li>
                  <li>• Database operations will still use your actual App Owner permissions</li>
                  <li>• This feature is only available to App Owners for testing purposes</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Currently Previewing: {userRoles[currentPreviewRole as keyof typeof userRoles]?.label}
          </h3>
          <p className="text-blue-700 mb-4">
            The application interface is now showing what a {userRoles[currentPreviewRole as keyof typeof userRoles]?.label} user would see.
          </p>
          <Button onClick={handleStopPreview} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Exit Preview Mode
          </Button>
        </div>
      )}
    </div>
  );
} 