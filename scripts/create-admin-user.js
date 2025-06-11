// Script to create an admin user for the RFI tracking application
// Usage: node scripts/create-admin-user.js

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

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');

    // Check if we need to create a company first
    let companyId;
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companiesError) {
      console.error('❌ Error checking companies:', companiesError.message);
      return;
    }

    if (!companies || companies.length === 0) {
      // Create a default company
      console.log('📋 Creating default company...');
      const { data: newCompany, error: createCompanyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: 'Demo Company'
        })
        .select()
        .single();

      if (createCompanyError) {
        console.error('❌ Error creating company:', createCompanyError.message);
        return;
      }

      companyId = newCompany.id;
      console.log(`✅ Company created: ${newCompany.name} (${companyId})`);
    } else {
      companyId = companies[0].id;
      console.log(`📋 Using existing company: ${companies[0].name} (${companyId})`);
    }

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@demo.com',
      password: 'admin123',
      user_metadata: {
        full_name: 'Admin User',
        company_name: 'Demo Company'
      },
      email_confirm: true, // Skip email confirmation
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('ℹ️  Admin user already exists with email: admin@demo.com');
        console.log('📧 Email: admin@demo.com');
        console.log('🔑 Password: admin123');
        return;
      }
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
        email: 'admin@demo.com',
        full_name: 'Admin User',
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user profile:', userError.message);
      return;
    }

    console.log('✅ User profile created successfully');

    // Link user to company with admin role (role_id = 2)
    const { data: companyUserData, error: companyUserError } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: userId,
        company_id: companyId,
        role_id: 2 // admin role
      })
      .select()
      .single();

    if (companyUserError) {
      console.error('❌ Error linking user to company:', companyUserError.message);
      return;
    }

    console.log('✅ User linked to company with admin role');

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name: Admin User');
    console.log('🔒 Role: Admin (role_id: 2)');
    console.log('\n🚀 You can now log in with these credentials!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
createAdminUser(); 