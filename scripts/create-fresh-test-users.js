// Create Fresh Test Users - New Email Domain
// Run with: node scripts/create-fresh-test-users.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// New test users with different email domain to avoid conflicts
const freshTestUsers = [
  { email: 'admin@testcompany.local', name: 'Test Admin User', role: 2 },
  { email: 'rfiuser@testcompany.local', name: 'Test RFI User', role: 3 },
  { email: 'client@testcompany.local', name: 'Test Client User', role: 5 },
  { email: 'viewer@testcompany.local', name: 'Test View User', role: 4 },
  { email: 'superadmin@testcompany.local', name: 'Test Super Admin', role: 1 }
];

async function createFreshUsers() {
  console.log('🆕 Creating fresh test users...\n');

  // First ensure we have a test company
  let testCompanyId;
  const { data: existingCompany } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('name', 'Test Company')
    .single();

  if (existingCompany) {
    testCompanyId = existingCompany.id;
    console.log('✅ Using existing Test Company');
  } else {
    const { data: newCompany, error } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Company' })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create company:', error.message);
      return;
    }
    testCompanyId = newCompany.id;
    console.log('✅ Created Test Company');
  }

  for (const user of freshTestUsers) {
    try {
      console.log(`Creating: ${user.email}...`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: 'TestPass123!',
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Auth error for ${user.email}:`, authError.message);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.name
        });

      if (profileError) {
        console.error(`❌ Profile error for ${user.email}:`, profileError.message);
        continue;
      }

      // Link to company
      const { error: linkError } = await supabaseAdmin
        .from('company_users')
        .insert({
          user_id: authData.user.id,
          company_id: testCompanyId,
          role_id: user.role
        });

      if (linkError) {
        console.error(`❌ Link error for ${user.email}:`, linkError.message);
        continue;
      }

      console.log(`✅ Created: ${user.email}`);

    } catch (err) {
      console.error(`❌ Error for ${user.email}:`, err.message);
    }
  }

  console.log('\n🎉 Fresh test users created!');
  console.log('\n📋 Login Credentials:');
  freshTestUsers.forEach(user => {
    console.log(`Email: ${user.email} | Password: TestPass123!`);
  });
}

// Check environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables. Check .env.local');
  process.exit(1);
}

createFreshUsers().catch(console.error); 