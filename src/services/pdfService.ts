import puppeteer, { Browser, Page } from 'puppeteer';

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  scale?: number;
}

export interface PDFPreview {
  rfiId: string;
  rfiNumber: string;
  projectName: string;
  pdfData: string; // base64 encoded
}

export class PDFService {
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.browserPromise) {
      return this.browserPromise;
    }

    this.browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.browser = await this.browserPromise;
    this.browserPromise = null;

    return this.browser;
  }

  async generatePDF(url: string, options: PDFGenerationOptions = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Wait for print container to load, or check for error conditions
      try {
        // Try to find either RFI or report print container
        await page.waitForSelector('.rfi-print-container, .report-print-container', { timeout: 10000 });
      } catch (error: any) {
        // Check if it's a 404 or other error page
        const pageContent = await page.content();
        if (pageContent.includes('NEXT_NOT_FOUND') || pageContent.includes('404')) {
          throw new Error(`Content not found. The requested page may not exist or you may not have permission to access it.`);
        }
        throw new Error(`Page failed to load properly: ${error?.message || 'Unknown error'}`);
      }

      // Apply print media styles
      await page.emulateMediaType('print');

      // Generate PDF with options
      const pdfData = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: options.margin || {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: options.printBackground ?? true,
        scale: options.scale || 1,
        preferCSSPageSize: true
      });

      return Buffer.from(pdfData);
    } finally {
      await page.close();
    }
  }

  async generateRFIPDF(rfiId: string, baseUrl: string, options: PDFGenerationOptions = {}): Promise<Buffer> {
    const url = `${baseUrl}/rfis/${rfiId}/print?pdf=true`;
    return this.generatePDF(url, options);
  }

  async generateReportPDF(projectId: string, baseUrl: string, options: PDFGenerationOptions = {}): Promise<Buffer> {
    const url = `${baseUrl}/reports/print?projectId=${projectId}`;
    return this.generatePDF(url, options);
  }

  async generateReportPDFWithData(reportData: any, options: PDFGenerationOptions = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Generate static HTML content
      const reportHTML = this.generateReportHTML(reportData);

      // Set the HTML content directly
      await page.setContent(reportHTML, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Apply print media styles
      await page.emulateMediaType('print');

      // Generate PDF with options
      const pdfData = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: options.margin || {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: options.printBackground ?? true,
        scale: options.scale || 1,
        preferCSSPageSize: true
      });

      return Buffer.from(pdfData);
    } finally {
      await page.close();
    }
  }

  private generateReportHTML(reportData: any): string {
    const { project, rfis, stats } = reportData;
    
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const calculateActualCost = (rfi: any): number => {
      if (rfi.timesheet_summary?.total_cost) {
        return rfi.timesheet_summary.total_cost;
      }
      
      const actualLaborCost = rfi.actual_labor_cost || 0;
      const actualMaterialCost = rfi.actual_material_cost || 0;
      const actualEquipmentCost = rfi.actual_equipment_cost || 0;
      const actualTotalCost = rfi.actual_total_cost || 0;
      
      return actualTotalCost || (actualLaborCost + actualMaterialCost + actualEquipmentCost);
    };

    const getFieldWorkStatus = (rfi: any): string => {
      const requiresFieldWork = rfi.requires_field_work || 
                               (rfi.field_work_description && rfi.field_work_description.trim().length > 0);
      
      if (!requiresFieldWork) {
        return 'None Required';
      }
      
      if (rfi.work_completed_date) {
        return 'Completed';
      }
      if (rfi.stage === 'field_work_in_progress' || 
          (rfi.work_started_date && !rfi.work_completed_date)) {
        return 'In Progress';
      }
      
      return 'Not Started';
    };

    // Recent RFI History (last 10)
    const recentRFIs = [...rfis].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    }).slice(0, 10);

    const contractorLogoUrl = project.company?.logo_url;
    const clientLogoUrl = project.client_logo_url;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RFI Status Report - ${project.project_name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #1f2937;
            background: white;
            padding: 20px;
        }
        
        .report-print-container { max-width: 100%; margin: 0 auto; background: white; }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        
        .logo {
            width: 120px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
        }
        
        .logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .logo-placeholder {
            background-color: #f3f4f6;
            color: #6b7280;
            font-size: 10px;
            text-align: center;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .title-section {
            flex: 1;
            text-align: center;
            padding: 0 20px;
        }
        
        .title-section h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .title-section .project-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 4px;
        }
        
        .title-section .date-range {
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        .project-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
        }
        
        .info-item { text-align: center; }
        
        .info-label {
            font-size: 0.8rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        
        .info-value {
            font-weight: 600;
            color: #1f2937;
        }
        
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e40af;
        }
        
        .section-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .rfi-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d1d5db;
            margin-bottom: 20px;
        }
        
        .rfi-table th {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 600;
            color: #374151;
        }
        
        .rfi-table td {
            border: 1px solid #d1d5db;
            padding: 8px;
            font-size: 0.8rem;
            color: #1f2937;
        }
        
        .rfi-table tr:nth-child(even) { background: #f9fafb; }
        
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status-in-progress { background: #fef3c7; color: #92400e; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-none-required { background: #dbeafe; color: #1e40af; }
        .status-not-started { background: #f3f4f6; color: #374151; }
        
        .cost-highlight { color: #059669; font-weight: 600; }
        
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .rfi-table { page-break-inside: avoid; }
            .summary-stats { page-break-inside: avoid; }
            .project-info { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="report-print-container">
        <div class="header">
            <div class="logo">
                ${contractorLogoUrl ? 
                    `<img src="${contractorLogoUrl}" alt="Contractor Logo" />` :
                    `<div class="logo-placeholder">Contractor<br/>Logo</div>`
                }
            </div>
            
            <div class="title-section">
                <h1>RFI Status Report</h1>
                <div class="project-name">${project.project_name}</div>
                <div class="date-range">Week: ${stats.weekRange}</div>
            </div>
            
            <div class="logo">
                ${clientLogoUrl ? 
                    `<img src="${clientLogoUrl}" alt="Client Logo" />` :
                    `<div class="logo-placeholder">Client<br/>Logo</div>`
                }
            </div>
        </div>
        
        <div class="project-info">
            <div class="info-item">
                <div class="info-label">Client</div>
                <div class="info-value">${project.client_company_name || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Contract #</div>
                <div class="info-value">${project.job_contract_number || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Project Manager</div>
                <div class="info-value">${project.client_contact_name || '-'}</div>
            </div>
        </div>
        
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-label">Total RFIs</div>
                <div class="stat-value">${stats.totalRFIs}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Open RFIs</div>
                <div class="stat-value">${stats.openRFIs}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Overdue RFIs</div>
                <div class="stat-value">${stats.overdueRFIs}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">New This Week</div>
                <div class="stat-value">${stats.newRFIsThisWeek}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Responded This Week</div>
                <div class="stat-value">${stats.respondedRFIsThisWeek}</div>
            </div>
        </div>
        
        <div class="section-title">Recent RFI History (Last 10)</div>
        ${recentRFIs.length > 0 ? 
            `<table class="rfi-table">
                <thead>
                    <tr>
                        <th>RFI #</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Field Work</th>
                        <th>Created</th>
                        <th>Actual Cost</th>
                        <th>Response</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentRFIs.map(rfi => `
                        <tr>
                            <td>${rfi.rfi_number || 'N/A'}</td>
                            <td>${rfi.subject || '-'}</td>
                            <td>${rfi.status}</td>
                            <td>
                                <span class="status-badge status-${getFieldWorkStatus(rfi).toLowerCase().replace(/\s+/g, '-')}">
                                    ${getFieldWorkStatus(rfi)}
                                </span>
                            </td>
                            <td>${formatDate(rfi.created_at)}</td>
                            <td class="cost-highlight">${formatCurrency(calculateActualCost(rfi))}</td>
                            <td>${rfi.response ? 'Yes' : 'No'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>` :
            `<div style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">No recent RFIs.</div>`
        }
    </div>
</body>
</html>`;
  }

  async generateMultipleRFIPDFs(rfiIds: string[], baseUrl: string, options: PDFGenerationOptions = {}): Promise<Buffer[]> {
    const browser = await this.getBrowser();
    const promises = rfiIds.map(async (rfiId) => {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1200, height: 800 });
        const url = `${baseUrl}/rfis/${rfiId}/print?pdf=true`;
        
        await page.goto(url, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 30000
        });

        await page.waitForSelector('.rfi-print-container', { timeout: 10000 });
        await page.emulateMediaType('print');

        const pdfData = await page.pdf({
          format: options.format || 'A4',
          landscape: options.orientation === 'landscape',
          margin: options.margin || {
            top: '0.5in',
            right: '0.5in',
            bottom: '0.5in',
            left: '0.5in'
          },
          printBackground: options.printBackground ?? true,
          scale: options.scale || 1,
          preferCSSPageSize: true
        });
        
        return Buffer.from(pdfData);
      } finally {
        await page.close();
      }
    });

    return Promise.all(promises);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = new PDFService();

// Cleanup on process exit
process.on('exit', () => {
  pdfService.cleanup();
});

process.on('SIGINT', () => {
  pdfService.cleanup().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  pdfService.cleanup().then(() => process.exit(0));
});

// Generate static HTML for an RFI
function generateRFIHTML(rfi: any): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return '#3b82f6'
      case 'pending_response': return '#eab308'
      case 'answered': return '#22c55e'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const projectName = rfi.projects?.project_name || rfi.project_name || 'Unknown Project'
  const createdByName = rfi.created_by_profile 
    ? `${rfi.created_by_profile.first_name} ${rfi.created_by_profile.last_name}`
    : rfi.created_by_name || 'Unknown'
  const assignedToName = rfi.assigned_to_profile
    ? `${rfi.assigned_to_profile.first_name} ${rfi.assigned_to_profile.last_name}`
    : rfi.assigned_to_name || 'Unassigned'

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RFI ${rfi.rfi_number} - ${projectName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5; color: #1f2937; background: #f9fafb; padding: 32px; }
        
        /* Main Container - Document Style */
        .rfi-print-container { 
            max-width: none; 
            margin: 0 auto; 
            background: white; 
            border: 1px solid #d1d5db; 
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        /* Header Section with Logo Placeholders */
        .header-section { 
            padding: 24px 32px; 
            position: relative; 
        }
        
        /* Logo Container */
        .logo-container { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 16px; 
        }
        
        .logo-placeholder { 
            width: 80px; 
            height: 80px; 
            border: 1px solid #d1d5db; 
            background: #f3f4f6; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 4px; 
        }
        
        .logo-text { 
            font-size: 10px; 
            color: #6b7280; 
            text-align: center; 
            line-height: 1.2; 
        }
        
        /* Main Title */
        .main-title { 
            text-align: center; 
            margin-bottom: 8px; 
        }
        
        .main-title h1 { 
            font-size: 24px; 
            font-weight: 700; 
            color: #1f2937; 
            letter-spacing: 0.025em; 
        }
        
        /* Project Name */
        .project-title { 
            text-align: center; 
            margin-bottom: 16px; 
        }
        
        .project-title h2 { 
            font-size: 18px; 
            font-weight: 500; 
            color: #1f2937; 
        }
        
        /* Date and RFI Number Row */
        .date-rfi-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        
        .date-info, .rfi-info { 
            font-size: 14px; 
        }
        
        .label { 
            color: #6b7280; 
        }
        
        .value { 
            color: #1f2937; 
            font-weight: 500; 
        }
        
        /* Metadata Block */
        .metadata-section { 
            border-top: 1px solid #d1d5db; 
            padding: 24px 32px; 
        }
        
        .metadata-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 32px; 
        }
        
        .metadata-column { 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
        }
        
        .metadata-row { 
            display: flex; 
            justify-content: space-between; 
            font-size: 14px; 
        }
        
        .metadata-label { 
            color: #6b7280; 
        }
        
        .metadata-value { 
            color: #1f2937; 
            font-weight: 500; 
        }
        
        /* Subject Section */
        .subject-section { 
            border-top: 1px solid #d1d5db; 
            padding: 16px 32px; 
        }
        
        .subject-row { 
            display: flex; 
            align-items: flex-start; 
            font-size: 14px; 
        }
        
        .subject-label { 
            color: #6b7280; 
            width: 80px; 
            flex-shrink: 0; 
        }
        
        .subject-value { 
            color: #1f2937; 
            font-weight: 500; 
            flex: 1; 
        }
        
        /* Contractor Submission Section */
        .contractor-section { 
            border-top: 1px solid #d1d5db; 
            padding: 24px 32px; 
        }
        
        .section-title { 
            font-size: 18px; 
            font-weight: 700; 
            color: #1f2937; 
            margin-bottom: 24px; 
        }
        
        .question-block, .solution-block { 
            margin-bottom: 24px; 
        }
        
        .block-title { 
            font-size: 14px; 
            font-weight: 600; 
            color: #374151; 
            margin-bottom: 12px; 
        }
        
        .content-box { 
            border: 1px solid #d1d5db; 
            padding: 16px; 
            background: #f9fafb; 
            min-height: 80px; 
        }
        
        .content-text { 
            color: #1f2937; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            font-size: 14px; 
            line-height: 1.5; 
        }
        
        /* Status and Priority Badges */
        .status-badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.025em; 
            color: white; 
        }
        
        /* Attachments Table */
        .attachments-section { 
            margin-top: 24px; 
        }
        
        .attachments-table { 
            width: 100%; 
            border: 1px solid #d1d5db; 
            border-collapse: collapse; 
        }
        
        .table-header { 
            background: #f9fafb; 
        }
        
        .table-header th { 
            padding: 8px 16px; 
            text-align: left; 
            font-size: 11px; 
            font-weight: 500; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            border-bottom: 1px solid #d1d5db; 
        }
        
        .table-row td { 
            padding: 8px 16px; 
            font-size: 14px; 
            color: #1f2937; 
            border-bottom: 1px solid #e5e7eb; 
        }
        
        /* Print Styles */
        @media print { 
            body { 
                padding: 0; 
                background: white; 
            } 
            .rfi-print-container { 
                border: none; 
                box-shadow: none; 
                max-width: none; 
            } 
        }
    </style>
</head>
<body>
    <div class="rfi-print-container">
        
        <!-- Header Section with Logos -->
        <div class="header-section">
            <!-- Logo Container -->
            <div class="logo-container">
                <!-- Contractor Logo - Left -->
                <div class="logo-placeholder">
                    <div class="logo-text">Contractor<br/>Logo</div>
                </div>
                
                <!-- Client Logo - Right -->
                <div class="logo-placeholder">
                    <div class="logo-text">Client<br/>Logo</div>
                </div>
            </div>
            
            <!-- Main Title -->
            <div class="main-title">
                <h1>REQUEST FOR INFORMATION</h1>
            </div>
            
            <!-- Project Name -->
            <div class="project-title">
                <h2>${projectName}</h2>
            </div>
            
            <!-- Date and RFI Number Row -->
            <div class="date-rfi-row">
                <div class="date-info">
                    <span class="label">Date: </span>
                    <span class="value">${formatDate(rfi.created_at)}</span>
                </div>
                <div class="rfi-info">
                    <span class="label">RFI#: </span>
                    <span class="value">${rfi.rfi_number}</span>
                </div>
            </div>
        </div>

        <!-- Metadata Block - Two-Column Grid -->
        <div class="metadata-section">
            <div class="metadata-grid">
                <!-- Left Column -->
                <div class="metadata-column">
                    <div class="metadata-row">
                        <span class="metadata-label">Job:</span>
                        <span class="metadata-value">${rfi.project?.contractor_job_number || 'N/A'}</span>
                    </div>
                    <div class="metadata-row">
                        <span class="metadata-label">Reason for RFI:</span>
                        <span class="metadata-value">${rfi.reason_for_rfi || 'Not specified'}</span>
                    </div>
                    <div class="metadata-row">
                        <span class="metadata-label">Company:</span>
                        <span class="metadata-value">${rfi.project?.client_company_name || 'Client Company'}</span>
                    </div>
                </div>
                
                <!-- Right Column -->
                <div class="metadata-column">
                    <div class="metadata-row">
                        <span class="metadata-label">Contract#:</span>
                        <span class="metadata-value">${rfi.project?.job_contract_number || 'N/A'}</span>
                    </div>
                    <div class="metadata-row">
                        <span class="metadata-label">To:</span>
                        <span class="metadata-value">${rfi.project?.project_manager_contact || assignedToName}</span>
                    </div>
                    <div class="metadata-row">
                        <span class="metadata-label">Discipline:</span>
                        <span class="metadata-value">${rfi.discipline || 'Not specified'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Subject Section -->
        <div class="subject-section">
            <div class="subject-row">
                <span class="subject-label">Subject:</span>
                <span class="subject-value">${rfi.subject || 'No subject provided'}</span>
            </div>
        </div>

        <!-- Contractor Submission Section -->
        <div class="contractor-section">
            <h2 class="section-title">Contractor Submission</h2>
            
            <!-- Contractor Question -->
            <div class="question-block">
                <h3 class="block-title">Contractor Question:</h3>
                <div class="content-box">
                    <p class="content-text">${rfi.description || 'No question provided.'}</p>
                </div>
            </div>

            <!-- Proposed Solution -->
            <div class="solution-block">
                <h3 class="block-title">Proposed Solution:</h3>
                <div class="content-box">
                    <p class="content-text">${rfi.proposed_solution || 'No proposed solution provided.'}</p>
                </div>
            </div>

            <!-- Associated Reference Documents -->
            ${rfi.attachment_files && rfi.attachment_files.length > 0 ? `
            <div class="attachments-section">
                <h3 class="block-title">Associated Reference Documents:</h3>
                <table class="attachments-table">
                    <thead class="table-header">
                        <tr>
                            <th>Document Name</th>
                            <th>Type</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rfi.attachment_files.map((attachment: any) => `
                            <tr class="table-row">
                                <td>${attachment.file_name || 'Unknown'}</td>
                                <td>${(attachment.file_type || 'Unknown').replace('application/', '').replace('image/', '').toUpperCase()}</td>
                                <td>${formatFileSize(attachment.file_size || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`
}

// Server-side PDF preview generation using static HTML
export async function generatePDFPreviewsServer(rfis: any[]): Promise<PDFPreview[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const previews: PDFPreview[] = [];
    
    for (const rfi of rfis) {
      try {
        const page = await browser.newPage();
        
        // Generate static HTML for the RFI
        const htmlContent = generateRFIHTML(rfi);
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        
        // Wait for the container to be ready
        await page.waitForSelector('.rfi-print-container', { timeout: 5000 });
        
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

        previews.push({
          rfiId: rfi.id,
          rfiNumber: rfi.rfi_number,
          projectName: rfi.projects?.project_name || rfi.project_name || 'Unknown Project',
          pdfData: Buffer.from(pdfBuffer).toString('base64')
        });

        await page.close();
      } catch (error) {
        console.error(`Error generating PDF preview for RFI ${rfi.id}:`, error);
        // Continue with other RFIs even if one fails
      }
    }

    return previews;
  } finally {
    await browser.close();
  }
}

// Generate individual RFI PDF
export async function generateRFIPDF(rfi: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Generate static HTML for the RFI
    const htmlContent = generateRFIHTML(rfi);
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    // Wait for the container to be ready
    await page.waitForSelector('.rfi-print-container', { timeout: 5000 });
    
    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    await page.close();
    return Buffer.from(pdfData);
  } finally {
    await browser.close();
  }
} 