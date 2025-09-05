-- الجزء الثالث من سكربت لعرض الدوال في قاعدة البيانات
-- هذا الجزء يعرض تعريف دالة get_user_conversations فقط (كمثال)

SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات",
    pg_get_functiondef(p.oid) AS "التعريف الكامل"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'get_user_conversations'
LIMIT 1;
