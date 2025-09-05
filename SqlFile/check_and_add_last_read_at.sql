
-- التحقق من هيكل جدول user_conversation_settings الحالي
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

-- إضافة حقل last_read_at إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_conversation_settings' AND column_name = 'last_read_at'
    ) THEN
        ALTER TABLE public.user_conversation_settings
        ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column last_read_at added successfully.';
    ELSE
        RAISE NOTICE 'Column last_read_at already exists.';
    END IF;
END $$;

-- التحقق النهائي من إضافة الحقل
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_conversation_settings' 
        AND column_name = 'last_read_at'
    ) AS last_read_at_exists;
