"use client";

import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, Paperclip, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ClientFileUpload } from './ClientFileUpload';
import { useToast } from '@/components/ui/use-toast';
import { Toast } from '@/components/ui/toast';
import type { RFI } from '@/lib/types';

interface ClientResponseFormProps {
  rfi: RFI;
  clientToken: string;
  clientName?: string;
  clientEmail?: string;
  onResponseSubmit?: (response: string, attachments: any[]) => void;
}

export function ClientResponseForm({
  rfi,
  clientToken,
  clientName = 'Client User',
  clientEmail = '',
  onResponseSubmit
}: ClientResponseFormProps) {
  const router = useRouter();
  const [responseText, setResponseText] = useState(rfi.response || '');
  const [responderName, setResponderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast, toasts, dismiss } = useToast();

  // Check if response is already submitted
  const isSubmitted = !!rfi.response && rfi.stage === 'response_received';

  useEffect(() => {
    // If response is already submitted, redirect to success page
    if (isSubmitted) {
      router.push(`/client/rfi/${clientToken}/success`);
    }
  }, [isSubmitted, clientToken, router]);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      setError('Please provide a response before submitting.');
      return;
    }

    if (!responderName.trim()) {
      setError('Please provide your name as the responder.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/client/submit-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Token': clientToken,
          'X-Client-Email': clientEmail,
        },
        body: JSON.stringify({
          rfi_id: rfi.id,
          response: responseText,
          responder_name: responderName,
          client_name: clientName,
          client_email: clientEmail,
          attachment_count: uploadedAttachments.length
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      const result = await response.json();
      
      // Show success toast briefly, then redirect
      toast({
        title: "Response Submitted Successfully!",
        description: "Redirecting to confirmation page...",
        variant: "default"
      });
      
      // Call the callback if provided
      onResponseSubmit?.(responseText, uploadedAttachments);

      // Redirect to success page after a brief delay
      setTimeout(() => {
        router.push(`/client/rfi/${clientToken}/success`);
      }, 1500);

    } catch (error) {
      console.error('Response submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit response';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted, show loading while redirecting
  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-green-800">Redirecting to confirmation page...</h3>
          <p className="text-green-700 text-sm">Your response has already been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="space-y-6">
        {/* Response Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <MessageCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Provide Your Response</h3>
              <p className="text-blue-700 text-sm mb-3">
                Please review the RFI details above and provide your response below. 
                You can also attach supporting documents if needed.
              </p>
              <div className="text-xs text-blue-600">
                <strong>Note:</strong> Once submitted, you'll be redirected to a confirmation page with next steps.
              </div>
            </div>
          </div>
        </div>

        {/* Responder Name Field */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label htmlFor="responder-name" className="block text-sm font-medium text-gray-900 mb-3">
            <User className="w-4 h-4 inline mr-2" />
            Your Name (Responder) *
          </label>
          <input
            type="text"
            id="responder-name"
            value={responderName}
            onChange={(e) => setResponderName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
          <div className="mt-2 text-xs text-gray-500">
            This will be recorded as the person who submitted this response
          </div>
        </div>

        {/* Response Text Area */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label htmlFor="response" className="block text-sm font-medium text-gray-900 mb-3">
            Your Response *
          </label>
          <textarea
            id="response"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Please provide your detailed response to this RFI..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            disabled={isSubmitting}
          />
          <div className="mt-2 text-xs text-gray-500">
            {responseText.length} characters
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Supporting Documents</h3>
            <p className="text-sm text-gray-600">
              Attach any supporting documents, drawings, photos, or other files that help clarify your response.
            </p>
          </div>
          
          <ClientFileUpload
            rfiId={rfi.id}
            clientToken={clientToken}
            clientName={clientName}
            clientEmail={clientEmail}
            onUploadComplete={(attachments) => {
              setUploadedAttachments(prev => [...prev, ...attachments]);
            }}
            maxFiles={5}
            maxFileSize={25}
            disabled={isSubmitting}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Ready to submit your response?</p>
              <p>Make sure you've provided all necessary information and attached any relevant documents.</p>
            </div>
            
            <button
              onClick={handleSubmitResponse}
              disabled={isSubmitting || !responseText.trim() || !responderName.trim()}
              className={`
                inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${isSubmitting || !responseText.trim() || !responderName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Response
                </>
              )}
            </button>
          </div>
          
          {uploadedAttachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <Paperclip className="w-4 h-4 inline mr-1" />
                {uploadedAttachments.length} file{uploadedAttachments.length !== 1 ? 's' : ''} will be included with your response
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 