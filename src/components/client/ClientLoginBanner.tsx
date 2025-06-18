"use client";

import React, { useState } from 'react';
import { LogIn, FileText, BarChart3, Eye, X } from 'lucide-react';

interface ClientLoginBannerProps {
  companyName?: string;
  clientToken: string;
  onDismiss?: () => void;
  onLoginClick?: () => void;
}

export function ClientLoginBanner({ 
  companyName, 
  clientToken, 
  onDismiss,
  onLoginClick
}: ClientLoginBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg print:hidden">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                Want to see all your RFIs and reports?
              </h3>
              <p className="text-blue-100 text-sm">
                Login to access your complete RFI Log, project reports, and more features for {companyName || 'your company'}.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Feature highlights */}
            <div className="hidden md:flex items-center space-x-4 mr-6">
              <div className="flex items-center space-x-1 text-blue-100">
                <FileText className="w-4 h-4" />
                <span className="text-sm">All RFIs</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-100">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Reports</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-100">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Project Status</span>
              </div>
            </div>
            
            <button
              onClick={onLoginClick}
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              Login to Portal
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-blue-200 hover:text-white transition-colors p-1"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 