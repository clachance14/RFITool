import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRFIPDF } from '@/services/pdfService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rfiId = params.id;
    
    // Validate RFI ID format
    if (!rfiId || typeof rfiId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid RFI ID' },
        { status: 400 }
      );
    }
    
    // Fetch RFI data with all necessary joins for formal RFI view
    const { data: rfiData, error } = await supabase
      .from('rfis')
      .select(`
        id,
        rfi_number,
        subject,
        description,
        proposed_solution,
        reason_for_rfi,
        discipline,
        status,
        priority,
        due_date,
        created_at,
        project_id,
        created_by,
        assigned_to,
        response,
        response_by,
        stage,
        projects!inner(
          project_name,
          contractor_job_number,
          job_contract_number,
          client_company_name,
          project_manager_contact,
          client_logo_url,
          companies!inner(
            name,
            logo_url
          )
        ),
        created_by_profile:profiles!rfis_created_by_fkey(first_name, last_name),
        assigned_to_profile:profiles!rfis_assigned_to_fkey(first_name, last_name),
        attachment_files!left(
          id,
          file_name,
          file_type,
          file_size,
          public_url
        )
      `)
      .eq('id', rfiId)
      .single();

    if (error || !rfiData) {
      return NextResponse.json(
        { error: 'RFI not found' },
        { status: 404 }
      );
    }

    // Transform data to match formal RFI interface
    const rfi = {
      id: rfiData.id,
      rfi_number: rfiData.rfi_number,
      subject: rfiData.subject,
      description: rfiData.description,
      proposed_solution: rfiData.proposed_solution,
      reason_for_rfi: rfiData.reason_for_rfi,
      discipline: rfiData.discipline,
      status: rfiData.status,
      priority: rfiData.priority,
      due_date: rfiData.due_date,
      created_at: rfiData.created_at,
      response: rfiData.response,
      response_by: rfiData.response_by,
      stage: rfiData.stage,
      created_by_name: (rfiData.created_by_profile as any)
        ? `${(rfiData.created_by_profile as any).first_name} ${(rfiData.created_by_profile as any).last_name}`
        : 'Unknown',
      assigned_to_name: (rfiData.assigned_to_profile as any)
        ? `${(rfiData.assigned_to_profile as any).first_name} ${(rfiData.assigned_to_profile as any).last_name}`
        : null,
      attachment_files: rfiData.attachment_files || [],
      project: {
        project_name: (rfiData.projects as any)?.project_name || 'Unknown Project',
        contractor_job_number: (rfiData.projects as any)?.contractor_job_number || 'N/A',
        job_contract_number: (rfiData.projects as any)?.job_contract_number || 'N/A',
        client_company_name: (rfiData.projects as any)?.client_company_name || 'Client Company',
        project_manager_contact: (rfiData.projects as any)?.project_manager_contact || 'Project Manager',
        client_logo_url: (rfiData.projects as any)?.client_logo_url,
        contractor_logo_url: (rfiData.projects as any)?.companies?.logo_url,
        contractor_company_name: (rfiData.projects as any)?.companies?.name || 'Contractor'
      }
    };

    // Generate PDF using the server-side PDF service
    const pdfBuffer = await generateRFIPDF(rfi);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="RFI-${rfi.rfi_number}.pdf"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 