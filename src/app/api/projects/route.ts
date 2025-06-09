import { NextRequest, NextResponse } from 'next/server';
import { createProjectSchema } from '@/lib/validations';
import { Project } from '@/lib/types';

// Mock projects array (in a real app, this would be database)
let mockProjects: any[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_name: 'Downtown Office Building',
    job_contract_number: 'CN-2024-001',
    client_company_name: 'ABC Development Corp',
    project_manager_contact: 'pm@client.com',
    location: '123 Main St, Downtown',
    project_type: 'mechanical',
    contract_value: 500000,
    start_date: '2024-01-15',
    expected_completion: '2024-12-31',
    project_description: 'Construction of a 20-story office building with modern amenities',
    default_urgency: 'non-urgent',
    standard_recipients: ['pm@client.com', 'supervisor@contractor.com'],
    project_disciplines: ['HVAC', 'Electrical', 'Plumbing'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '987f6543-d21c-43b2-a987-654321098765',
    project_name: 'Highway Bridge Renovation',
    job_contract_number: 'BR-2024-002',
    client_company_name: 'State Transportation Dept',
    project_manager_contact: 'engineering@state.gov',
    location: 'Highway 101, Mile Marker 45',
    project_type: 'civil',
    contract_value: 1200000,
    start_date: '2024-03-01',
    expected_completion: '2024-11-30',
    project_description: 'Complete renovation and reinforcement of aging highway bridge',
    default_urgency: 'urgent',
    standard_recipients: ['engineering@state.gov', 'safety@contractor.com'],
    project_disciplines: ['Structural', 'Civil'],
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z'
  }
];

export async function GET() {
  try {
    console.log('📥 GET /api/projects - Fetching projects');
    return NextResponse.json({
      success: true,
      data: mockProjects
    });
  } catch (error) {
    console.error('❌ GET /api/projects - Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('📡 API: Received POST request to /api/projects');
  try {
    const body = await request.json();
    console.log('📡 API: Request body:', body);

    // Validate input
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      console.error('❌ API: Validation error:', result.error);
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.errors },
        { status: 400 }
      );
    }

    const projectData = result.data;
    console.log('✅ API: Validated project data:', projectData);

    // Create new project
    const newProject: Project = {
      id: `PROJ-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project_disciplines: projectData.project_disciplines || [],
      ...projectData
    };

    console.log('✅ API: Created new project:', newProject);
    mockProjects.push(newProject);
    console.log('✅ API: Added project to mock database');

    return NextResponse.json({ success: true, data: newProject });
  } catch (error) {
    console.error('❌ API: Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 