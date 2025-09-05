
-- إضافة حقل is_hidden إلى جدول user_conversation_settings
ALTER TABLE public.user_conversation_settings
ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- إضافة حقل hidden_at لتسجيل وقت الإخفاء
ALTER TABLE public.user_conversation_settings
ADD COLUMN hidden_at TIMESTAMP WITH TIME ZONE;

-- التحقق من إضافة الأعمدة بنجاح
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_conversation_settings' AND column_name = 'is_hidden'
    ) THEN
        RAISE NOTICE 'Column is_hidden added successfully.';
    ELSE
        RAISE NOTICE 'Failed to add column is_hidden.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_conversation_settings' AND column_name = 'hidden_at'
    ) THEN
        RAISE NOTICE 'Column hidden_at added successfully.';
    ELSE
        RAISE NOTICE 'Failed to add column hidden_at.';
    END IF;
END $$;
