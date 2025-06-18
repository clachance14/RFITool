"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, X, LogIn, FileText, Clock, ExternalLink } from 'lucide-react';
import { ClientLoginBanner } from '@/components/client/ClientLoginBanner';
import { ClientAuthModal } from '@/components/client/ClientAuthModal';
import { useAuth } from '@/contexts/AuthContext';

interface SuccessPageData {
  rfi: {
    id: string;
    rfi_number: string;
    subject: string;
    projects: {
      project_name: string;
      client_company_name: string;
    };
  };
  response: {
    submitted_at: string;
    submitted_by: string;
    response_length: number;
    attachment_count: number;
  };
}

export default function ClientRFISuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user } = useAuth();
  
  const [successData, setSuccessData] = useState<SuccessPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Check if user is already authenticated
  const isAuthenticated = !!user;
  const showBanner = !isAuthenticated && !bannerDismissed && successData;

  useEffect(() => {
    fetchSuccessData();
  }, [token]);

  const fetchSuccessData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/rfi/${token}/success`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to load submission details');
        return;
      }
      
      setSuccessData(data.data);
    } catch (err) {
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Redirect to client portal with the company's RFI log
    const companyName = successData?.rfi?.projects?.client_company_name;
    if (companyName) {
      router.push(`/client/rfi-log?token=${token}`);
    }
  };

  const handleCloseWindow = () => {
    if (window.opener) {
      // If opened in a popup/new tab, close it
      window.close();
    } else {
      // If in the same tab, show confirmation
      if (confirm('Are you sure you want to close this page? Your response has been successfully submitted.')) {
        window.close();
      }
    }
  };

  const handleViewRFI = () => {
    router.push(`/client/rfi/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Details</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/client/rfi/${token}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Return to RFI
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!successData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No submission data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Client Login Banner - Only show if not authenticated */}
      {showBanner && (
        <ClientLoginBanner
          companyName={successData.rfi.projects.client_company_name}
          clientToken={token}
          onDismiss={() => setBannerDismissed(true)}
          onLoginClick={() => setShowAuthModal(true)}
        />
      )}

      {/* Main Success Content */}
      <div className={`${showBanner ? "py-8" : "py-16"}`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Response Submitted Successfully!
              </h1>
              <p className="text-lg text-gray-600">
                Your response has been received and is being reviewed by the contractor team.
              </p>
            </div>

            {/* RFI Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">RFI Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">RFI Number</p>
                  <p className="font-medium text-gray-900">{successData.rfi.rfi_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Project</p>
                  <p className="font-medium text-gray-900">{successData.rfi.projects.project_name}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-medium text-gray-900">{successData.rfi.subject}</p>
                </div>
              </div>
            </div>

            {/* Submission Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4">Submission Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-600">Submitted By</p>
                  <p className="font-medium text-green-800">{successData.response.submitted_by}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Submitted At</p>
                  <p className="font-medium text-green-800">
                    {new Date(successData.response.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Response Length</p>
                  <p className="font-medium text-green-800">{successData.response.response_length} characters</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Attachments</p>
                  <p className="font-medium text-green-800">{successData.response.attachment_count} files</p>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                What Happens Next?
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>The contractor team will review your response and any attached documents</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>You'll receive email updates on the RFI progress and any follow-up questions</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>This secure link will remain active for future reference</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>The project team will coordinate any necessary field work or follow-up actions</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleViewRFI}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                View RFI Details
              </button>
              
              {!isAuthenticated && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login to Portal
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => router.push('/client/rfi-log')}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All RFIs
                </button>
              )}
              
              <button
                onClick={handleCloseWindow}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Close Window
              </button>
            </div>

            {/* Additional Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please keep this link for your records. You can return to view the RFI details and track progress at any time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Authentication Modal */}
      <ClientAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        clientToken={token}
        companyName={successData.rfi.projects.client_company_name}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
} 