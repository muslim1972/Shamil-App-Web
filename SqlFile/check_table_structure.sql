
-- التحقق من هيكل جدول user_conversation_settings
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
