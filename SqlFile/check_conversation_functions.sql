
-- استعلام لفحص الدوال الموجودة في قاعدة البيانات
-- هذا الاستعلام يساعدنا على تحديد الدوال المتعلقة بجلب المحادثات

-- فحص جميع الدوال في قاعدة البيانات
SELECT 
    routine_name AS "اسم الدالة",
    routine_type AS "نوع الروتين",
    data_type AS "نوع البيانات المرجعة",
    external_language AS "لغة البرمجة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public'
    AND (routine_name LIKE '%conversation%' OR routine_name LIKE '%message%')
ORDER BY 
    routine_name;

-- فحص محتوى دالة get_user_conversations إذا كانت موجودة
SELECT 
    routine_definition AS "محتوى الدالة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public'
    AND routine_name = 'get_user_conversations';
