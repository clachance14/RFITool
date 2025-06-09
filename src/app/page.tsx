"use client";

import { SimpleRFIForm } from '@/components/rfi/SimpleRFIForm';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold mb-4">RFI Tool</h1>
        
        {/* Debug Form */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Debug Form</h2>
          <SimpleRFIForm />
        </div>
      </div>
    </main>
  );
} 