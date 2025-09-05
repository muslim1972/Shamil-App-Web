
-- التحقق من أسماء الجداول في قاعدة البيانات
SELECT 
    table_name,
    table_schema
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' AND
    (table_name LIKE '%conversation%' OR table_name LIKE '%message%' OR table_name LIKE '%participant%')
ORDER BY 
    table_name;

-- التحقق من هيكل جدول المحادثات
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND
    table_name = 'conversations'
ORDER BY 
    ordinal_position;

-- التحقق من هيكل جدول الرسائل
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND
    table_name = 'messages'
ORDER BY 
    ordinal_position;

-- التحقق من وجود جدول المستخدمين في المحادثات
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND
    table_name = 'user_conversation_settings'
ORDER BY 
    ordinal_position;
