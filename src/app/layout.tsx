import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { RFIProvider } from '@/contexts/RFIContext'
import LayoutWrapper from '@/components/LayoutWrapper'

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
          <RFIProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster position="top-right" />
          </RFIProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 