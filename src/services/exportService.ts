import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { RFI } from '@/lib/types';
import { format } from 'date-fns';

export interface ExportField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'status' | 'number' | 'currency' | 'boolean';
  category: 'basic' | 'details' | 'dates' | 'files' | 'response' | 'financial';
}

export const AVAILABLE_EXPORT_FIELDS: ExportField[] = [
  // Basic fields
  { key: 'rfi_number', label: 'RFI Number', type: 'text', category: 'basic' },
  { key: 'subject', label: 'Subject', type: 'text', category: 'basic' },
  { key: 'status', label: 'Status', type: 'status', category: 'basic' },
  { key: 'stage', label: 'Stage', type: 'text', category: 'basic' },
  { key: 'urgency', label: 'Urgency', type: 'text', category: 'basic' },
  { key: 'created_by', label: 'Created By', type: 'text', category: 'basic' },
  { key: 'assigned_to', label: 'Assigned To', type: 'text', category: 'basic' },
  { key: 'project_name', label: 'Project Name', type: 'text', category: 'basic' },
  
  // RFI Content
  { key: 'reason_for_rfi', label: 'Reason for RFI', type: 'text', category: 'details' },
  { key: 'contractor_question', label: 'Contractor Question', type: 'text', category: 'details' },
  { key: 'contractor_proposed_solution', label: 'Proposed Solution', type: 'text', category: 'details' },
  { key: 'work_impact', label: 'Work Impact', type: 'text', category: 'details' },
  { key: 'schedule_impact', label: 'Schedule Impact', type: 'text', category: 'details' },
  { key: 'discipline', label: 'Discipline', type: 'text', category: 'details' },
  { key: 'priority', label: 'Priority', type: 'text', category: 'details' },
  
  // Dates
  { key: 'created_at', label: 'Created Date', type: 'date', category: 'dates' },
  { key: 'due_date', label: 'Due Date', type: 'date', category: 'dates' },
  { key: 'updated_at', label: 'Last Updated', type: 'date', category: 'dates' },
  { key: 'response_date', label: 'Response Date', type: 'date', category: 'dates' },
  { key: 'date_sent', label: 'Date Sent', type: 'date', category: 'dates' },
  { key: 'date_responded', label: 'Date Responded', type: 'date', category: 'dates' },
  { key: 'date_closed', label: 'Date Closed', type: 'date', category: 'dates' },
  
  // Files
  { key: 'attachment_count', label: 'Attachment Count', type: 'number', category: 'files' },
  { key: 'attachment_files', label: 'Attachment List', type: 'text', category: 'files' },
  
  // Response Information
  { key: 'response', label: 'Client Response', type: 'text', category: 'response' },
  { key: 'response_by', label: 'Response Submitted By', type: 'text', category: 'response' },
  { key: 'cm_approval', label: 'CM Approval', type: 'text', category: 'response' },
  
  // Financial & Field Work
  { key: 'cost_impact', label: 'Cost Impact', type: 'currency', category: 'financial' },
  { key: 'requires_field_work', label: 'Requires Field Work', type: 'boolean', category: 'financial' },
  { key: 'actual_labor_hours', label: 'Actual Labor Hours', type: 'number', category: 'financial' },
  { key: 'actual_labor_cost', label: 'Actual Labor Cost', type: 'currency', category: 'financial' },
  { key: 'actual_material_cost', label: 'Actual Material Cost', type: 'currency', category: 'financial' },
  { key: 'actual_equipment_cost', label: 'Actual Equipment Cost', type: 'currency', category: 'financial' },
  { key: 'actual_total_cost', label: 'Actual Total Cost', type: 'currency', category: 'financial' },
];

export const DEFAULT_EXPORT_FIELDS = AVAILABLE_EXPORT_FIELDS.filter(field => 
  ['rfi_number', 'subject', 'status', 'stage', 'urgency', 'created_by', 'created_at', 'due_date', 'response', 'response_by', 'attachment_count'].includes(field.key)
);

export interface ExportOptions {
  selectedFields: string[];
  includeAttachments: boolean;
  projectName?: string;
  exportFormat: 'excel' | 'csv' | 'pdf' | 'both';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class ExportService {
  
  // Format cell value based on field type
  private formatCellValue(value: any, field: ExportField): any {
    if (value === null || value === undefined) return '';
    
    switch (field.type) {
      case 'date':
        return value ? format(new Date(value), 'MM/dd/yyyy') : '';
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'status':
        return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
      default:
        return value;
    }
  }

  // Transform RFI data for export
  private transformRFIData(rfis: any[], selectedFields: string[]): any[] {
    return rfis.map(rfi => {
      const exportRow: any = {};
      
      selectedFields.forEach(fieldKey => {
        const field = AVAILABLE_EXPORT_FIELDS.find(f => f.key === fieldKey);
        if (!field) return;
        
        let value: any;
        
        switch (fieldKey) {
          case 'attachment_count':
            value = rfi.attachment_files?.length || 0;
            break;
          case 'attachment_files':
            value = rfi.attachment_files?.map((f: any) => f.file_name).join(', ') || '';
            break;
          case 'created_by':
            value = rfi.created_by_name || rfi.created_by || '';
            break;
          case 'assigned_to':
            value = rfi.assigned_to_name || rfi.assigned_to || '';
            break;
          case 'response':
            // Handle both the mapped field (response) and the database field (client_response)
            value = rfi.response || rfi.client_response || '';
            break;
          case 'response_by':
            // Map to client_response_submitted_by
            value = rfi.response_by_name || rfi.client_response_submitted_by || '';
            break;
          case 'cm_approval':
            // Map to client_cm_approval
            value = rfi.client_cm_approval || '';
            break;
          case 'contractor_question':
            value = rfi.contractor_question || rfi.description || '';
            break;
          case 'contractor_proposed_solution':
            value = rfi.contractor_proposed_solution || rfi.proposed_solution || '';
            break;
          case 'project_name':
            value = rfi.project_name || '';
            break;
          case 'cost_impact':
            value = rfi.cost_impact || 0;
            break;
          case 'requires_field_work':
            value = rfi.requires_field_work || false;
            break;
          case 'actual_labor_hours':
            value = rfi.actual_labor_hours || 0;
            break;
          case 'actual_labor_cost':
            value = rfi.actual_labor_cost || 0;
            break;
          case 'actual_material_cost':
            value = rfi.actual_material_cost || 0;
            break;
          case 'actual_equipment_cost':
            value = rfi.actual_equipment_cost || 0;
            break;
          case 'actual_total_cost':
            value = rfi.actual_total_cost || 0;
            break;
          case 'date_closed':
            // Handle date_closed - if it's not directly available, compute it from status/stage
            value = rfi.date_closed || (rfi.status === 'closed' ? rfi.updated_at : null);
            break;
          default:
            value = rfi[fieldKey];
        }
        
        exportRow[field.label] = this.formatCellValue(value, field);
      });
      
      return exportRow;
    });
  }

  // Export to CSV
  async exportToCSV(rfis: any[], options: ExportOptions): Promise<void> {
    const transformedData = this.transformRFIData(rfis, options.selectedFields);
    
    // Convert to CSV
    const csv = Papa.unparse(transformedData);
    
    // Generate filename
    const projectName = options.projectName || 'All Projects';
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const filename = `RFI_Export_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.csv`;
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export to Excel
  async exportToExcel(rfis: any[], options: ExportOptions): Promise<void> {
    const transformedData = this.transformRFIData(rfis, options.selectedFields);
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RFI Export');
    
    // Add headers
    const headers = options.selectedFields.map(fieldKey => {
      const field = AVAILABLE_EXPORT_FIELDS.find(f => f.key === fieldKey);
      return field?.label || fieldKey;
    });
    worksheet.addRow(headers);
    
    // Add data rows
    transformedData.forEach(row => {
      const values = headers.map(header => row[header] || '');
      worksheet.addRow(values);
    });
    
    // Set column widths and styling
    worksheet.columns = options.selectedFields.map((fieldKey, index) => {
      const field = AVAILABLE_EXPORT_FIELDS.find(f => f.key === fieldKey);
      let width: number;
      switch (field?.type) {
        case 'text':
          width = field.key === 'description' ? 50 : 20;
          break;
        case 'date':
          width = 12;
          break;
        case 'currency':
          width = 15;
          break;
        default:
          width = 15;
      }
      return { width, header: headers[index] };
    });
    
    // Style the headers (bonus professional look!)
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    
    // Generate filename
    const projectName = options.projectName || 'All Projects';
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const filename = `RFI_Export_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;
    
    // Save file (more reliable download method)
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export individual RFI to PDF
  async exportRFIToPDF(rfi: any, element: HTMLElement): Promise<Blob> {
    // Hide all non-printable elements
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      .export-hide { display: none !important; }
      .print\\:hidden { display: none !important; }
      button { display: none !important; }
      .hover\\:bg-gray-50 { background-color: transparent !important; }
    `;
    document.head.appendChild(printStyles);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      return pdf.output('blob');
    } finally {
      document.head.removeChild(printStyles);
    }
  }

  // Create zip file with RFI PDFs and attachments
  async createRFIPackage(rfis: any[], getPDFBlob: (rfi: any) => Promise<Blob>): Promise<void> {
    const zip = new JSZip();
    
    for (const rfi of rfis) {
      const rfiFolder = zip.folder(`RFI_${rfi.rfi_number}`);
      
      // Add PDF
      try {
        const pdfBlob = await getPDFBlob(rfi);
        rfiFolder?.file(`RFI_${rfi.rfi_number}.pdf`, pdfBlob);
      } catch (error) {
        console.error(`Error generating PDF for RFI ${rfi.rfi_number}:`, error);
      }
      
      // Add attachments
      if (rfi.attachment_files?.length > 0) {
        const attachmentsFolder = rfiFolder?.folder('attachments');
        
        for (const attachment of rfi.attachment_files) {
          if (attachment.public_url) {
            try {
              const response = await fetch(attachment.public_url);
              const blob = await response.blob();
              attachmentsFolder?.file(attachment.file_name, blob);
            } catch (error) {
              console.error(`Error downloading attachment ${attachment.file_name}:`, error);
            }
          }
        }
      }
    }
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const filename = `RFI_Package_${timestamp}.zip`;
    
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // NEW: Server-side PDF generation methods
  async generateRFIPDF(rfiId: string): Promise<string> {
    const response = await fetch(`/api/rfis/${rfiId}/pdf`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PDF generation failed for RFI ${rfiId}:`, response.status, errorText);
      throw new Error(`Failed to generate PDF for RFI ${rfiId}: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Generate multiple PDFs for preview
  async generateMultiplePDFPreviews(rfiIds: string[]): Promise<string[]> {
    const promises = rfiIds.map(id => this.generateRFIPDF(id));
    return Promise.all(promises);
  }



  // Export package using server-side generation
  async exportRFIPackageServerSide(rfiIds: string[], includeAttachments: boolean = true): Promise<void> {
    const response = await fetch('/api/export/pdf-package', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rfiIds,
        includeAttachments
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF package');
    }

    // Download the ZIP file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RFI_Package_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // EXISTING: Export selected RFIs with options (UNCHANGED)
  async exportSelectedRFIs(rfis: any[], options: ExportOptions, getPDFBlob?: (rfi: any) => Promise<Blob>): Promise<void> {
    if (options.exportFormat === 'excel' || options.exportFormat === 'both') {
      await this.exportToExcel(rfis, options);
    }
    
    if (options.exportFormat === 'csv') {
      await this.exportToCSV(rfis, options);
    }
    
    if ((options.exportFormat === 'pdf' || options.exportFormat === 'both') && getPDFBlob) {
      await this.createRFIPackage(rfis, getPDFBlob);
    }
  }

  // Get export summary
  getExportSummary(rfis: any[], options: ExportOptions): string {
    const count = rfis.length;
    const fieldCount = options.selectedFields.length;
    const hasAttachments = rfis.some(rfi => rfi.attachment_files?.length > 0);
    
    let summary = `${count} RFI${count !== 1 ? 's' : ''} with ${fieldCount} field${fieldCount !== 1 ? 's' : ''}`;
    
    if (options.includeAttachments && hasAttachments) {
      const totalAttachments = rfis.reduce((sum, rfi) => sum + (rfi.attachment_files?.length || 0), 0);
      summary += ` and ${totalAttachments} attachment${totalAttachments !== 1 ? 's' : ''}`;
    }
    
    return summary;
  }
}

export const exportService = new ExportService(); 