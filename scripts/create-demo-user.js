// Script to create a demo read-only user for demonstration purposes
// Usage: node scripts/create-demo-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Admin client with elevated permissions
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUser() {
  try {
    console.log('🚀 Creating demo read-only user...');

    // First, get the first company in the database to associate the user with
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Error: No companies found in database');
      console.error('   Please create at least one company first');
      return;
    }

    const companyId = companies[0].id;
    console.log(`📋 Using company: ${companies[0].name} (${companyId})`);

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'demo@readonly.com',
      password: 'readonly123',
      user_metadata: {
        full_name: 'Demo Read-Only User',
        company_name: companies[0].name
      },
      email_confirm: true, // Skip email confirmation
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created with ID: ${userId}`);

    // Create user profile in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: 'demo@readonly.com',
        full_name: 'Demo Read-Only User',
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user profile:', userError.message);
      return;
    }

    console.log('✅ User profile created successfully');

    // Link user to company with view_only role (role_id = 4)
    const { data: companyUserData, error: companyUserError } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: userId,
        company_id: companyId,
        role_id: 4 // view_only role
      })
      .select()
      .single();

    if (companyUserError) {
      console.error('❌ Error linking user to company:', companyUserError.message);
      return;
    }

    console.log('✅ User linked to company with view_only role');

    // Verify the setup
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        status,
        company_users!inner(
          company_id,
          role_id,
          companies(name)
        )
      `)
      .eq('email', 'demo@readonly.com')
      .single();

    if (verifyError) {
      console.error('❌ Error verifying user setup:', verifyError.message);
      return;
    }

    console.log('\n🎉 Demo user created successfully!');
    console.log('📧 Email: demo@readonly.com');
    console.log('🔑 Password: readonly123');
    console.log('👤 Name: Demo Read-Only User');
    console.log('🏢 Company:', verification.company_users.companies.name);
    console.log('🔒 Role: View Only (role_id: 4)');
    console.log('\n📝 This user can:');
    console.log('   ✅ View all RFIs and projects');
    console.log('   ✅ Navigate through the application');
    console.log('   ❌ Create new RFIs');
    console.log('   ❌ Edit projects');
    console.log('   ❌ Access admin features');
    console.log('\n🚀 You can now share these credentials for demo purposes!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
createDemoUser(); 