


-- سكربت لعرض جميع الدوال الموجودة في قاعدة البيانات
-- هذا السكربت سيساعدنا على تحديد الدوال المتاحة وتحديد ما إذا كانت هناك دوال مفقودة

-- عرض جميع الدوال في المخطط العام (public)
SELECT 
    routine_name AS "اسم الدالة",
    routine_type AS "نوع الروتين",
    data_type AS "نوع البيانات المرجعة",
    external_language AS "لغة البرمجة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public'
ORDER BY 
    routine_name;

-- عرض تفاصيل أكثر عن الدوال (تم إصلاح الخطأ)
SELECT 
    routines.routine_name AS "اسم الدالة",
    routines.routine_type AS "نوع الروتين",
    routines.data_type AS "نوع البيانات المرجعة",
    routines.external_language AS "لغة البرمجة",
    pg_description.description AS "الوصف"
FROM 
    information_schema.routines
LEFT JOIN 
    pg_proc ON pg_proc.proname = routines.routine_name
LEFT JOIN 
    pg_description ON pg_description.objoid = pg_proc.oid
WHERE 
    routines.routine_schema = 'public'
ORDER BY 
    routines.routine_name;

-- عرض الدوال التي تبدأ بـ "delete" أو "archive" أو "clear" أو "hide"
SELECT 
    routine_name AS "اسم الدالة",
    routine_type AS "نوع الروتين",
    data_type AS "نوع البيانات المرجعة",
    external_language AS "لغة البرمجة"
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public' AND
    (routine_name LIKE '%delete%' OR 
     routine_name LIKE '%archive%' OR 
     routine_name LIKE '%clear%' OR 
     routine_name LIKE '%hide%')
ORDER BY 
    routine_name;


