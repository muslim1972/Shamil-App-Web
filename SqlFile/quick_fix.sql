
-- حل سريع لمشكلة قاعدة البيانات

-- 1. تعديل عمود البريد الإلكتروني ليسمح بالقيم الفارغة
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 2. إضافة عمود user_id لجدول المحادثات إذا كان غير موجود
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id') THEN
            ALTER TABLE public.conversations ADD COLUMN user_id UUID REFERENCES public.users(id);
        END IF;
    END IF;
END $$;
