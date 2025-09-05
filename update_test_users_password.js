// This script updates the passwords for existing test users.
// It uses admin privileges (service_role key) to perform this action.
// WARNING: The service_role key is very powerful. Do not expose it publicly.
// To run this script, open your terminal in the project root directory and type: node update_test_users_password.js

const { createClient } = require('@supabase/supabase-js');

// --- SECURITY WARNING --- 
// Use your project URL and SERVICE_ROLE_KEY here.
// Do NOT commit this file with the key to version control.
const SUPABASE_URL = 'https://vrsuvebfqubzejpmoqqe.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUyMTM4MiwiZXhwIjoyMDcwMDk3MzgyfQ.QaM0x1PIcPDUDTVvxEx9D-wiDaCZKxQUEcYIS-DhoQU';

// Initialize the client with admin privileges
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const usersToUpdate = [
  { email: 'testuser1@example.com' },
  { email: 'testuser2@example.com' },
  { email: 'testuser3@example.com' },
  { email: 'testuser4@example.com' }
];

const newPassword = 'password123456';

const updateUserPasswords = async () => {
  console.log('Starting password update process...');

  for (const user of usersToUpdate) {
    try {
      // First, get the user by email to find their ID
      const { data: userData, error: getUserError } = await supabase.auth.admin.getUserByEmail(user.email);
      
      if (getUserError) {
        throw new Error(`Could not find user ${user.email}: ${getUserError.message}`);
      }

      const userId = userData.user.id;

      // Now, update the user by their ID
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        throw new Error(`Failed to update password for ${user.email}: ${updateError.message}`);
      }

      console.log(`Successfully updated password for ${updateData.user.email}`);

    } catch (error) {
      console.error(error.message);
    }
  }

  console.log('Password update process finished.');
};

updateUserPasswords();
