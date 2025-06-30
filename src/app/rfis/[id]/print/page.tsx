import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

interface RFIData {
  id: string
  rfi_number: string
  project_name: string
  question: string
  answer: string | null
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  created_at: string
  created_by_name: string
  assigned_to_name: string | null
  attachments?: Array<{
    id: string
    filename: string
    file_size: number
  }>
  response_attachments?: Array<{
    id: string
    filename: string
    file_size: number
  }>
}

function generateRFIHTML(rfi: RFIData): string {
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
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#3b82f6'
      case 'pending_response': return '#eab308'
      case 'answered': return '#22c55e'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RFI ${rfi.rfi_number} - ${rfi.project_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
            padding: 20px;
        }
        
        .rfi-print-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-item {
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: #f9fafb;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .info-value {
            font-size: 1rem;
            color: #1f2937;
        }
        
        .status-badge, .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.025em;
            color: white;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .question-content, .answer-content {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            min-height: 120px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .attachments-list {
            display: grid;
            gap: 8px;
            margin-top: 15px;
        }
        
        .attachment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
        }
        
        .attachment-name {
            font-weight: 500;
            color: #1f2937;
        }
        
        .attachment-size {
            color: #6b7280;
            font-size: 0.875rem;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
        }
        
        @media print {
            body {
                padding: 0;
            }
            
            .rfi-print-container {
                border: none;
                border-radius: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="rfi-print-container">
        <div class="header">
            <h1>RFI ${rfi.rfi_number}</h1>
            <p>${rfi.project_name}</p>
        </div>
        
        <div class="content">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                        <span class="status-badge" style="background-color: ${getStatusColor(rfi.status)}">
                            ${rfi.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Priority</div>
                    <div class="info-value">
                        <span class="priority-badge" style="background-color: ${getPriorityColor(rfi.priority)}">
                            ${rfi.priority}
                        </span>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Created Date</div>
                    <div class="info-value">${formatDate(rfi.created_at)}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Due Date</div>
                    <div class="info-value">${formatDate(rfi.due_date)}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Created By</div>
                    <div class="info-value">${rfi.created_by_name}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Assigned To</div>
                    <div class="info-value">${rfi.assigned_to_name || 'Unassigned'}</div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Question</h2>
                <div class="question-content">${rfi.question || ''}</div>
                
                ${rfi.attachments && rfi.attachments.length > 0 ? `
                <div class="attachments-list">
                    <div style="font-weight: 600; margin-bottom: 10px; color: #374151;">Question Attachments:</div>
                    ${rfi.attachments.map(att => `
                        <div class="attachment-item">
                            <span class="attachment-name">${att.filename}</span>
                            <span class="attachment-size">${formatFileSize(att.file_size)}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            
            <div class="section">
                <h2 class="section-title">Answer</h2>
                <div class="answer-content">${rfi.answer || 'No answer provided yet.'}</div>
                
                ${rfi.response_attachments && rfi.response_attachments.length > 0 ? `
                <div class="attachments-list">
                    <div style="font-weight: 600; margin-bottom: 10px; color: #374151;">Response Attachments:</div>
                    ${rfi.response_attachments.map(att => `
                        <div class="attachment-item">
                            <span class="attachment-name">${att.filename}</span>
                            <span class="attachment-size">${formatFileSize(att.file_size)}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>`
}

export default async function RFIPrintPage({
  params
}: {
  params: { id: string }
}) {
  try {
    // Fetch RFI data with all necessary joins
    const { data: rfiData, error } = await supabase
      .from('rfis')
      .select(`
        id,
        rfi_number,
        question,
        answer,
        status,
        priority,
        due_date,
        created_at,
        project_id,
        created_by,
        assigned_to,
        projects!inner(project_name),
        created_by_profile:profiles!rfis_created_by_fkey(first_name, last_name),
        assigned_to_profile:profiles!rfis_assigned_to_fkey(first_name, last_name),
        attachments(id, filename, file_size),
        response_attachments(id, filename, file_size)
      `)
      .eq('id', params.id)
      .single()

    if (error || !rfiData) {
      console.error('Error fetching RFI:', error)
      notFound()
    }

    // Transform data to match our interface
    const rfi: RFIData = {
      id: rfiData.id,
      rfi_number: rfiData.rfi_number,
      project_name: (rfiData.projects as any)?.project_name || 'Unknown Project',
      question: rfiData.question,
      answer: rfiData.answer,
      status: rfiData.status,
      priority: rfiData.priority,
      due_date: rfiData.due_date,
      created_at: rfiData.created_at,
      created_by_name: (rfiData.created_by_profile as any)
        ? `${(rfiData.created_by_profile as any).first_name} ${(rfiData.created_by_profile as any).last_name}`
        : 'Unknown',
      assigned_to_name: (rfiData.assigned_to_profile as any)
        ? `${(rfiData.assigned_to_profile as any).first_name} ${(rfiData.assigned_to_profile as any).last_name}`
        : null,
      attachments: rfiData.attachments || [],
      response_attachments: rfiData.response_attachments || []
    }

    // Generate and return HTML directly
    const htmlContent = generateRFIHTML(rfi)
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  } catch (error) {
    console.error('Error in RFI print page:', error)
    notFound()
  }
} 