-- سكربت SQL لعرض جميع الجداول، الأعمدة، العلاقات، الدوال، والتريجرات في قاعدة بيانات PostgreSQL/Supabase

-- 1. عرض جميع الجداول وأعمدتها
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name, ordinal_position;

-- 2. عرض المفاتيح الأجنبية (العلاقات بين الجداول)
SELECT
    tc.table_schema, tc.table_name, kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 3. عرض جميع الدوال (functions)
SELECT routine_schema, routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY routine_schema, routine_name;

-- 4. عرض جميع التريجرات (triggers)
SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 5. عرض جميع الفهارس (اختياري)
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;

-- ملاحظة: نفذ هذا السكربت في SQL Editor في لوحة تحكم Supabase أو أي أداة PostgreSQL لديك.
