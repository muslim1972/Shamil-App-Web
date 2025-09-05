-- This script creates 4 test users for the application.
-- v2: Added explicit type casts to resolve the function signature error.

-- Test User 1
SELECT auth.signup(
    email := 'testuser1@example.com'::text,
    password := '123456'::text,
    options := '{"data": {"username": "tester_one"}}'::jsonb
);

-- Test User 2
SELECT auth.signup(
    email := 'testuser2@example.com'::text,
    password := '123456'::text,
    options := '{"data": {"username": "tester_two"}}'::jsonb
);

-- Test User 3
SELECT auth.signup(
    email := 'testuser3@example.com'::text,
    password := '123456'::text,
    options := '{"data": {"username": "tester_three"}}'::jsonb
);

-- Test User 4
SELECT auth.signup(
    email := 'testuser4@example.com'::text,
    password := '123456'::text,
    options := '{"data": {"username": "tester_four"}}'::jsonb
);

SELECT '4 test users have been created successfully.' as result;
