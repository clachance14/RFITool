import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { RFIProvider } from '@/contexts/RFIContext'
import LayoutWrapper from '@/components/LayoutWrapper'
import AuthGuard from '@/components/AuthGuard'
import { ToastProvider } from '@/components/ui/ToastProvider'

export const metadata: Metadata = {
  title: {
    template: '%s | RFITrak',
    default: 'RFITrak - RFI Management for Contractors',
  },
  description: 'An RFI management tool for general contractors.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <AuthGuard>
            <RFIProvider>
              <ToastProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </ToastProvider>
              <Toaster position="top-right" />
            </RFIProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
} 