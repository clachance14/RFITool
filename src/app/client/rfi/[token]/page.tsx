"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Download, Building, User, Calendar, FileText } from 'lucide-react';

interface RFIData {
  id: string;
  rfi_number: string;
  subject: string;
  reason_for_rfi: string;
  urgency: 'urgent' | 'non-urgent';
  date_created: string;
  to_recipient: string;
  company: string;
  contractor_proposed_solution?: string;
  work_impact?: string;
  cost_impact?: string;
  schedule_impact?: string;
  status: string;
  projects: {
    project_name: string;
    client_company_name: string;
    contractor_job_number: string;
  };
  attachments: Array<{
    id: string;
    file_name: string;
    file_size_bytes: number;
    file_type: string;
    public_url: string;
  }>;
  client_response?: string;
  response_status?: string;
  date_responded?: string;
}

export default function ClientRFIPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [rfiData, setRfiData] = useState<RFIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [response, setResponse] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected' | 'needs_clarification'>('approved');
  const [additionalComments, setAdditionalComments] = useState('');
  const [cmApproval, setCmApproval] = useState('');

  useEffect(() => {
    fetchRFIData();
  }, [token]);

  const fetchRFIData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/rfi/${token}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to load RFI');
        return;
      }
      
      setRfiData(data.data);
      
      // Check if already responded
      if (data.data.status === 'responded') {
        setSubmitted(true);
        setResponse(data.data.client_response || '');
        setResponseStatus(data.data.response_status || 'approved');
      }
    } catch (err) {
      setError('Failed to load RFI data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim() || !submittedBy.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const submitResponse = await fetch(`/api/client/rfi/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_response: response,
          client_response_submitted_by: submittedBy,
          response_status: responseStatus,
          additional_comments: additionalComments,
          client_cm_approval: cmApproval
        })
      });

      const result = await submitResponse.json();
      
      if (!result.success) {
        alert(result.error || 'Failed to submit response');
        return;
      }

      setSubmitted(true);
      alert('Response submitted successfully!');
    } catch (err) {
      alert('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RFI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              This link may have expired or been revoked. Please contact the sender for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!rfiData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No RFI data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Request for Information</h1>
                <p className="text-blue-100">Client Response Portal</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{rfiData.rfi_number}</div>
                <div className="text-sm text-blue-100">
                  {rfiData.urgency === 'urgent' ? 'URGENT' : 'NON-URGENT'}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{rfiData.projects.project_name}</div>
                  <div className="text-gray-500">{rfiData.projects.client_company_name}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">To: {rfiData.to_recipient}</div>
                  <div className="text-gray-500">Job: {rfiData.projects.contractor_job_number}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {rfiData.date_created && !isNaN(new Date(rfiData.date_created).getTime()) 
                      ? format(new Date(rfiData.date_created), 'PPP')
                      : 'Date not available'
                    }
                  </div>
                  <div className="text-gray-500">Date Created</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RFI Content */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">{rfiData.subject}</h2>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Request Description</h3>
              <div className="text-gray-900 whitespace-pre-wrap">
                {rfiData.reason_for_rfi}
              </div>
            </div>

            {rfiData.contractor_proposed_solution && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Proposed Solution</h3>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {rfiData.contractor_proposed_solution}
                </div>
              </div>
            )}

            {rfiData.attachments && rfiData.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>
                <div className="space-y-2">
                  {rfiData.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{attachment.file_name}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(attachment.file_size_bytes)}
                          </div>
                        </div>
                      </div>
                      <a
                        href={attachment.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Your Response</h2>
          </div>
          
          {submitted ? (
            <div className="px-6 py-8">
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-green-200 bg-green-50 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Response Submitted</div>
                  <div className="text-sm opacity-75">
                    Thank you for your response. The contractor has been notified.
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Response</label>
                  <div className="p-3 bg-gray-50 rounded border text-gray-900 whitespace-pre-wrap">
                    {response}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Submitted on {rfiData.date_responded && !isNaN(new Date(rfiData.date_responded).getTime()) 
                    ? format(new Date(rfiData.date_responded), 'PPP \'at\' p') 
                    : 'Unknown date'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Response Status *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'approved', label: 'Approved', icon: CheckCircle },
                    { value: 'rejected', label: 'Rejected', icon: XCircle },
                    { value: 'needs_clarification', label: 'Needs Clarification', icon: AlertCircle }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        responseStatus === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="responseStatus"
                        value={option.value}
                        checked={responseStatus === option.value}
                        onChange={(e) => setResponseStatus(e.target.value as any)}
                        className="sr-only"
                      />
                      <option.icon className={`w-5 h-5 ${
                        responseStatus === option.value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        responseStatus === option.value ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="response" className="block text-sm font-semibold text-gray-700 mb-2">
                  Response *
                </label>
                <textarea
                  id="response"
                  rows={6}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide your detailed response to this RFI..."
                  required
                />
              </div>

              <div>
                <label htmlFor="submittedBy" className="block text-sm font-semibold text-gray-700 mb-2">
                  Submitted By *
                </label>
                <input
                  type="text"
                  id="submittedBy"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name and title"
                  required
                />
              </div>

              <div>
                <label htmlFor="additionalComments" className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  id="additionalComments"
                  rows={3}
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional comments or notes..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!response.trim() || !submittedBy.trim() || submitting}
                  className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-6 text-sm text-gray-500">
          <p>This is a secure link for responding to the RFI. Do not share this link with others.</p>
        </div>
      </div>
    </div>
  );
} 