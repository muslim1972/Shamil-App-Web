-- سكربت مبسط لعرض الجداول الأساسية في قاعدة البيانات
-- تم تصميم هذا السكربت لتجنب مشاكل الاتصال الطويلة

-- 1. عرض جميع الجداول الأساسية
SELECT 
    table_schema AS "المخطط (Schema)",
    table_name AS "اسم الجدول",
    table_type AS "نوع الجدول"
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- 2. عرض الأعمدة للجدول conversations فقط (كمثال)
SELECT 
    column_name AS "اسم العمود",
    data_type AS "نوع البيانات",
    is_nullable AS "يمكن أن يكون NULL",
    column_default AS "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'conversations'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. عرض المفاتيح الأساسية
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    kcu.column_name AS "اسم العمود",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
    AND tc.table_schema = 'public'
ORDER BY tc.table_schema, tc.table_name;

-- 4. عرض المفاتيح الأجنبية
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول المصدر",
    kcu.column_name AS "عمود المفتاح الأجنبي",
    ccu.table_name AS "الجدول الهدف",
    ccu.column_name AS "عمود المفتاح الهدف",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
    AND tc.table_schema = 'public'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
