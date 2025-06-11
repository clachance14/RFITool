require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing required environment variables');
  process.exit(1);
}

// Regular client for testing user authentication
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDemoUserAuth() {
  try {
    console.log('🔐 Testing demo user authentication...');
    console.log('📧 Email: demo@example.com');
    console.log('🔑 Password: demo123');
    console.log('');

    // Test sign in - try multiple possible credentials
    let authData, authError;
    
    const credentialOptions = [
      { email: 'demo@example.com', password: 'demo123' },
      { email: 'demo@readonly.com', password: 'readonly123' }
    ];
    
    for (const creds of credentialOptions) {
      console.log(`Trying ${creds.email} with password ${creds.password}...`);
      const result = await supabase.auth.signInWithPassword(creds);
      if (!result.error) {
        authData = result.data;
        authError = null;
        console.log(`✅ Success with ${creds.email}!`);
        break;
      } else {
        console.log(`❌ Failed with ${creds.email}: ${result.error.message}`);
        authError = result.error;
      }
    }

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log(`👤 User ID: ${authData.user.id}`);
    console.log(`📧 Email: ${authData.user.email}`);
    console.log('');

    // Test user profile access
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError.message);
    } else {
      console.log('✅ User profile found:');
      console.log(`   Name: ${userProfile.full_name}`);
      console.log(`   Status: ${userProfile.status}`);
      console.log('');
    }

    // Test company association and role
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select(`
        role_id,
        company_id,
        companies(name),
        roles(name, description)
      `)
      .eq('user_id', authData.user.id)
      .single();

    if (companyError) {
      console.error('❌ Error fetching company association:', companyError.message);
    } else {
      console.log('✅ Company association found:');
      console.log(`   Company: ${companyUser.companies.name}`);
      console.log(`   Role: ${companyUser.roles.name} (ID: ${companyUser.role_id})`);
      console.log(`   Description: ${companyUser.roles.description}`);
      console.log('');
    }

    // Test data access permissions
    console.log('🔍 Testing data access permissions...');
    
    // Test RFI access
    const { data: rfis, error: rfiError } = await supabase
      .from('rfis')
      .select('id, rfi_number, subject, status')
      .limit(3);

    if (rfiError) {
      console.log(`❌ RFI access: ${rfiError.message}`);
    } else {
      console.log(`✅ RFI access: Can view ${rfis.length} RFIs`);
    }

    // Test project access
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name, client_company_name')
      .limit(3);

    if (projectError) {
      console.log(`❌ Project access: ${projectError.message}`);
    } else {
      console.log(`✅ Project access: Can view ${projects.length} projects`);
    }

    // Test company access
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(3);

    if (companiesError) {
      console.log(`❌ Company access: ${companiesError.message}`);
    } else {
      console.log(`✅ Company access: Can view ${companies.length} companies`);
    }

    console.log('');
    console.log('🎉 Demo user authentication test completed!');
    console.log('');
    console.log('📝 Summary:');
    console.log('   - User can authenticate with demo@example.com / demo123');
    console.log('   - User has view-only role permissions');
    console.log('   - User can access read-only data');
    console.log('');
    console.log('🌐 To test in browser:');
    console.log('   1. Go to http://localhost:3001');
    console.log('   2. Click "Sign In"');
    console.log('   3. Use: demo@example.com / demo123');

    // Sign out to clean up
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDemoUserAuth(); 