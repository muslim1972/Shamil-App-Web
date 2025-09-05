-- This script updates the usernames for the 4 test users.

UPDATE public.users SET username = 'tester_one' WHERE email = 'testuser1@example.com';
UPDATE public.users SET username = 'tester_two' WHERE email = 'testuser2@example.com';
UPDATE public.users SET username = 'tester_three' WHERE email = 'testuser3@example.com';
UPDATE public.users SET username = 'tester_four' WHERE email = 'testuser4@example.com';

SELECT 'Usernames for the 4 test users have been updated successfully.' as result;
