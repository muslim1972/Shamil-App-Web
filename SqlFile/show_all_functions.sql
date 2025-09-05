-- سكربت لعرض جميع الدوال في قاعدة البيانات ووصف وظيفتها
-- هذا السكربت يوفر معلومات مفصلة عن الدوال المخزنة في قاعدة البيانات

-- 1. عرض جميع الدوال مع معلومات أساسية
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات",
    CASE 
        WHEN p.proisstrict THEN 'صارم'
        ELSE 'غير صارم'
    END AS "نوع التنفيذ",
    CASE 
        WHEN p.provolatile = 'v' THEN 'متغير'
        WHEN p.provolatile = 'i' THEN 'ثابت'
        WHEN p.provolatile = 's' THEN 'ستable'
        ELSE 'غير معروف'
    END AS "ثبات القيمة",
    CASE 
        WHEN p.proretset THEN 'مجموعة'
        ELSE 'قيمة واحدة'
    END AS "نوع الإرجاع",
    pg_get_userbyid(p.proowner) AS "مالك الدالة",
    pg_get_functiondef(p.oid) AS "تعريف الدالة"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND p.prorettype <> 0
ORDER BY n.nspname, p.proname;

-- 2. عرض الدوال مع شرح موجز لوظيفتها
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
    END AS "التصنيف",
    pg_get_functiondef(p.oid) AS "التعريف الكامل"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND p.prorettype <> 0
ORDER BY n.nspname, p.proname;

-- 3. عرض الدوال مع تحليل بسيط لاستخدامها
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات",
    CASE 
        WHEN p.prorettype = 2287 THEN "دالة تعيد جدول"
        WHEN p.prorettype = 23 THEN "دالة تعيد نص"
        WHEN p.prorettype = 20 THEN "دالة تعيد UUID"
        WHEN p.prorettype = 1082 THEN "دالة تعيد تاريخ"
        WHEN p.prorettype = 1114 THEN "دالة تعيد وقت"
        WHEN p.prorettype = 1700 THEN "دالة تعيد رقم عشري"
        WHEN p.prorettype = 23 THEN "دالة تعيد نص"
        ELSE "دالة تعيد نوع آخر"
    END AS "نوع الدالة",
    pg_get_functiondef(p.oid) AS "التعريف"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND p.prorettype <> 0
ORDER BY n.nspname, p.proname;

-- 4. عرض الدوال التي تستخدم في المشروع الرئيسي
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    pg_get_function_result(p.oid) AS "نوع الإرجاع",
    pg_get_function_arguments(p.oid) AS "المعطيات",
    pg_get_functiondef(p.oid) AS "التعريف"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND p.prorettype <> 0
    AND (
        p.proname IN ('get_user_conversations', 'get_user_profile', 'get_messages', 'send_message', 'upload_file', 'delete_message')
        OR p.proname LIKE 'get_%'
        OR p.proname LIKE 'auth_%'
    )
ORDER BY n.nspname, p.proname;

-- 5. عرض الدوال التي تحتوي على تعليقات
SELECT 
    n.nspname AS "المخطط (Schema)",
    p.proname AS "اسم الدالة",
    obj_description(p.oid, 'pg_proc') AS "الوصف"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND obj_description(p.oid, 'pg_proc') IS NOT NULL
ORDER BY n.nspname, p.proname;
