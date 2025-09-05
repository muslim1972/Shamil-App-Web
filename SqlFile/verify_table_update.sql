
-- التحقق من هيكل جدول user_conversation_settings بعد محاولة التحديث
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

-- التحقق من وجود حقل is_hidden بشكل محدد
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_conversation_settings' 
        AND column_name = 'is_hidden'
    ) AS is_hidden_exists,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_conversation_settings' 
        AND column_name = 'hidden_at'
    ) AS hidden_at_exists;
