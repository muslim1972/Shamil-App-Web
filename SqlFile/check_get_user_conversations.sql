

-- سكربت لفحص دالة get_user_conversations
SELECT 
    routine_name AS "اسم الدالة",
    routine_definition AS "تعريف الدالة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public' AND
    routine_name = 'get_user_conversations';

