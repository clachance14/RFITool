"use client";

import { Dashboard } from '@/components/dashboard/Dashboard';

export default function ReportsPage() {
  return (
    <>
      {/* Basic print styles for browser print (Ctrl+P) fallback */}
      <style jsx global>{`
        @media print {
          @page { margin: 0.5in; size: letter; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { page-break-inside: avoid; }
          .print\\:text-black { color: black !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:bg-gray-200 { background-color: #e5e7eb !important; }
          .print\\:hover\\:bg-transparent:hover { background-color: transparent !important; }
        }
      `}</style>
      
      <div className="p-6 print:p-2">
        <Dashboard />
      </div>
    </>
  );
} 