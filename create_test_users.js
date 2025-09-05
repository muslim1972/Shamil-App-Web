// This script uses the Supabase client library to create test users.
// This is the recommended and safest way to create users.
// To run this script, open your terminal in the project root directory and type: node create_test_users.js

const { createClient } = require('@supabase/supabase-js');

// You need to manually enter your Supabase URL and Anon Key here
// You can find them in your Supabase project settings
const SUPABASE_URL = 'https://vrsuvebfqubzejpmoqqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testUsers = [
  {
    email: 'testuser1@example.com',
    password: 'password123456',
    options: { data: { username: 'tester_one' } }
  },
  {
    email: 'testuser2@example.com',
    password: 'password123456',
    options: { data: { username: 'tester_two' } }
  },
  {
    email: 'testuser3@example.com',
    password: 'password123456',
    options: { data: { username: 'tester_three' } }
  },
  {
    email: 'testuser4@example.com',
    password: 'password123456',
    options: { data: { username: 'tester_four' } }
  }
];

const createUsers = async () => {
  console.log('Starting user creation...');

  for (const user of testUsers) {
    const { data, error } = await supabase.auth.signUp(user);

    if (error) {
      console.error(`Failed to create user ${user.email}:`, error.message);
    } else if (data.user) {
      console.log(`Successfully created user ${data.user.email}`);
      // If you have email confirmation disabled, the user is created and logged in.
      // If email confirmation is enabled, an email is sent.
    } else {
      console.log(`User ${user.email} might already exist or requires confirmation.`);
    }
  }

  console.log('User creation process finished.');
};

createUsers();
