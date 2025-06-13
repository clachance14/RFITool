"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ExternalLink, Shield, TestTube, Copy } from 'lucide-react';

export default function TestClientPage() {
  const [testToken, setTestToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Set up client session for testing
    sessionStorage.setItem('client_session', 'test');
    
    // Generate a sample test token
    setTestToken('test-token-' + Math.random().toString(36).substr(2, 16));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const testClientURL = typeof window !== 'undefined' 
    ? `${window.location.origin}/client/rfi/${testToken}`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Client Portal Test
          </h1>
          <p className="text-gray-600">
            Test the client response functionality as an App Owner
          </p>
        </div>

        <div className="space-y-6">
          {/* App Owner Testing Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              <TestTube className="w-5 h-5 mr-2" />
              App Owner Testing Guide
            </h2>
            <div className="space-y-4 text-green-800">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2">Method 1: Generate Real Client Link</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <Link href="/rfis" className="text-blue-600 hover:underline">RFIs List</Link></li>
                  <li>Select any RFI and click "Generate Client Link" (purple button)</li>
                  <li>Copy the generated secure link</li>
                  <li>Open incognito window and paste the link</li>
                  <li>Test response submission as a client</li>
                </ol>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2">Method 2: Test Client Interface</h3>
                <p className="text-sm mb-3">Use this sample client URL structure:</p>
                <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded text-sm font-mono">
                  <span className="flex-1">{testClientURL}</span>
                  <button
                    onClick={() => copyToClipboard(testClientURL)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-green-600 text-xs mt-1">✓ Copied to clipboard!</p>
                )}
                <p className="text-xs mt-2 text-gray-600">
                  Note: This test URL won't work without a valid RFI and token in your database
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Client Layout Features
            </h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Clean, minimal interface without sidebar navigation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Company branding and logo display
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Simple header with logout option only
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Security notice and session management
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Response form with status selection and file attachments
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Test Links</h3>
              <div className="space-y-3">
                <Link
                  href="/rfis/test-id/formal?client=true"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-gray-900">RFI Formal View (Client Mode)</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </Link>
                
                <Link
                  href="/rfis/test-id/formal?token=secure-client-token-123"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-gray-900">RFI with Token Access</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Access Detection</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Client Session:</span>
                  <span className="ml-2 text-green-600">
                    {typeof window !== 'undefined' && sessionStorage.getItem('client_session') 
                      ? 'Active' : 'None'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Layout Mode:</span>
                  <span className="ml-2 text-blue-600">Client Portal</span>
                </div>
                <div>
                  <span className="font-medium">Navigation:</span>
                  <span className="ml-2 text-gray-800">Simplified Header Only</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">
              🚧 Development Note
            </h3>
            <p className="text-yellow-700 text-sm">
              This is a test page to demonstrate the client layout system. 
              In production, clients would access RFIs via secure links generated by the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 