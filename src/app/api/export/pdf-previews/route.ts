import { NextRequest, NextResponse } from 'next/server';
import { generatePDFPreviewsServer } from '@/services/pdfService';

export async function POST(request: NextRequest) {
  try {
    const { rfis } = await request.json();
    
    if (!rfis || !Array.isArray(rfis)) {
      return NextResponse.json(
        { error: 'Invalid request: RFIs array is required' },
        { status: 400 }
      );
    }

    // Generate PDF previews using the server-side PDF service
    const previews = await generatePDFPreviewsServer(rfis);
    
    return NextResponse.json(previews);
  } catch (error) {
    console.error('Error generating PDF previews:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF previews' },
      { status: 500 }
    );
  }
} 