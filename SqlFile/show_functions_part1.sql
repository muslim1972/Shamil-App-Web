-- الجزء الأول من سكربت لعرض الدوال في قاعدة البيانات
-- هذا الجزء يعرض جميع الدوال في مخطط public (باستخدام تقسيم أبسط)

SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prorettype <> 0
ORDER BY n.nspname, p.proname
LIMIT 100;
