-- سكربت لعرض جميع الجداول واعمدتها وخصائص كل عمود
-- هذا السكربت يوفر معلومات مفصلة عن هيكل قاعدة البيانات

-- 1. عرض جميع الجداول في قاعدة البيانات
SELECT 
    table_schema AS "المخطط (Schema)",
    table_name AS "اسم الجدول",
    table_type AS "نوع الجدول"
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY table_schema, table_name;

-- 2. عرض أعمدة كل جدول مع خصائصها
SELECT 
    t.table_schema AS "المخطط (Schema)",
    t.table_name AS "اسم الجدول",
    c.column_name AS "اسم العمود",
    c.ordinal_position AS "الموقع",
    c.data_type AS "نوع البيانات",
    c.character_maximum_length AS "الطول الأقصى",
    c.numeric_precision AS "الدقة",
    c.numeric_scale AS "المقياس",
    c.is_nullable AS "يمكن أن يكون NULL",
    c.column_default AS "القيمة الافتراضية",
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'مفتاح رئيسي'
        WHEN fk.column_name IS NOT NULL THEN 'مفتاح أجنبي'
        ELSE ''
    END AS "نوع المفتاح",
    fk.table_name AS "الجدول المرتبط",
    fk.column_name AS "العمود المرتبط",
    c.udt_name AS "نوع البيانات الأصلي"
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
LEFT JOIN (
    SELECT ku.table_schema, ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_schema = pk.table_schema AND c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT 
        ku.table_schema, 
        ku.table_name, 
        ku.column_name,
        ku2.table_name AS referenced_table_name,
        ku2.column_name AS referenced_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name AND tc.table_schema = ku.table_schema
    JOIN information_schema.key_column_usage ku2 ON tc.constraint_name = ku2.constraint_name 
        AND tc.table_schema = ku2.table_schema 
        AND ku.ordinal_position = ku2.ordinal_position
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_schema = fk.table_schema AND c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- 3. عرض الفهارس على الجداول
SELECT 
    schemaname AS "المخطط (Schema)",
    tablename AS "اسم الجدول",
    indexname AS "اسم الفهرس",
    indexdef AS "تعريف الفهرس",
    idxscan AS "عدد عمليات البحث",
    idx_tup_read AS "عدد الصفوف المقروءة",
    idx_tup_fetch AS "عدد الصفوف المسترجعة"
FROM pg_indexes
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename, indexname;

-- 4. عرض قيود التحقق (CHECK constraints)
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

-- 5. عرض قيود الفريد (UNIQUE constraints)
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
