-- This script updates the usernames for the 4 test users in BOTH the public.users and auth.users tables.

-- Part 1: Update the public.users table (for the app to use)
UPDATE public.users SET username = 'tester_one' WHERE email = 'testuser1@example.com';
UPDATE public.users SET username = 'tester_two' WHERE email = 'testuser2@example.com';
UPDATE public.users SET username = 'tester_three' WHERE email = 'testuser3@example.com';
UPDATE public.users SET username = 'tester_four' WHERE email = 'testuser4@example.com';

-- Part 2: Update the auth.users table (for data consistency)
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"username": "tester_one"}'::jsonb WHERE email = 'testuser1@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"username": "tester_two"}'::jsonb WHERE email = 'testuser2@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"username": "tester_three"}'::jsonb WHERE email = 'testuser3@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"username": "tester_four"}'::jsonb WHERE email = 'testuser4@example.com';

SELECT 'Usernames for the 4 test users have been updated successfully in both tables.' as result;
