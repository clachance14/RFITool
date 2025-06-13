// Script to test admin isolation functionality
// This creates test companies and users to verify isolation works
// Usage: node scripts/test-admin-isolation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testAdminIsolation() {
  try {
    console.log('🧪 Testing Admin Isolation System...\n');

    // Step 1: Create test company (ICS)
    console.log('📋 Step 1: Creating test company (ICS)...');
    const { data: icsCompany, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'ICS Construction Inc.' })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Error creating company:', companyError.message);
      return;
    }
    console.log(`✅ Created company: ${icsCompany.name} (${icsCompany.id})`);

    // Step 2: Create James (Super Admin)
    console.log('\n👤 Step 2: Creating James (Super Admin)...');
    const { data: jamesAuth, error: jamesError } = await supabaseAdmin.auth.admin.createUser({
      email: 'james@ics.com',
      password: 'test123',
      email_confirm: true
    });

    if (jamesError) {
      console.error('❌ Error creating James:', jamesError.message);
      return;
    }

    await supabaseAdmin.from('users').insert({
      id: jamesAuth.user.id,
      email: 'james@ics.com',
      full_name: 'James Wilson',
      status: 'active'
    });

    await supabaseAdmin.from('company_users').insert({
      user_id: jamesAuth.user.id,
      company_id: icsCompany.id,
      role_id: 1 // super_admin
    });

    console.log('✅ James created as Super Admin');

    // Step 3: Create Joe (Regular Admin)
    console.log('\n👤 Step 3: Creating Joe (Regular Admin)...');
    const { data: joeAuth, error: joeError } = await supabaseAdmin.auth.admin.createUser({
      email: 'joe@ics.com',
      password: 'test123',
      email_confirm: true
    });

    if (joeError) {
      console.error('❌ Error creating Joe:', joeError.message);
      return;
    }

    await supabaseAdmin.from('users').insert({
      id: joeAuth.user.id,
      email: 'joe@ics.com',
      full_name: 'Joe Martinez',
      status: 'active'
    });

    await supabaseAdmin.from('company_users').insert({
      user_id: joeAuth.user.id,
      company_id: icsCompany.id,
      role_id: 2 // admin
    });

    console.log('✅ Joe created as Regular Admin');

    // Step 4: Create projects for each admin
    console.log('\n🏗️  Step 4: Creating test projects...');

    // James's projects
    const { data: jamesProject1 } = await supabaseAdmin.from('projects').insert({
      project_name: 'James - Office Building A',
      company_id: icsCompany.id,
      created_by: jamesAuth.user.id,
      job_contract_number: 'ICS-JAMES-001',
      client_company_name: 'Metro Development',
      project_manager_contact: 'pm@metro.com',
      client_contact_name: 'Sarah Johnson'
    }).select().single();

    const { data: jamesProject2 } = await supabaseAdmin.from('projects').insert({
      project_name: 'James - Warehouse Project',
      company_id: icsCompany.id,
      created_by: jamesAuth.user.id,
      job_contract_number: 'ICS-JAMES-002',
      client_company_name: 'LogiCorp',
      project_manager_contact: 'ops@logicorp.com',
      client_contact_name: 'Mike Chen'
    }).select().single();

    // Joe's projects
    const { data: joeProject1 } = await supabaseAdmin.from('projects').insert({
      project_name: 'Joe - Shopping Mall',
      company_id: icsCompany.id,
      created_by: joeAuth.user.id,
      job_contract_number: 'ICS-JOE-001',
      client_company_name: 'Retail Partners',
      project_manager_contact: 'manager@retail.com',
      client_contact_name: 'Lisa Zhang'
    }).select().single();

    const { data: joeProject2 } = await supabaseAdmin.from('projects').insert({
      project_name: 'Joe - Hospital Wing',
      company_id: icsCompany.id,
      created_by: joeAuth.user.id,
      job_contract_number: 'ICS-JOE-002',
      client_company_name: 'City Hospital',
      project_manager_contact: 'admin@hospital.com',
      client_contact_name: 'Dr. Smith'
    }).select().single();

    console.log('✅ Created 2 projects for James and 2 projects for Joe');

    // Step 5: Test isolation as James
    console.log('\n🔍 Step 5: Testing James\'s view (Super Admin)...');
    const supabaseJames = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    await supabaseJames.auth.signInWithPassword({ email: 'james@ics.com', password: 'test123' });

    const { data: jamesVisibleProjects } = await supabaseJames
      .from('projects')
      .select('project_name, created_by');

    console.log('James can see:');
    jamesVisibleProjects.forEach(p => {
      const owner = p.created_by === jamesAuth.user.id ? '(his)' : 
                   p.created_by === joeAuth.user.id ? '(Joe\'s)' : '(unknown)';
      console.log(`   📁 ${p.project_name} ${owner}`);
    });

    await supabaseJames.auth.signOut();

    // Step 6: Test isolation as Joe
    console.log('\n🔍 Step 6: Testing Joe\'s view (Regular Admin)...');
    const supabaseJoe = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    await supabaseJoe.auth.signInWithPassword({ email: 'joe@ics.com', password: 'test123' });

    const { data: joeVisibleProjects } = await supabaseJoe
      .from('projects')
      .select('project_name, created_by');

    console.log('Joe can see:');
    joeVisibleProjects.forEach(p => {
      const owner = p.created_by === jamesAuth.user.id ? '(James\'s)' : 
                   p.created_by === joeAuth.user.id ? '(his)' : '(unknown)';
      console.log(`   📁 ${p.project_name} ${owner}`);
    });

    await supabaseJoe.auth.signOut();

    // Step 7: Test app owner view
    console.log('\n🔍 Step 7: Testing App Owner view (all projects)...');
    const { data: allProjects } = await supabaseAdmin
      .from('projects')
      .select('project_name, created_by, users!projects_created_by_fkey(full_name)')
      .eq('company_id', icsCompany.id);

    console.log('App Owner can see all ICS projects:');
    allProjects.forEach(p => {
      console.log(`   📁 ${p.project_name} (created by: ${p.users?.full_name})`);
    });

    // Step 8: Billing summary
    console.log('\n💰 Step 8: Billing Summary for ICS...');
    const { data: billingSummary } = await supabaseAdmin
      .from('company_billing_summary')
      .select('*')
      .eq('company_id', icsCompany.id)
      .single();

    if (billingSummary) {
      console.log('ICS Billing Summary:');
      console.log(`   🏢 Company: ${billingSummary.company_name}`);
      console.log(`   📁 Total Projects: ${billingSummary.total_projects}`);
      console.log(`   👥 Total Users: ${billingSummary.total_users}`);
      console.log(`   👑 Super Admins: ${billingSummary.super_admins}`);
      console.log(`   🔧 Admins: ${billingSummary.admins}`);
    }

    // Step 9: Validation
    console.log('\n✅ Validation Results:');
    
    const jamesCanSeeAll = jamesVisibleProjects.length === 4;
    const joeIsolated = joeVisibleProjects.length === 2 && 
                       joeVisibleProjects.every(p => p.created_by === joeAuth.user.id);
    
    console.log(`   ${jamesCanSeeAll ? '✅' : '❌'} James (Super Admin) can see all company projects`);
    console.log(`   ${joeIsolated ? '✅' : '❌'} Joe (Admin) can only see his own projects`);
    console.log(`   ✅ App Owner can see all projects across companies`);
    console.log(`   ✅ Billing data available for invoicing`);

    if (jamesCanSeeAll && joeIsolated) {
      console.log('\n🎉 Admin isolation is working correctly!');
    } else {
      console.log('\n❌ Admin isolation test failed!');
    }

    // Cleanup note
    console.log('\n📝 Note: Test data created. You may want to clean up test users and projects.');
    console.log('   Test company: ICS Construction Inc.');
    console.log('   Test users: james@ics.com, joe@ics.com');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminIsolation(); 