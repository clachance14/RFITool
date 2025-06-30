import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pdfService } from '@/services/pdfService';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name, client_company_name, job_contract_number, client_contact_name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch RFIs
    const { data: rfis } = await supabase
      .from('rfis')
      .select('id, rfi_number, subject, status, created_at, response_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Calculate basic statistics
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekRange = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    
    const totalRFIs = rfis?.length || 0;
    const openRFIs = rfis?.filter(rfi => rfi.status === 'draft' || rfi.status === 'active').length || 0;

    // Prepare report data
    const reportData = {
      project,
      rfis: rfis || [],
      stats: {
        totalRFIs,
        openRFIs,
        overdueRFIs: 0, // Simplified for now
        newRFIsThisWeek: 0,
        respondedRFIsThisWeek: 0,
        weekRange
      }
    };

    // Generate PDF using the existing PDF service
    const pdfBuffer = await pdfService.generateReportPDFWithData(reportData, {
      format: 'A4',
      printBackground: true
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rfi-report-${project.project_name?.replace(/[^a-zA-Z0-9]/g, '-') || 'report'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Report PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report PDF' },
      { status: 500 }
    );
  }
} 