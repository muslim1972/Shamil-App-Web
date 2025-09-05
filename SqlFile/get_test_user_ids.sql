-- This query will get the IDs and emails of the test users.

SELECT id, email FROM public.users WHERE email LIKE 'testuser%@example.com';
