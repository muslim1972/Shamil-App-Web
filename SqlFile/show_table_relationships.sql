-- سكربت لعرض العلاقات بين الجداول واعمدتها مع جداول اخرى واعمدتها
-- هذا السكربت يوفر معلومات مفصلة عن العلاقات بين الجداول في قاعدة البيانات

-- 1. عرض جميع العلاقات الرئيسية (Primary Keys)
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    kcu.column_name AS "عمود المفتاح الرئيسي",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_schema, tc.table_name;

-- 2. عرض جميع العلاقات الأجنبية (Foreign Keys)
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

-- 3. عرض العلاقات بشكل شامل
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول المصدر",
    kcu.column_name AS "عمود المفتاح الأجنبي",
    ccu.table_schema AS "المخطط الهدف",
    ccu.table_name AS "اسم الجدول الهدف",
    ccu.column_name AS "عمود المفتاح الهدف",
    tc.constraint_name AS "اسم القيد",
    CASE 
        WHEN rc.update_rule = 'CASCADE' THEN 'تحديث متسلسل'
        WHEN rc.update_rule = 'SET NULL' THEN 'تعيين NULL عند التحديث'
        WHEN rc.update_rule = 'SET DEFAULT' THEN 'تعيين القيمة الافتراضية عند التحديث'
        WHEN rc.update_rule = 'RESTRICT' THEN 'منع التحديث'
        WHEN rc.update_rule = 'NO ACTION' THEN 'لا فعل عند التحديث'
        ELSE rc.update_rule
    END AS "قاعدة التحديث",
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN 'حذف متسلسل'
        WHEN rc.delete_rule = 'SET NULL' THEN 'تعيين NULL عند الحذف'
        WHEN rc.delete_rule = 'SET DEFAULT' THEN 'تعيين القيمة الافتراضية عند الحذف'
        WHEN rc.delete_rule = 'RESTRICT' THEN 'منع الحذف'
        WHEN rc.delete_rule = 'NO ACTION' THEN 'لا فعل عند الحذف'
        ELSE rc.delete_rule
    END AS "قاعدة الحذف"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 4. عرض الجداول ذات العلاقات المباشرة
WITH relationships AS (
    SELECT 
        tc.table_schema AS source_schema,
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_schema AS target_schema,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column,
        tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
)
SELECT DISTINCT 
    r.source_schema AS "المخطط (Schema)",
    r.source_table AS "اسم الجدول",
    r.target_schema AS "المخطط الهدف",
    r.target_table AS "الجدول الهدف",
    COUNT(*) OVER (PARTITION BY r.source_schema, r.source_table) AS "عدد العلاقات",
    COUNT(*) OVER (PARTITION BY r.target_schema, r.target_table) AS "عدد الروابط"
FROM relationships r
ORDER BY r.source_schema, r.source_table, r.target_schema, r.target_table;

-- 5. عرض الجداول ذات العلاقات المتعددة
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    COUNT(*) AS "عدد العلاقات الأجنبية"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
GROUP BY tc.table_schema, tc.table_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, tc.table_schema, tc.table_name;

-- 6. عرض الجداول التي لها مفتاح رئيسي وعلاقات أجنبية
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    COUNT(DISTINCT CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 1 END) AS "عدد المفاتيح الرئيسية",
    COUNT(DISTINCT CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN 1 END) AS "عدد المفاتيح الأجنبية"
FROM information_schema.table_constraints tc
WHERE tc.table_schema NOT IN ('information_schema', 'pg_catalog')
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
GROUP BY tc.table_schema, tc.table_name
ORDER BY tc.table_schema, tc.table_name;
