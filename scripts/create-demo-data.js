require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoData() {
  try {
    console.log('🔍 Finding demo user...');
    
    // Find the demo user
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    
    const demoUser = authUser.users.find(user => user.email === 'demo@readonly.com');
    if (!demoUser) {
      console.error('❌ Demo user not found. Please create the demo user first.');
      process.exit(1);
    }
    
    console.log('✅ Found demo user:', demoUser.email);
    
    // Get demo user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id, companies(name)')
      .eq('user_id', demoUser.id)
      .single();
    
    if (companyError || !companyUser) {
      console.error('❌ Demo user company association not found');
      process.exit(1);
    }
    
    console.log('✅ Demo user company:', companyUser.companies.name);
    
    // Check if demo data already exists
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('company_id', companyUser.company_id);
    
    let createdProjects = existingProjects || [];
    
    if (!existingProjects || existingProjects.length === 0) {
      console.log('📝 Creating sample projects...');
      
      // Create sample projects
      const sampleProjects = [
        {
          project_name: 'Downtown Office Complex',
          contractor_job_number: 'DOC-2024-001',
          job_contract_number: 'CLIENT-DOC-789',
          client_company_name: 'Metro Development Corp',
          company_id: companyUser.company_id,
          created_by: demoUser.id,
          project_manager_contact: 'pm@metrodev.com',
          client_contact_name: 'Sarah Johnson',
          location: '123 Main Street, Downtown',
          project_type: 'mechanical',
          contract_value: 2500000,
          start_date: '2024-01-15',
          expected_completion: '2024-12-15',
          project_description: 'Construction of a 15-story office complex with modern HVAC and electrical systems.',
          default_urgency: 'non-urgent',
          standard_recipients: ['pm@metrodev.com', 'engineer@metrodev.com'],
          project_disciplines: ['HVAC', 'Electrical', 'Plumbing']
        },
        {
          project_name: 'Riverside Residential Tower',
          contractor_job_number: 'RRT-2024-002',
          job_contract_number: 'CLIENT-RRT-456',
          client_company_name: 'Riverside Properties LLC',
          company_id: companyUser.company_id,
          created_by: demoUser.id,
          project_manager_contact: 'manager@riverside.com',
          client_contact_name: 'Michael Chen',
          location: '456 River Road, Riverside District',
          project_type: 'civil',
          contract_value: 4200000,
          start_date: '2024-02-01',
          expected_completion: '2025-06-30',
          project_description: '25-story residential tower with luxury amenities and underground parking.',
          default_urgency: 'non-urgent',
          standard_recipients: ['manager@riverside.com', 'architect@riverside.com'],
          project_disciplines: ['Structural', 'HVAC', 'Electrical', 'Fire Safety']
        },
        {
          project_name: 'Industrial Warehouse Expansion',
          contractor_job_number: 'IWE-2024-003',
          job_contract_number: 'CLIENT-IWE-123',
          client_company_name: 'LogiCorp Industries',
          company_id: companyUser.company_id,
          created_by: demoUser.id,
          project_manager_contact: 'ops@logicorp.com',
          client_contact_name: 'David Rodriguez',
          location: '789 Industrial Blvd, Manufacturing District',
          project_type: 'ie',
          contract_value: 1800000,
          start_date: '2024-03-01',
          expected_completion: '2024-10-31',
          project_description: 'Expansion of existing warehouse facility with automated storage systems.',
          default_urgency: 'urgent',
          standard_recipients: ['ops@logicorp.com'],
          project_disciplines: ['Structural', 'Electrical', 'Automation']
        }
      ];
      
      const { data: newProjects, error: projectError } = await supabase
        .from('projects')
        .insert(sampleProjects)
        .select();
      
      if (projectError) throw projectError;
      
      createdProjects = newProjects;
      console.log(`✅ Created ${createdProjects.length} sample projects`);
    } else {
      console.log(`ℹ️ Found ${existingProjects.length} existing projects. Using existing projects for RFIs.`);
    }
    
    // Check if RFIs already exist for these projects
    const { data: existingRFIs } = await supabase
      .from('rfis')
      .select('id')
      .in('project_id', createdProjects.map(p => p.id));
    
    if (existingRFIs && existingRFIs.length > 0) {
      console.log(`ℹ️ Found ${existingRFIs.length} existing RFIs. Skipping RFI creation.`);
      return;
    }
    
    console.log('�� Creating sample RFIs...');
    
    // Create sample RFIs for each project
    const sampleRFIs = [
      // Downtown Office Complex RFIs
      {
        rfi_number: 'RFI-001',
        project_id: createdProjects[0].id,
        subject: 'HVAC System Specifications Clarification',
        reason_for_rfi: 'Need clarification on HVAC system specifications for floors 10-15',
        contractor_question: 'The drawings show conflicting information about the HVAC unit sizes for floors 10-15. Drawing M-100 shows 15-ton units while M-101 shows 20-ton units. Which specification should we follow?',
        contractor_proposed_solution: 'We recommend using 20-ton units as specified in M-101 for better efficiency and future capacity.',
        discipline: 'HVAC',
        system: 'Mechanical',
        work_impact: 'May delay HVAC installation by 1 week',
        cost_impact: '15000',
        schedule_impact: 'No significant schedule impact if resolved quickly',
        status: 'sent',
        urgency: 'non-urgent',
        created_by: demoUser.id,
        date_sent: new Date().toISOString()
      },
      {
        rfi_number: 'RFI-002',
        project_id: createdProjects[0].id,
        subject: 'Electrical Panel Location Conflict',
        reason_for_rfi: 'Electrical panel location conflicts with architectural elements',
        contractor_question: 'The electrical panel location shown on drawing E-200 conflicts with the decorative column shown on A-150. The panel cannot be installed as shown due to insufficient clearance.',
        contractor_proposed_solution: 'Relocate the electrical panel 3 feet to the east to avoid the column while maintaining code compliance.',
        discipline: 'Electrical',
        system: 'Power Distribution',
        work_impact: 'Minor rerouting of conduit required',
        cost_impact: '2500',
        schedule_impact: 'No schedule impact',
        status: 'responded',
        urgency: 'urgent',
        created_by: demoUser.id,
        date_sent: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        client_response: 'Approved. Please proceed with the proposed relocation. Updated drawings will be issued by end of week.',
        date_responded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Riverside Residential Tower RFIs
      {
        rfi_number: 'RFI-003',
        project_id: createdProjects[1].id,
        subject: 'Balcony Railing Height Requirements',
        reason_for_rfi: 'Clarification needed on balcony railing height for upper floors',
        contractor_question: 'The architectural drawings show 42" high railings for all balconies, but local building code requires 48" for balconies above 30 feet. Should we follow the drawings or code requirements?',
        contractor_proposed_solution: 'Install 48" railings on all balconies above the 8th floor to comply with local building codes.',
        discipline: 'Architectural',
        system: 'Building Envelope',
        work_impact: 'Affects all balcony installations above 8th floor',
        cost_impact: '25000',
        schedule_impact: 'No schedule impact if approved promptly',
        status: 'draft',
        urgency: 'urgent',
        created_by: demoUser.id
      },
      
      // Industrial Warehouse RFIs
      {
        rfi_number: 'RFI-004',
        project_id: createdProjects[2].id,
        subject: 'Crane Rail Foundation Details',
        reason_for_rfi: 'Missing foundation details for overhead crane rail system',
        contractor_question: 'The structural drawings do not include foundation details for the overhead crane rail system. We need specific anchor bolt patterns and foundation dimensions.',
        contractor_proposed_solution: 'Request detailed foundation drawings from the structural engineer showing anchor bolt layouts and concrete specifications.',
        discipline: 'Structural',
        system: 'Crane System',
        work_impact: 'Cannot proceed with crane rail installation',
        cost_impact: '0',
        schedule_impact: 'Potential 2-week delay if not resolved soon',
        status: 'overdue',
        urgency: 'urgent',
        created_by: demoUser.id,
        date_sent: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    const { data: createdRFIs, error: rfiError } = await supabase
      .from('rfis')
      .insert(sampleRFIs)
      .select();
    
    if (rfiError) throw rfiError;
    
    console.log(`✅ Created ${createdRFIs.length} sample RFIs`);
    
    console.log('🎉 Demo data creation completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${createdProjects.length} Projects created`);
    console.log(`   • ${createdRFIs.length} RFIs created`);
    console.log('');
    console.log('🔐 Demo user can now log in and view:');
    console.log('   • Projects with sample data');
    console.log('   • RFIs in various statuses');
    console.log('   • Workflow actions (disabled for read-only access)');
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error.message);
    process.exit(1);
  }
}

createDemoData(); 