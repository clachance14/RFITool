import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface RFIData {
  id: string
  rfi_number: string
  project_name: string
  subject: string
  status: string
  stage: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  created_at: string
  response_date: string | null
  response: string | null
  requires_field_work: boolean | null
  field_work_description: string | null
  work_started_date: string | null
  work_completed_date: string | null
  actual_labor_cost: number | null
  actual_material_cost: number | null
  actual_equipment_cost: number | null
  actual_total_cost: number | null
  timesheet_summary?: {
    total_cost: number
  }
}

interface ProjectData {
  id: string
  project_name: string
  client_company_name: string | null
  contractor_job_number: string | null
  job_contract_number: string | null
  project_manager_contact: string | null
  client_contact_name: string | null
  client_logo_url: string | null
  company?: {
    logo_url: string | null
  }
  companies?: {
    logo_url: string | null
  }
}

function generateReportHTML(project: ProjectData, rfis: RFIData[]): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Date range for current week
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekRange = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`

  // Calculate statistics
  const totalRFIs = rfis.length
  const openRFIs = rfis.filter(rfi => 
    rfi.status === 'draft' || 
    rfi.status === 'active'
  ).length

  // Business day calculation for 5-day overdue rule
  const addBusinessDays = (startDate: Date, businessDays: number): Date => {
    const result = new Date(startDate)
    let daysAdded = 0
    
    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1)
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++
      }
    }
    
    return result
  }

  const isRfiOverdue = (rfi: RFIData): boolean => {
    if (!rfi.created_at) return false
    
    const createdDate = new Date(rfi.created_at)
    const dueDate = addBusinessDays(createdDate, 5)
    const today = new Date()
    
    // Only consider open RFIs as potentially overdue
    const openStages = ['submitted', 'in_review', 'pending_response', 'field_work_in_progress']
    if (!rfi.stage || !openStages.includes(rfi.stage)) return false
    
    return today > dueDate
  }

  const overdueRFIs = rfis.filter(rfi => isRfiOverdue(rfi)).length

  const newRFIsThisWeek = rfis.filter(rfi => {
    if (!rfi.created_at) return false
    const created = new Date(rfi.created_at)
    return created >= weekStart && created <= weekEnd
  }).length
  
  const respondedRFIsThisWeek = rfis.filter(rfi => {
    if (!rfi.response_date) return false
    const responded = new Date(rfi.response_date)
    return responded >= weekStart && responded <= weekEnd
  }).length

  // Calculate actual cost for an RFI
  const calculateActualCost = (rfi: RFIData): number => {
    // First try timesheet summary if available (most accurate actual costs)
    if (rfi.timesheet_summary?.total_cost) {
      return rfi.timesheet_summary.total_cost
    }
    
    // Fall back to individual actual cost fields if populated
    const actualLaborCost = rfi.actual_labor_cost || 0
    const actualMaterialCost = rfi.actual_material_cost || 0
    const actualEquipmentCost = rfi.actual_equipment_cost || 0
    const actualTotalCost = rfi.actual_total_cost || 0
    
    // Use actual_total_cost if available, otherwise sum individual components
    return actualTotalCost || (actualLaborCost + actualMaterialCost + actualEquipmentCost)
  }

  // Function to determine field work status
  const getFieldWorkStatus = (rfi: RFIData): string => {
    // First check: Does this RFI require field work?
    const requiresFieldWork = rfi.requires_field_work || 
                             (rfi.field_work_description && rfi.field_work_description.trim().length > 0)
    
    // If no field work is required, show "None Required"
    if (!requiresFieldWork) {
      return 'None Required'
    }
    
    // Field work IS required - check progress status
    if (rfi.work_completed_date) {
      return 'Completed'
    }
    if (rfi.stage === 'field_work_in_progress' || 
        (rfi.work_started_date && !rfi.work_completed_date)) {
      return 'In Progress'
    }
    
    // Required but not started yet
    return 'Not Started'
  }

  // Recent RFI History (last 10)
  const recentRFIs = [...rfis].sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
    return bDate - aDate
  }).slice(0, 10)

  const contractorLogoUrl = project.companies?.logo_url || project.company?.logo_url
  const clientLogoUrl = project.client_logo_url

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RFI Status Report - ${project.project_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #1f2937;
            background: white;
            padding: 20px;
        }
        
        .report-print-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
        }
        
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
        
        .logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .logo-placeholder {
            background-color: #f3f4f6;
            color: #6b7280;
            font-size: 10px;
            text-align: center;
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
        
        .info-item {
            text-align: center;
        }
        
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
        
        .rfi-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
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
        
        .cost-highlight {
            color: #059669;
            font-weight: 600;
        }
        
        .overdue-indicator {
            color: #dc2626;
            font-weight: 600;
        }
        
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
        <!-- Header Section -->
        <div class="header">
            <!-- Contractor Logo -->
            <div class="logo">
                ${contractorLogoUrl ? 
                    `<img src="${contractorLogoUrl}" alt="Contractor Logo" />` :
                    `<div class="logo-placeholder">Contractor<br/>Logo</div>`
                }
            </div>
            
            <!-- Title Section -->
            <div class="title-section">
                <h1>RFI Status Report</h1>
                <div class="project-name">${project.project_name}</div>
                <div class="date-range">Week: ${weekRange}</div>
            </div>
            
            <!-- Client Logo -->
            <div class="logo">
                ${clientLogoUrl ? 
                    `<img src="${clientLogoUrl}" alt="Client Logo" />` :
                    `<div class="logo-placeholder">Client<br/>Logo</div>`
                }
            </div>
        </div>
        
        <!-- Project Information -->
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
        
        <!-- Summary Statistics -->
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-label">Total RFIs</div>
                <div class="stat-value">${totalRFIs}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Open RFIs</div>
                <div class="stat-value">${openRFIs}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Overdue RFIs</div>
                <div class="stat-value">${overdueRFIs}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">New This Week</div>
                <div class="stat-value">${newRFIsThisWeek}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Responded This Week</div>
                <div class="stat-value">${respondedRFIsThisWeek}</div>
            </div>
        </div>
        
        <!-- Recent RFI History -->
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
                            <td>
                                ${rfi.rfi_number || 'N/A'}
                                ${isRfiOverdue(rfi) ? '<span class="overdue-indicator">⚠️</span>' : ''}
                            </td>
                            <td>${rfi.subject || '-'}</td>
                            <td>${rfi.status}</td>
                            <td>
                                <span class="status-badge status-${getFieldWorkStatus(rfi).toLowerCase().replace(' ', '-')}">
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
</html>
  `
}

export default async function ReportPrintPage({
  searchParams
}: {
  searchParams: { projectId?: string }
}) {
  const { projectId } = searchParams

  if (!projectId) {
    notFound()
  }

  try {
    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        client_company_name,
        contractor_job_number,
        job_contract_number,
        project_manager_contact,
        client_contact_name,
        client_logo_url,
        company:companies(logo_url)
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Project fetch error:', projectError)
      notFound()
    }

    // Fetch RFIs for this project
    const { data: rfis, error: rfisError } = await supabase
      .from('rfis')
      .select(`
        id,
        rfi_number,
        subject,
        status,
        stage,
        priority,
        created_at,
        response_date,
        response,
        requires_field_work,
        field_work_description,
        work_started_date,
        work_completed_date,
        actual_labor_cost,
        actual_material_cost,
        actual_equipment_cost,
        actual_total_cost,
        timesheet_summary
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (rfisError) {
      console.error('RFIs fetch error:', rfisError)
      notFound()
    }

    // Fix the project data structure for the report
    const projectData: ProjectData = {
      ...project,
      company: project.company?.[0] || null
    }
    
    const reportHTML = generateReportHTML(projectData, (rfis || []) as RFIData[])

    return (
      <div dangerouslySetInnerHTML={{ __html: reportHTML }} />
    )

  } catch (error) {
    console.error('Error generating report:', error)
    notFound()
  }
} 