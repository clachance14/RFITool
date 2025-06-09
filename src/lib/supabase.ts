// Mock Supabase implementation for development without database
const mockProjects = [
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

type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

export const supabase = {
  auth: {
    signIn: async (): Promise<SupabaseResponse<any>> => ({ data: null, error: null }),
    signOut: async (): Promise<{ error: { message: string } | null }> => ({ error: null }),
    getSession: async (): Promise<SupabaseResponse<{ session: any }>> => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: (columns: string): Promise<SupabaseResponse<any[]>> => {
      if (table === 'projects') {
        return Promise.resolve({ data: mockProjects, error: null });
      }
      return Promise.resolve({ data: [], error: null });
    },
    insert: (data: any): Promise<SupabaseResponse<any>> => {
      if (table === 'projects') {
        const newProject = {
          ...data,
          id: `PROJ-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockProjects.push(newProject);
        return Promise.resolve({ data: newProject, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    update: (): Promise<SupabaseResponse<any>> => Promise.resolve({ data: null, error: null }),
    delete: (): Promise<SupabaseResponse<any>> => Promise.resolve({ data: null, error: null }),
    eq: () => ({
      single: (): Promise<SupabaseResponse<any>> => Promise.resolve({ data: null, error: null }),
    }),
  }),
};

// Helper function to handle mock errors
export function handleSupabaseError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
} 