import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { project, rfis, stats, logos } = await request.json();
    
    if (!project || !stats) {
      return NextResponse.json({ error: 'Project data and stats are required' }, { status: 400 });
    }

    // Generate HTML for the report
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>RFI Status Report</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.4; 
          color: #374151; 
          background: #ffffff;
        }
        .header { 
          margin-bottom: 30px; 
          border-bottom: 2px solid #e5e7eb; 
          padding-bottom: 20px; 
        }
        .project-info { 
          display: grid; 
          grid-template-columns: 1fr 1fr 1fr; 
          gap: 16px; 
          margin-bottom: 30px; 
        }
        .info-box { 
          border: 1px solid #e5e7eb; 
          padding: 16px; 
          background: #f9fafb; 
          border-radius: 6px; 
        }
        .info-label { 
          font-weight: 500; 
          color: #6b7280; 
          font-size: 12px; 
          margin-bottom: 4px; 
          text-transform: uppercase;
        }
        .info-value {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
        }
        .stats { 
          display: grid; 
          grid-template-columns: repeat(5, 1fr); 
          gap: 16px; 
          margin-bottom: 32px; 
        }
        .stat-card { 
          text-align: center; 
          border: 1px solid #dbeafe; 
          padding: 16px; 
          background: #eff6ff; 
          border-radius: 8px; 
        }
        .stat-value { 
          font-size: 28px; 
          font-weight: bold; 
          color: #1e40af; 
          margin-bottom: 4px; 
          line-height: 1;
        }
        .stat-label { 
          font-size: 11px; 
          color: #6b7280; 
          font-weight: 500;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 32px 0 16px 0;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        th { 
          background-color: #f3f4f6; 
          border: 1px solid #e5e7eb; 
          padding: 12px 8px; 
          text-align: left; 
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }
        td { 
          border: 1px solid #e5e7eb; 
          padding: 12px 8px; 
          font-size: 13px;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: lowercase;
        }
        .status-active { 
          background-color: #dcfce7; 
          color: #166534; 
        }
        .status-draft { 
          background-color: #fef3c7; 
          color: #92400e; 
        }
        .status-closed { 
          background-color: #e5e7eb; 
          color: #374151; 
        }
        .field-work-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .field-work-none { 
          background-color: #dbeafe; 
          color: #1e40af; 
        }
        .field-work-progress { 
          background-color: #fef3c7; 
          color: #92400e; 
        }
        .field-work-completed { 
          background-color: #dcfce7; 
          color: #166534; 
        }
        .field-work-not-started { 
          background-color: #f3f4f6; 
          color: #6b7280; 
        }
        .cost-value {
          color: #059669;
          font-weight: 600;
        }
        .overdue-warning {
          color: #d97706;
          margin-left: 4px;
        }
        .rfi-number {
          display: flex;
          align-items: center;
          font-weight: 500;
        }
        h1 { 
          color: #1e40af; 
          margin: 0 0 8px 0; 
          font-size: 24px;
          font-weight: bold;
        }
        h2 { 
          color: #1e40af; 
          margin: 0 0 4px 0; 
          font-size: 20px;
          font-weight: 600;
        }
        .week-range {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
      </style>
    </head>
         <body>
       <div class="header">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
           <!-- Contractor Logo -->
           <div style="width: 120px; height: 60px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; border-radius: 4px;">
             ${logos?.contractorLogo ? 
               `<img src="${logos.contractorLogo}" alt="Contractor Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` :
               `<div style="background: #f5f5f5; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">No Logo</div>`
             }
           </div>
           
                       <!-- Title Section -->
            <div style="text-align: center; flex: 1; margin: 0 20px;">
              <h1>RFI Status Report</h1>
              <h2>${project.project_name || 'Project Report'}</h2>
              <p class="week-range">Week: ${stats.weekRange || 'Current Status'}</p>
            </div>
           
           <!-- Client Logo -->
           <div style="width: 120px; height: 60px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; border-radius: 4px;">
             ${logos?.clientLogo ? 
               `<img src="${logos.clientLogo}" alt="Client Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` :
               `<div style="background: #f5f5f5; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">No Logo</div>`
             }
           </div>
         </div>
       </div>

             <div class="project-info">
         <div class="info-box">
           <div class="info-label">Client</div>
           <div class="info-value">${project.client_company_name || '-'}</div>
         </div>
         <div class="info-box">
           <div class="info-label">Contract #</div>
           <div class="info-value">${project.job_contract_number || '-'}</div>
         </div>
         <div class="info-box">
           <div class="info-label">Project Manager</div>
           <div class="info-value">${project.client_contact_name || '-'}</div>
         </div>
       </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${stats.totalRFIs || 0}</div>
          <div class="stat-label">Total RFIs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.openRFIs || 0}</div>
          <div class="stat-label">Open RFIs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.overdueRFIs || 0}</div>
          <div class="stat-label">Overdue RFIs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.newRFIsThisWeek || 0}</div>
          <div class="stat-label">New This Week</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.respondedRFIsThisWeek || 0}</div>
          <div class="stat-label">Responded This Week</div>
        </div>
      </div>

             <div class="section-title">Recent RFI History (Last 10)</div>
       <table>
         <thead>
           <tr>
             <th style="width: 12%;">RFI #</th>
             <th style="width: 30%;">Subject</th>
             <th style="width: 12%;">Status</th>
             <th style="width: 15%;">Field Work</th>
             <th style="width: 12%;">Created</th>
             <th style="width: 12%;">Actual Cost</th>
             <th style="width: 7%;">Response</th>
           </tr>
         </thead>
         <tbody>
           ${(rfis || []).slice(0, 10).map((rfi: any) => {
             // Determine field work status class
             const fieldWorkClass = 
               rfi.fieldWorkStatus === 'None Required' ? 'field-work-none' :
               rfi.fieldWorkStatus === 'In Progress' ? 'field-work-progress' :
               rfi.fieldWorkStatus === 'Completed' ? 'field-work-completed' :
               'field-work-not-started';
             
             // Determine status class
             const statusClass = 
               rfi.status === 'active' ? 'status-active' :
               rfi.status === 'closed' ? 'status-closed' :
               'status-draft';
             
             return `
             <tr>
               <td>
                 <div class="rfi-number">
                   ${rfi.rfi_number || 'N/A'}
                   ${rfi.isOverdue ? '<span class="overdue-warning">⚠️</span>' : ''}
                 </div>
               </td>
               <td>${rfi.subject || '-'}</td>
               <td>
                 <span class="status-badge ${statusClass}">${rfi.status || 'draft'}</span>
               </td>
               <td>
                 <span class="field-work-badge ${fieldWorkClass}">${rfi.fieldWorkStatus || 'Not Started'}</span>
               </td>
               <td>${rfi.formattedCreatedDate || '-'}</td>
               <td>
                 <span class="cost-value">${rfi.formattedCost || '$0'}</span>
               </td>
               <td>${rfi.hasResponse || 'No'}</td>
             </tr>
           `;
           }).join('')}
         </tbody>
       </table>
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 11px;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rfi-report-${(project.project_name || 'report').replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Report API GET is working!',
    timestamp: new Date().toISOString()
  });
} 