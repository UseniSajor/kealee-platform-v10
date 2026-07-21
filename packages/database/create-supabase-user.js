// Script to create a user in Supabase Auth and link to database User record
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rkreqfpkxavqpsqexbfs.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwNzc3MCwiZXhwIjoyMDgzOTgzNzcwfQ.Q5KvqmDYy4yvLqDTTZxccFOpRcz3RivkS61XwD3w5GU';

// Database User ID from seed
const DATABASE_USER_ID = '4d5f5431-2c32-49a0-89f0-ad4ca4816303';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@kealee.com';
  const password = 'ChangeMe123!';

  console.log('Creating admin user in Supabase Auth...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Database User ID: ${DATABASE_USER_ID}`);

  try {
    // First, try to delete existing user if any (to reset)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('Found existing user, deleting...');
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('Existing user deleted.');
    }

    // Create new user with the same ID as the database User record
    const { data, error } = await supabase.auth.admin.createUser({
      id: DATABASE_USER_ID, // Link to database User record
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'System Administrator',
        role: 'admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error.message);
      process.exit(1);
    }

    console.log('User created successfully!');
    console.log('Supabase Auth User ID:', data.user.id);
    console.log('Database User ID:', DATABASE_USER_ID);
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('=========================\n');

    return data.user;
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

createAdminUser();
