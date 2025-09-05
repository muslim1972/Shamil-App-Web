-- الجزء الثاني من سكربت لعرض جميع الجداول واعمدتها
-- هذا الجزء يركز على عرض المفاتيح والعلاقات

-- 1. عرض أعمدة كل جدول مع خصائصها (الجزء الثاني)
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
    c.column_default AS "القيمة الافتراضية"
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND t.table_type = 'BASE TABLE'
    AND c.ordinal_position > 10
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- 2. عرض المفاتيح الرئيسية
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    kcu.column_name AS "اسم العمود",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_schema, tc.table_name;

-- 3. عرض المفاتيح الأجنبية
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول المصدر",
    kcu.column_name AS "عمود المفتاح الأجنبي",
    ccu.table_schema AS "المخطط الهدف",
    ccu.table_name AS "اسم الجدول الهدف",
    ccu.column_name AS "عمود المفتاح الهدف",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
