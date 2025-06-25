'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { EmailTemplateService, EmailTemplateOptions } from '@/services/emailTemplateService';
import { X, Copy, Check, Settings, Mail, Eye } from 'lucide-react';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfi: any;
  linkData: any;
  project: any;
}

export function EmailTemplateModal({ isOpen, onClose, rfi, linkData, project }: EmailTemplateModalProps) {
  const [templateOptions, setTemplateOptions] = useState<EmailTemplateOptions>({
    senderName: 'Project Team',
    senderTitle: 'Project Manager',
    companyName: project?.contractor_job_number || 'Construction Company',
    includeUrgencyInSubject: true,
    includeProjectDetails: true,
    signatureType: 'professional',
    customMessage: ''
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'plain' | 'html'>('plain');

  if (!isOpen) return null;

  const template = EmailTemplateService.generateClientLinkTemplate(
    rfi,
    linkData,
    project,
    templateOptions
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      // Silent fail - the user can still see the content wasn't copied
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const copyFullTemplate = async () => {
    const fullTemplate = `Subject: ${template.subject}\n\n${template.plainText}`;
    await copyToClipboard(fullTemplate, 'full');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Template</h3>
              <p className="text-sm text-gray-600">RFI {rfi.rfi_number} - Client Link</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                showOptions 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Options</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Options Panel */}
          {showOptions && (
            <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-4">Template Options</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={templateOptions.senderName || ''}
                    onChange={(e) => setTemplateOptions(prev => ({ ...prev, senderName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender Title
                  </label>
                  <input
                    type="text"
                    value={templateOptions.senderTitle || ''}
                    onChange={(e) => setTemplateOptions(prev => ({ ...prev, senderTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={templateOptions.companyName || ''}
                    onChange={(e) => setTemplateOptions(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={templateOptions.customMessage || ''}
                    onChange={(e) => setTemplateOptions(prev => ({ ...prev, customMessage: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Add a custom message to include in the email..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature Style
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'simple', label: 'Simple' },
                      { value: 'professional', label: 'Professional' },
                      { value: 'custom', label: 'Custom' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="signatureType"
                          value={option.value}
                          checked={templateOptions.signatureType === option.value}
                          onChange={(e) => setTemplateOptions(prev => ({ 
                            ...prev, 
                            signatureType: e.target.value as any 
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {templateOptions.signatureType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Signature
                    </label>
                    <textarea
                      value={templateOptions.customSignature || ''}
                      onChange={(e) => setTemplateOptions(prev => ({ ...prev, customSignature: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter your custom signature..."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={templateOptions.includeUrgencyInSubject}
                      onChange={(e) => setTemplateOptions(prev => ({ 
                        ...prev, 
                        includeUrgencyInSubject: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Include urgency in subject</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={templateOptions.includeProjectDetails}
                      onChange={(e) => setTemplateOptions(prev => ({ 
                        ...prev, 
                        includeProjectDetails: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Include project details</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Template Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewFormat('plain')}
                    className={`px-3 py-1 rounded text-sm ${
                      previewFormat === 'plain'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Plain Text
                  </button>
                  <button
                    onClick={() => setPreviewFormat('html')}
                    className={`px-3 py-1 rounded text-sm ${
                      previewFormat === 'html'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    HTML Preview
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(template.subject, 'subject')}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    {copiedField === 'subject' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>Copy Subject</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(template.plainText, 'body')}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    {copiedField === 'body' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>Copy Body</span>
                  </button>
                  <button
                    onClick={copyFullTemplate}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    {copiedField === 'full' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    <span>Copy Full Template</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {previewFormat === 'plain' ? (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="mb-4 pb-2 border-b">
                    <strong className="text-gray-700">Subject:</strong>
                    <div className="mt-1 font-mono text-sm bg-white p-2 rounded border">
                      {template.subject}
                    </div>
                  </div>
                  <div>
                    <strong className="text-gray-700">Body:</strong>
                    <div className="mt-1 font-mono text-sm bg-white p-4 rounded border whitespace-pre-line leading-relaxed">
                      {template.plainText}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-100 border-b">
                    <strong className="text-gray-700">HTML Preview:</strong>
                  </div>
                  <div 
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: template.body }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>✓ Professional formatting</span>
              <span>✓ Project details included</span>
              <span>✓ Security reminders</span>
              <span>✓ Expiration date: {format(new Date(linkData.expires_at), 'PPP')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 