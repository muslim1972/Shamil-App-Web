
-- إضافة حقل is_hidden إلى جدول user_conversation_settings
DO $$
BEGIN
    -- التحقق من وجود الحقل أولاً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_conversation_settings' AND column_name = 'is_hidden'
    ) THEN
        ALTER TABLE public.user_conversation_settings
        ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_hidden added successfully.';
    ELSE
        RAISE NOTICE 'Column is_hidden already exists.';
    END IF;

    -- التحقق من وجود الحقل الثاني
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_conversation_settings' AND column_name = 'hidden_at'
    ) THEN
        ALTER TABLE public.user_conversation_settings
        ADD COLUMN hidden_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column hidden_at added successfully.';
    ELSE
        RAISE NOTICE 'Column hidden_at already exists.';
    END IF;
END $$;

-- التحقق النهائي من إضافة الأعمدة
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
