import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/layout/Navigation'
import Header from '@/components/layout/Header'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'RFI Ware',
  description: 'Professional RFI management for general contractors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-gray-50">
        <Navigation />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
} 