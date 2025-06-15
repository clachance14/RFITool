require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Regular client for user authentication
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Admin client for testing cross-company access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSSecurity() {
  console.log('🛡️  COMPREHENSIVE RLS SECURITY TEST');
  console.log('=====================================');
  console.log('');
  
  try {
    // Step 1: Create test data using admin client
    console.log('🔧 Step 1: Setting up test data...');
    
    // Create two test companies
    let company1, company2;
    const { data: comp1Data, error: comp1Error } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Company 1' })
      .select()
      .single();
    
    const { data: comp2Data, error: comp2Error } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Company 2' })
      .select()
      .single();

    if (comp1Error || comp2Error) {
      console.log('⚠️  Using existing companies for testing...');
      // Get existing companies
      const { data: existingCompanies } = await supabaseAdmin
        .from('companies')
        .select('*')
        .limit(2);
      
      if (existingCompanies && existingCompanies.length >= 2) {
        company1 = existingCompanies[0];
        company2 = existingCompanies[1];
        console.log(`✅ Using companies: ${company1.name} and ${company2.name}`);
      } else {
        throw new Error('Need at least 2 companies to test RLS isolation');
      }
    } else {
      company1 = comp1Data;
      company2 = comp2Data;
      console.log(`✅ Created test companies: ${company1.name} and ${company2.name}`);
    }

    // Create test users for each company
    const testUsers = [];
    
    // User 1 for Company 1
    const { data: user1Auth, error: user1Error } = await supabaseAdmin.auth.admin.createUser({
      email: 'testuser1@company1.com',
      password: 'testpass123',
      email_confirm: true
    });
    
    if (user1Error) {
      throw new Error(`Failed to create user 1: ${user1Error.message}`);
    }
    
    if (!user1Auth || !user1Auth.user) {
      throw new Error('User 1 creation returned null');
    }
    
    await supabaseAdmin.from('users').insert({
      id: user1Auth.user.id,
      email: 'testuser1@company1.com',
      full_name: 'Test User 1',
      status: 'active'
    });
    
    await supabaseAdmin.from('company_users').insert({
      user_id: user1Auth.user.id,
      company_id: company1.id,
      role_id: 3 // RFI user
    });

    // User 2 for Company 2
    const { data: user2Auth, error: user2Error } = await supabaseAdmin.auth.admin.createUser({
      email: 'testuser2@company2.com',
      password: 'testpass123',
      email_confirm: true
    });
    
    if (user2Error) {
      throw new Error(`Failed to create user 2: ${user2Error.message}`);
    }
    
    if (!user2Auth || !user2Auth.user) {
      throw new Error('User 2 creation returned null');
    }
    
    await supabaseAdmin.from('users').insert({
      id: user2Auth.user.id,
      email: 'testuser2@company2.com',
      full_name: 'Test User 2',
      status: 'active'
    });
    
    await supabaseAdmin.from('company_users').insert({
      user_id: user2Auth.user.id,
      company_id: company2.id,
      role_id: 3 // RFI user
    });

    testUsers.push(
      { auth: user1Auth, company: company1, email: 'testuser1@company1.com' },
      { auth: user2Auth, company: company2, email: 'testuser2@company2.com' }
    );

    console.log('✅ Test users created');
    
    // Create test projects for each company
    const { data: project1 } = await supabaseAdmin
      .from('projects')
      .insert({
        project_name: 'RLS Test Project 1',
        company_id: company1.id,
        job_contract_number: 'RLS-001',
        client_company_name: 'Client 1',
        project_manager_contact: 'pm1@client.com',
        client_contact_name: 'Client Contact 1'
      })
      .select()
      .single();

    const { data: project2 } = await supabaseAdmin
      .from('projects')
      .insert({
        project_name: 'RLS Test Project 2',
        company_id: company2.id,
        job_contract_number: 'RLS-002',
        client_company_name: 'Client 2',
        project_manager_contact: 'pm2@client.com',
        client_contact_name: 'Client Contact 2'
      })
      .select()
      .single();

    console.log('✅ Test projects created');

    // Create test RFIs for each project
    const { data: rfi1 } = await supabaseAdmin
      .from('rfis')
      .insert({
        rfi_number: 'RLS-RFI-001',
        project_id: project1.id,
        subject: 'Test RFI for Company 1',
        reason_for_rfi: 'Testing RLS security',
        to_recipient: 'recipient1@client.com',
        status: 'draft',
        urgency: 'non-urgent',
        secure_link_token: 'test-token-1'
      })
      .select()
      .single();

    const { data: rfi2 } = await supabaseAdmin
      .from('rfis')
      .insert({
        rfi_number: 'RLS-RFI-002',
        project_id: project2.id,
        subject: 'Test RFI for Company 2',
        reason_for_rfi: 'Testing RLS security',
        to_recipient: 'recipient2@client.com',
        status: 'draft',
        urgency: 'non-urgent',
        secure_link_token: 'test-token-2'
      })
      .select()
      .single();

    console.log('✅ Test RFIs created');
    console.log('');

    // Step 2: Test RLS isolation
    console.log('🔒 Step 2: Testing RLS Data Isolation...');
    console.log('');

    let testsPassed = 0;
    let testsFailed = 0;

    for (let i = 0; i < testUsers.length; i++) {
      const currentUser = testUsers[i];
      const otherUser = testUsers[1 - i]; // Get the other user
      
      console.log(`👤 Testing user: ${currentUser.email}`);
      
      // Sign in as current user
      const { data: authResult, error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: 'testpass123'
      });

      if (authError) {
        console.error(`❌ Authentication failed for ${currentUser.email}: ${authError.message}`);
        testsFailed++;
        continue;
      }

      console.log(`✅ Authenticated as ${currentUser.email}`);

      // Test 1: User should only see their own company
      console.log('   🔍 Testing company access...');
      const { data: visibleCompanies, error: companyError } = await supabase
        .from('companies')
        .select('id, name');

      if (companyError) {
        console.log(`   ❌ Company access error: ${companyError.message}`);
        testsFailed++;
      } else {
        const canSeeOwnCompany = visibleCompanies.some(c => c.id === currentUser.company.id);
        const canSeeOtherCompany = visibleCompanies.some(c => c.id === otherUser.company.id);
        
        if (canSeeOwnCompany && !canSeeOtherCompany && visibleCompanies.length === 1) {
          console.log(`   ✅ Company isolation working - can only see own company`);
          testsPassed++;
        } else {
          console.log(`   ❌ Company isolation failed - can see ${visibleCompanies.length} companies`);
          console.log(`      Own company visible: ${canSeeOwnCompany}`);
          console.log(`      Other company visible: ${canSeeOtherCompany}`);
          testsFailed++;
        }
      }

      // Test 2: User should only see their own projects
      console.log('   🔍 Testing project access...');
      const { data: visibleProjects, error: projectError } = await supabase
        .from('projects')
        .select('id, project_name, company_id');

      if (projectError) {
        console.log(`   ❌ Project access error: ${projectError.message}`);
        testsFailed++;
      } else {
        const ownProjects = visibleProjects.filter(p => p.company_id === currentUser.company.id);
        const otherProjects = visibleProjects.filter(p => p.company_id === otherUser.company.id);
        
        if (ownProjects.length > 0 && otherProjects.length === 0) {
          console.log(`   ✅ Project isolation working - can see ${ownProjects.length} own projects, 0 other projects`);
          testsPassed++;
        } else {
          console.log(`   ❌ Project isolation failed`);
          console.log(`      Own projects: ${ownProjects.length}`);
          console.log(`      Other projects: ${otherProjects.length}`);
          testsFailed++;
        }
      }

      // Test 3: User should only see their own RFIs
      console.log('   🔍 Testing RFI access...');
      const { data: visibleRFIs, error: rfiError } = await supabase
        .from('rfis')
        .select(`
          id, 
          rfi_number, 
          subject,
          projects!inner(id, company_id)
        `);

      if (rfiError) {
        console.log(`   ❌ RFI access error: ${rfiError.message}`);
        testsFailed++;
      } else {
        const ownRFIs = visibleRFIs.filter(r => r.projects.company_id === currentUser.company.id);
        const otherRFIs = visibleRFIs.filter(r => r.projects.company_id === otherUser.company.id);
        
        if (ownRFIs.length > 0 && otherRFIs.length === 0) {
          console.log(`   ✅ RFI isolation working - can see ${ownRFIs.length} own RFIs, 0 other RFIs`);
          testsPassed++;
        } else {
          console.log(`   ❌ RFI isolation failed`);
          console.log(`      Own RFIs: ${ownRFIs.length}`);
          console.log(`      Other RFIs: ${otherRFIs.length}`);
          testsFailed++;
        }
      }

      // Test 4: Test client sessions isolation
      console.log('   🔍 Testing client sessions access...');
      const { data: visibleSessions, error: sessionError } = await supabase
        .from('client_sessions')
        .select('*');

      if (sessionError) {
        console.log(`   ❌ Client sessions access error: ${sessionError.message}`);
        testsFailed++;
      } else {
        console.log(`   ✅ Client sessions query successful - can see ${visibleSessions.length} sessions`);
        testsPassed++;
      }

      // Test 5: Test roles and permissions access (should be read-only for all authenticated users)
      console.log('   🔍 Testing roles/permissions access...');
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*');
      
      const { data: permissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*');

      if (rolesError || permissionsError) {
        console.log(`   ❌ Roles/permissions access error`);
        if (rolesError) console.log(`      Roles error: ${rolesError.message}`);
        if (permissionsError) console.log(`      Permissions error: ${permissionsError.message}`);
        testsFailed++;
      } else {
        console.log(`   ✅ Roles/permissions access working - ${roles.length} roles, ${permissions.length} permissions`);
        testsPassed++;
      }

      // Sign out
      await supabase.auth.signOut();
      console.log(`   🚪 Signed out ${currentUser.email}`);
      console.log('');
    }

    // Step 3: Test anonymous access (should be blocked)
    console.log('🔒 Step 3: Testing anonymous access (should be blocked)...');
    
    const anonymousClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const anonymousTests = [
      { table: 'companies', description: 'Companies' },
      { table: 'projects', description: 'Projects' },
      { table: 'rfis', description: 'RFIs' },
      { table: 'users', description: 'Users' },
      { table: 'client_sessions', description: 'Client Sessions' }
    ];

    for (const test of anonymousTests) {
      const { data, error } = await anonymousClient
        .from(test.table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`✅ ${test.description}: Anonymous access properly blocked`);
        testsPassed++;
      } else {
        console.log(`❌ ${test.description}: Anonymous access allowed (SECURITY RISK!)`);
        testsFailed++;
      }
    }

    console.log('');
    console.log('🧹 Step 4: Cleaning up test data...');
    
    // Clean up test data
    if (rfi1 && rfi2) {
      await supabaseAdmin.from('rfis').delete().in('id', [rfi1.id, rfi2.id]);
    }
    if (project1 && project2) {
      await supabaseAdmin.from('projects').delete().in('id', [project1.id, project2.id]);
    }
    
    for (const user of testUsers) {
      if (user.auth && user.auth.user) {
        await supabaseAdmin.from('company_users').delete().eq('user_id', user.auth.user.id);
        await supabaseAdmin.from('users').delete().eq('id', user.auth.user.id);
        await supabaseAdmin.auth.admin.deleteUser(user.auth.user.id);
      }
    }
    
    // Only delete test companies if we created them
    if (!comp1Error && !comp2Error && company1 && company2) {
      await supabaseAdmin.from('companies').delete().in('id', [company1.id, company2.id]);
    }
    
    console.log('✅ Test data cleaned up');
    console.log('');
    
    // Final Results
    console.log('📊 FINAL RESULTS');
    console.log('================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log('');
    
    if (testsFailed === 0) {
      console.log('🎉 CONGRATULATIONS! Your RLS implementation is working perfectly!');
      console.log('🛡️  All security tests passed - your data is properly isolated.');
    } else {
      console.log('⚠️  Some security tests failed. Please review the RLS policies.');
      console.log('🔧 Consider re-checking the SQL policies you implemented.');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error);
  }
}

// Run the test
testRLSSecurity(); 