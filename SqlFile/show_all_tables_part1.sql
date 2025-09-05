-- الجزء الأول من سكربت لعرض جميع الجداول واعمدتها
-- هذا الجزء يركز على عرض الجداول الأساسية والأعمدة

-- 1. عرض جميع الجداول في قاعدة البيانات
SELECT 
    table_schema AS "المخطط (Schema)",
    table_name AS "اسم الجدول",
    table_type AS "نوع الجدول"
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY table_schema, table_name;

-- 2. عرض أعمدة كل جدول مع خصائصها (الجزء الأول)
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
    AND c.ordinal_position <= 10
ORDER BY t.table_schema, t.table_name, c.ordinal_position;
