-- سكربت مبسط لعرض العلاقات بين الجداول في قاعدة البيانات
-- تم تصميم هذا السكربت لتجنب مشاكل الاتصال الطويلة

-- 1. عرض جميع العلاقات في مخطط public
-- المفاتيح الرئيسية
SELECT 
    tc.table_schema AS "المخطط (Schema)",
    tc.table_name AS "اسم الجدول",
    kcu.column_name AS "عمود المفتاح الرئيسي",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_schema, tc.table_name;

-- 2. المفاتيح الأجنبية
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
    AND tc.table_schema = 'public'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 3. عرض العلاقات المتعلقة بالمحادثات والرسائل
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
    AND tc.table_schema = 'public'
    AND (
        tc.table_name IN ('conversations', 'messages', 'users', 'profiles', 'user_conversation_settings')
        OR ccu.table_name IN ('conversations', 'messages', 'users', 'profiles', 'user_conversation_settings')
    )
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 4. عرض العلاقات المتعلقة بالمستخدمين
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
    AND tc.table_schema = 'public'
    AND (
        tc.table_name = 'users'
        OR ccu.table_name = 'users'
    )
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
