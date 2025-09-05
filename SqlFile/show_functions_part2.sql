-- الجزء الثاني من سكربت لعرض الدوال في قاعدة البيانات
-- هذا الجزء يعرض الدوال الرئيسية في المشروع (باستخدام تقسيم أبسط)

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
ORDER BY n.nspname, p.proname
LIMIT 50;
