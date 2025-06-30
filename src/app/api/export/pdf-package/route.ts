import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/services/pdfService';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { rfiIds, includeAttachments = true } = await request.json();
    
    if (!rfiIds || !Array.isArray(rfiIds) || rfiIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid RFI IDs provided' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    
    // Generate PDFs for all RFIs
    const pdfBuffers = await pdfService.generateMultipleRFIPDFs(rfiIds, baseUrl);
    
    // Create ZIP package
    const zip = new JSZip();
    
    for (let i = 0; i < rfiIds.length; i++) {
      const rfiId = rfiIds[i];
      const pdfBuffer = pdfBuffers[i];
      
      // Get RFI details for folder naming
      const { data: rfi } = await supabase
        .from('rfis')
        .select('rfi_number, attachment_files')
        .eq('id', rfiId)
        .single();
      
      if (!rfi) continue;
      
      const folderName = `RFI_${rfi.rfi_number}`;
      const rfiFolder = zip.folder(folderName);
      
      // Add PDF
      rfiFolder?.file(`RFI_${rfi.rfi_number}.pdf`, pdfBuffer);
      
      // Add attachments if requested
      if (includeAttachments && rfi.attachment_files?.length > 0) {
        const attachmentsFolder = rfiFolder?.folder('attachments');
        
        for (const attachment of rfi.attachment_files) {
          if (attachment.public_url) {
            try {
              const response = await fetch(attachment.public_url);
              const blob = await response.arrayBuffer();
              attachmentsFolder?.file(attachment.file_name, blob);
            } catch (error) {
              console.error(`Failed to download attachment: ${attachment.file_name}`, error);
            }
          }
        }
      }
    }
    
    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="RFI_Package_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });
  } catch (error) {
    console.error('PDF package generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF package' },
      { status: 500 }
    );
  }
} 