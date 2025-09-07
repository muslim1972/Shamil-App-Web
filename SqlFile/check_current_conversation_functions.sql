
-- استعلام لفحص دالة جلب المحادثات الحالية
-- هذا الاستعلام يساعدنا على فهم كيفية عمل دالة جلب المحادثات

-- محاولة استدعاء دالة get_user_conversations
-- يجب استبدال USER_ID بمعرّف المستخدم الفعلي
SELECT * FROM get_user_conversations('USER_ID'::uuid) LIMIT 5;

-- إذا فشل الاستعلام السابق، جرب استدعاء الدوال الأخرى المتعلقة بالمحادثات
SELECT * FROM get_non_archived_conversations() LIMIT 5;

-- فحص محتوى دالة get_user_archived_conversations
SELECT 
    routine_definition AS "محتوى الدالة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public'
    AND routine_name = 'get_user_archived_conversations';
