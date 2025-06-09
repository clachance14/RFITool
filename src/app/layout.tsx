import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/layout/Navigation'
import Header from '@/components/layout/Header'
import { Toaster } from 'react-hot-toast'
import { RFIProvider } from '@/contexts/RFIContext'

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
      <body className="min-h-screen flex bg-gray-50">
        <RFIProvider>
          <Navigation />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
          <Toaster position="top-right" />
        </RFIProvider>
      </body>
    </html>
  )
} 