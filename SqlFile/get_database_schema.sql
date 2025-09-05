-- This script will extract the schema of the public tables, including columns, functions, and RLS policies.

-- 1. Get Tables and Columns
SELECT
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type
FROM
    information_schema.tables t
JOIN
    information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE
    t.table_schema = 'public'
ORDER BY
    t.table_name,
    c.ordinal_position;

-- 2. Get Functions (Routines)
SELECT
    r.routine_name,
    r.routine_type,
    r.specific_name,
    r.data_type AS return_type,
    p.parameter_name,
    p.data_type AS parameter_type
FROM
    information_schema.routines r
LEFT JOIN
    information_schema.parameters p ON r.specific_name = p.specific_name
WHERE
    r.specific_schema = 'public'
ORDER BY
    r.routine_name,
    p.ordinal_position;

-- 3. Get RLS Policies
SELECT
    p.schemaname,
    p.tablename,
    p.policyname,
    p.cmd AS policy_for,
    p.qual AS using_expression,
    p.with_check AS with_check_expression
FROM
    pg_catalog.pg_policy p
WHERE
    p.schemaname = 'public';

-- 4. Get Constraints (Primary Keys, Foreign Keys, etc.)
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
JOIN
    information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
LEFT JOIN
    information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE
    tc.table_schema = 'public';
