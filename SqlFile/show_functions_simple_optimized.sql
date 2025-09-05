-- سكربت محسّن ومبسط لعرض الدوال في قاعدة البيانات
-- تم تصميم هذا السكربت لتجنب مشاكل الاتصال الطويلة

-- 1. عرض جميع الدوال في مخطط public (باستخدام استعلام مبسط)
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prorettype <> 0
ORDER BY n.nspname, p.proname;

-- 2. عرض الدوال الرئيسية في المشروع (باستخدام استعلام مبسط)
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات",
    CASE 
        WHEN p.proname LIKE '%auth%' THEN 'متعلقة بالمصادقة'
        WHEN p.proname LIKE '%user%' THEN 'متعلقة بالمستخدمين'
        WHEN p.proname LIKE '%conversation%' THEN 'متعلقة بالمحادثات'
        WHEN p.proname LIKE '%message%' THEN 'متعلقة بالرسائل'
        WHEN p.proname LIKE '%profile%' THEN 'متعلقة بالملفات الشخصية'
        WHEN p.proname LIKE '%upload%' THEN 'متعلقة برفع الملفات'
        WHEN p.proname LIKE '%delete%' THEN 'متعلقة بالحذف'
        WHEN p.proname LIKE '%get%' THEN 'متعلقة بالاسترجاع'
        WHEN p.proname LIKE '%create%' THEN 'متعلقة بالإنشاء'
        WHEN p.proname LIKE '%update%' THEN 'متعلقة بالتحديث'
        ELSE 'دالة عامة'
    END AS "التصنيف"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prorettype <> 0
    AND (
        p.proname IN ('get_user_conversations', 'get_user_profile', 'get_messages', 'send_message', 'upload_file', 'delete_message')
        OR p.proname LIKE 'get_%'
        OR p.proname LIKE 'auth_%'
    )
ORDER BY n.nspname, p.proname;

-- 3. عرض تعريف دالة get_user_conversations فقط (كمثال)
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات",
    pg_get_functiondef(p.oid) AS "التعريف الكامل"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'get_user_conversations';
