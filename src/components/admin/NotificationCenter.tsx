'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Settings, 
  Bell, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  Eye,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';
import { EmailTemplateService, EmailTemplateOptions } from '@/services/emailTemplateService';

interface NotificationRule {
  id: string;
  name: string;
  event: string;
  enabled: boolean;
  recipients: string[];
  template: string;
  description: string;
}

interface EmailSettings {
  senderName: string;
  senderTitle: string;
  companyName: string;
  replyToEmail: string;
  signatureType: 'simple' | 'professional' | 'custom';
  customSignature: string;
  includeCompanyLogo: boolean;
}

export function NotificationCenter() {
  const [activeSection, setActiveSection] = useState('overview');
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    senderName: 'Project Team',
    senderTitle: 'Project Manager',
    companyName: 'Construction Company',
    replyToEmail: '',
    signatureType: 'professional',
    customSignature: '',
    includeCompanyLogo: true
  });

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: '1',
      name: 'Client Link Generated',
      event: 'rfi_link_generated',
      enabled: true,
      recipients: ['client'],
      template: 'client_link',
      description: 'Send secure link to client when RFI link is generated'
    },
    {
      id: '2',
      name: 'RFI Status Update',
      event: 'rfi_status_changed',
      enabled: true,
      recipients: ['client', 'project_team'],
      template: 'status_update',
      description: 'Notify when RFI status changes'
    },
    {
      id: '3',
      name: 'Response Overdue',
      event: 'rfi_overdue',
      enabled: true,
      recipients: ['client', 'project_manager'],
      template: 'reminder',
      description: 'Send reminder when RFI response is overdue'
    },
    {
      id: '4',
      name: 'Response Received',
      event: 'rfi_response_received',
      enabled: true,
      recipients: ['project_team'],
      template: 'response_received',
      description: 'Notify project team when client responds'
    }
  ]);

  const [savedSettings, setSavedSettings] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('email_settings');
    if (saved) {
      setEmailSettings(JSON.parse(saved));
    }
  }, []);

  const handleSaveEmailSettings = () => {
    localStorage.setItem('email_settings', JSON.stringify(emailSettings));
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  const toggleNotificationRule = (id: string) => {
    setNotificationRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const previewTemplate = (templateType: string) => {
    // This would open a preview modal with the template
    alert(`Preview ${templateType} template (feature coming soon)`);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: Bell },
    { id: 'templates', label: 'Email Templates', icon: FileText },
    { id: 'settings', label: 'Email Settings', icon: Settings },
    { id: 'rules', label: 'Notification Rules', icon: AlertTriangle },
    { id: 'recipients', label: 'Recipients', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email & Notification Center</h2>
          <p className="text-gray-600">Manage email templates, notification rules, and communication settings</p>
        </div>
        <div className="flex items-center space-x-2">
          {savedSettings && (
            <div className="flex items-center space-x-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Settings saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Email Templates</p>
                <p className="text-2xl font-semibold text-gray-900">4</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Rules</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {notificationRules.filter(r => r.enabled).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Emails Sent (30d)</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recipients</p>
                <p className="text-2xl font-semibold text-gray-900">Auto</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Templates Section */}
      {activeSection === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Client Link',
                description: 'Template for sending secure RFI links to clients',
                type: 'client_link',
                status: 'active',
                lastUsed: '2 hours ago'
              },
              {
                name: 'Status Update',
                description: 'Template for RFI status change notifications',
                type: 'status_update',
                status: 'active',
                lastUsed: '1 day ago'
              },
              {
                name: 'Overdue Reminder',
                description: 'Template for overdue RFI response reminders',
                type: 'reminder',
                status: 'active',
                lastUsed: '3 days ago'
              },
              {
                name: 'Response Received',
                description: 'Template for client response notifications',
                type: 'response_received',
                status: 'draft',
                lastUsed: 'Never'
              }
            ].map((template, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.status}
                      </span>
                      <span className="text-xs text-gray-500">Last used: {template.lastUsed}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewTemplate(template.type)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Settings Section */}
      {activeSection === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Email Settings</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Sender Name
                </label>
                <input
                  type="text"
                  value={emailSettings.senderName}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, senderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Sender Title
                </label>
                <input
                  type="text"
                  value={emailSettings.senderTitle}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, senderTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={emailSettings.companyName}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply-To Email
                </label>
                <input
                  type="email"
                  value={emailSettings.replyToEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="project@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Signature Style
              </label>
              <div className="space-y-2">
                {[
                  { value: 'simple', label: 'Simple', description: 'Name and company only' },
                  { value: 'professional', label: 'Professional', description: 'Name, title, and company with formatting' },
                  { value: 'custom', label: 'Custom', description: 'Use your own signature template' }
                ].map(option => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="signatureType"
                      value={option.value}
                      checked={emailSettings.signatureType === option.value}
                      onChange={(e) => setEmailSettings(prev => ({ 
                        ...prev, 
                        signatureType: e.target.value as any 
                      }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {emailSettings.signatureType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Signature Template
                </label>
                <textarea
                  value={emailSettings.customSignature}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, customSignature: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter your custom email signature..."
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCompanyLogo"
                checked={emailSettings.includeCompanyLogo}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, includeCompanyLogo: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="includeCompanyLogo" className="text-sm text-gray-700">
                Include company logo in email templates
              </label>
            </div>

            <Button onClick={handleSaveEmailSettings} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Email Settings
            </Button>
          </div>
        </div>
      )}

      {/* Notification Rules Section */}
      {activeSection === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notification Rules</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900">Active Notification Rules</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {notificationRules.map((rule) => (
                <div key={rule.id} className="px-6 py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="text-base font-medium text-gray-900">{rule.name}</h5>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>
                          <span className="font-medium">Recipients:</span> {rule.recipients.join(', ')}
                        </span>
                        <span>
                          <span className="font-medium">Template:</span> {rule.template}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleNotificationRule(rule.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-200 ease-in-out peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                      {/* Edit Button */}
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recipients Section */}
      {activeSection === 'recipients' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Recipient Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Default Recipients</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Project Manager</span>
                  <span className="text-sm text-green-600">Auto-detected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Client Contact</span>
                  <span className="text-sm text-green-600">Auto-detected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Project Team</span>
                  <span className="text-sm text-green-600">Auto-detected</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Email Delivery</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Delivery Status</span>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Last 24h Success Rate</span>
                  <span className="text-sm text-green-600">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Queue Status</span>
                  <span className="text-sm text-gray-600">Empty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 