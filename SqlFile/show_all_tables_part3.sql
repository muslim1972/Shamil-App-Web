-- الجزء الثالث من سكربت لعرض جميع الجداول واعمدتها
-- هذا الجزء يركز على الفهارس والقيود الأخرى

-- 1. عرض الفهارس على الجداول (باستخدام pg_indexes فقط)
SELECT 
    schemaname AS "المخطط (Schema)",
    tablename AS "اسم الجدول",
    indexname AS "اسم الفهرس",
    indexdef AS "تعريف الفهرس"
FROM pg_indexes
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename, indexname;

-- 1.1. معلومات إحصائية عن الفهارس (إذا كانت متاحة)
SELECT 
    schemaname AS "المخطط (Schema)",
    relname AS "اسم الجدول",
    indexrelname AS "اسم الفهرس",
    idx_scan AS "عدد عمليات البحث",
    idx_tup_read AS "عدد الصفوف المقروءة",
    idx_tup_fetch AS "عدد الصفوف المسترجعة"
FROM pg_stat_all_indexes
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, relname, indexrelname;

-- 2. عرض قيود التحقق (CHECK constraints)
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    tc.constraint_name AS "اسم القيد",
    cc.check_clause AS "شرط التحقق"
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 3. عرض قيود الفريد (UNIQUE constraints)
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    tc.constraint_name AS "اسم القيد",
    kcu.column_name AS "اسم العمود"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position;
