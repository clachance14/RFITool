import { format } from 'date-fns';

interface RfiPrintViewProps {
  rfi: any;
  isPDFGeneration?: boolean;
}

export function RfiPrintView({ rfi, isPDFGeneration = false }: RfiPrintViewProps) {
  const project = rfi.projects;

  return (
    <div className="rfi-print-container min-h-screen bg-white p-0">
      <div className="max-w-none mx-0 px-0">
        {/* Main Container */}
        <div className="bg-white border-2 border-gray-800 min-h-screen">
          {/* Header Section */}
          <div className="relative px-8 py-6 bg-gray-50 border-b-2 border-gray-800">
            {/* Logo - Top Left */}
            <div className="absolute left-8 top-6">
              {project?.companies?.logo_url ? (
                <img
                  src={project.companies.logo_url}
                  alt="Company Logo"
                  className="h-16 max-w-32 object-contain"
                />
              ) : (
                <div className="w-20 h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500 text-center font-medium">NO<br/>LOGO</span>
                </div>
              )}
            </div>

            {/* Center - Title and Project Info */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Request for Information</h1>
              <div className="text-xl text-gray-700 mb-1">{project?.project_name || 'Unknown Project'}</div>
              <div className="text-lg text-gray-600 mb-1">{project?.job_contract_number || 'N/A'}</div>
              <h2 className="text-xl font-semibold text-gray-800 mt-3">{rfi.subject}</h2>
            </div>

            {/* Right - RFI Number and Date */}
            <div className="absolute right-8 top-6 text-right">
              <div className="text-2xl font-bold text-gray-900 mb-2">{rfi.rfi_number}</div>
              <div className="text-sm text-gray-600">{format(new Date(rfi.created_at), 'MM/dd/yyyy')}</div>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="px-8 py-6 bg-white border-b border-gray-300">
            <div className="grid grid-cols-5 gap-x-6 gap-y-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Job:</span>
                <div className="text-gray-900">{project?.job_contract_number || 'N/A'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Contract#:</span>
                <div className="text-gray-900">{project?.job_contract_number || 'N/A'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Date:</span>
                <div className="text-gray-900">{format(new Date(rfi.created_at), 'MM/dd/yyyy')}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">To:</span>
                <div className="text-gray-900">Project Manager</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Company:</span>
                <div className="text-gray-900">{project?.companies?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Impact & Classification */}
          <div className="px-8 py-6 border-b border-gray-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Impact & Classification</h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Work Impact:</span>
                    <div className="text-gray-900">{rfi.work_impact || 'Not Specified'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">System:</span>
                    <div className="text-gray-900">{rfi.system || 'Not Specified'}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Discipline:</span>
                    <div className="text-gray-900">{rfi.discipline || 'Not Specified'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Schedule Impact:</span>
                    <div className="text-gray-900">{rfi.schedule_impact || 'Not Specified'}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Cost Impact:</span>
                    <div className="text-green-600 font-medium">{rfi.cost_impact || 'No Cost Impact'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Priority:</span>
                    <div className="text-gray-900">{rfi.priority || 'Not Specified'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-8 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-900">{rfi.status?.replace('_', ' ') || 'Open'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Stage:</span>
                  <span className="ml-2 text-gray-900">{rfi.stage?.replace('_', ' ') || 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RFI Content */}
          <div className="px-8 py-6 border-b border-gray-300">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Reason for RFI:</h4>
                <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {rfi.reason_for_rfi || 'Not specified'}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Contractor Question:</h4>
                <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {rfi.contractor_question || rfi.description || 'Not specified'}
                </div>
              </div>

              {rfi.contractor_proposed_solution && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Contractor Proposed Solution:</h4>
                  <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {rfi.contractor_proposed_solution}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response Section */}
          {rfi.response && (
            <div className="px-8 py-6 border-b border-gray-300 bg-blue-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Client Response</h3>
              <div className="text-gray-900 leading-relaxed whitespace-pre-wrap mb-4">
                {rfi.response}
              </div>
              {rfi.response_by && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Submitted by:</span> {rfi.response_by}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {rfi.attachment_files && rfi.attachment_files.length > 0 && (
            <div className="px-8 py-6">
              <h3 className="font-semibold text-gray-700 mb-4">Associated Reference Documents:</h3>
              <div className="border border-gray-300">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Document Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Size</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfi.attachment_files.map((attachment: any, index: number) => (
                      <tr key={attachment.id || index} className="border-b">
                        <td className="px-4 py-3 text-gray-900">{attachment.file_name}</td>
                        <td className="px-4 py-3 text-gray-600">{attachment.file_type || 'Unknown'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {attachment.file_size ? `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {attachment.created_at ? format(new Date(attachment.created_at), 'MM/dd/yyyy') : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 