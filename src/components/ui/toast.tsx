'use client';

import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface Toast {
  id?: string;
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

interface ToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            min-w-80 max-w-md p-4 rounded-lg shadow-lg border transition-all duration-300 transform
            ${toast.variant === 'destructive' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
            }
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {toast.variant === 'destructive' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{toast.title}</h3>
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            </div>
            <button
              onClick={() => toast.id && onDismiss(toast.id)}
              className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 