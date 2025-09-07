
-- استعلام لفحص دالة أرشفة المحادثات
-- هذا الاستعلام يساعدنا على فهم كيفية عمل دالة أرشفة المحادثات

-- فحص محتوى دالة archive_conversation
SELECT 
    routine_definition AS "محتوى الدالة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public'
    AND routine_name = 'archive_conversation';

-- فحص محتوى دالة unarchive_conversation
SELECT 
    routine_definition AS "محتوى الدالة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public'
    AND routine_name = 'unarchive_conversation';
