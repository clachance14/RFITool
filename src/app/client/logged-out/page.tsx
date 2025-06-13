"use client";

import { CheckCircle, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function ClientLoggedOutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Successfully Signed Out
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Thank you for using RFITrak client portal
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Session Closed</h3>
                <p className="text-sm text-gray-500">
                  Your secure session has been closed. All temporary data has been cleared.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your responses have been securely saved</li>
                <li>• The contractor will review your submission</li>
                <li>• You'll receive email updates on RFI progress</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 text-center">
                If you need to access this RFI again, please use the original secure link provided by your contractor.
                <br />
                <span className="font-medium">Do not share secure links with unauthorized users.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to RFITrak
          </Link>
        </div>
      </div>
    </div>
  );
} 