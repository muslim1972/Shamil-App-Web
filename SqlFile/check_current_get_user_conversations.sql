
-- سكربت للتحقق من محتوى دالة get_user_conversations الحالية
-- هذا السكربت لا يقوم بأي تعديلات، بل فقط لعرض محتوى الدالة الحالية

SELECT 
    routine_name AS "اسم الدالة",
    routine_definition AS "محتوى الدالة"
FROM
    information_schema.routines
WHERE
    routine_schema = 'public' AND
    routine_name = 'get_user_conversations' AND
    (routine_type = 'FUNCTION');
