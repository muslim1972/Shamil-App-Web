-- This script extracts schema and RLS policies for the 'push_tokens' table.

-- 1. Get push_tokens Table and Columns
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
    t.table_schema = 'public' AND t.table_name = 'push_tokens'
ORDER BY
    t.table_name,
    c.ordinal_position;

-- 2. Get RLS Policies for push_tokens
SELECT
    n.nspname AS schemaname,
    c.relname AS tablename,
    p.polname AS policyname,
    CASE p.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS policy_for,
    pg_get_expr(p.polqual, p.polrelid) AS using_expression,
    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression
FROM
    pg_catalog.pg_policy p
JOIN
    pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN
    pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE
    n.nspname = 'public' AND c.relname = 'push_tokens';
