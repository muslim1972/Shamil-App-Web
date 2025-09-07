
-- استعلام لفحص هيكل جداول المحادثات وإعدادات المستخدم للمحادثات
-- هذا الاستعلام يساعدنا على فهم كيفية تخزين بيانات المحادثات المؤرشفة

-- فحص هيكل جدول المحادثات
SELECT 
    column_name AS "اسم العمود",
    data_type AS "نوع البيانات",
    is_nullable AS "يمكن أن يكون NULL",
    column_default AS "القيمة الافتراضية"
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'conversations'
ORDER BY 
    ordinal_position;

-- فحص هيكل جدول إعدادات المستخدم للمحادثات
SELECT 
    column_name AS "اسم العمود",
    data_type AS "نوع البيانات",
    is_nullable AS "يمكن أن يكون NULL",
    column_default AS "القيمة الافتراضية"
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_conversation_settings'
ORDER BY 
    ordinal_position;

-- فحص بعض البيانات في جدول إعدادات المستخدم للمحادثات
SELECT 
    user_id,
    conversation_id,
    is_archived,
    archived_at,
    is_hidden
FROM 
    user_conversation_settings
LIMIT 10;
