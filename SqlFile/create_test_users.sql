-- This script creates 4 test users for the application.
-- It uses the auth.signup() function to ensure passwords are hashed correctly.

-- Test User 1
SELECT auth.signup(
    email := 'testuser1@example.com',
    password := 'password123',
    options := '{"data": {"username": "tester_one"}}'
);

-- Test User 2
SELECT auth.signup(
    email := 'testuser2@example.com',
    password := 'password123',
    options := '{"data": {"username": "tester_two"}}'
);

-- Test User 3
SELECT auth.signup(
    email := 'testuser3@example.com',
    password := 'password123',
    options := '{"data": {"username": "tester_three"}}'
);

-- Test User 4
SELECT auth.signup(
    email := 'testuser4@example.com',
    password := 'password123',
    options := '{"data": {"username": "tester_four"}}'
);

SELECT '4 test users have been created successfully.' as result;
