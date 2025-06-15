// Reset Test User Passwords using Supabase Admin SDK
// Run with: node scripts/create-e2e-test-users.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testUsers = [
  { email: 'sarah.pm@icsconst.com', name: 'Sarah Johnson' },
  { email: 'mike.rfi@icsconst.com', name: 'Mike Chen' },
  { email: 'alex@metrodev.com', name: 'Alex Rodriguez' },
  { email: 'emma.view@icsconst.com', name: 'Emma Davis' },
  { email: 'jordan.admin@icsconst.com', name: 'Jordan Smith' }
];

async function resetTestUserPasswords() {
  console.log('🔄 Resetting passwords for test users...\n');

  for (const user of testUsers) {
    try {
      // Get the user by email first
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error(`❌ Error listing users:`, listError.message);
        continue;
      }

      const existingUser = existingUsers.users.find(u => u.email === user.email);
      
      if (!existingUser) {
        console.log(`⚠️ User ${user.email} not found in auth, skipping...`);
        continue;
      }

      // Update the user's password
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: 'TestPass123!',
          email_confirm: true
        }
      );

      if (error) {
        console.error(`❌ Error updating password for ${user.email}:`, error.message);
      } else {
        console.log(`✅ Password reset for ${user.email} (${user.name})`);
      }

    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err.message);
    }
  }

  console.log('\n🎯 Password reset complete!');
  console.log('\n📋 Test Credentials:');
  testUsers.forEach(user => {
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: TestPass123!`);
    console.log('');
  });
}

// Check if we have the required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure your .env.local file is properly configured.');
  process.exit(1);
}

resetTestUserPasswords().catch(console.error); 