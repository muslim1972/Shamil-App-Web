-- إصلاح نظام الإشعارات في Supabase

-- 1. التحقق من وجود جدول push_tokens وإنشائه إذا لم يكن موجودًا
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. إنشاء فهرس على عمود user_id لتحسين أداء البحث
CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens (user_id);

-- 3. إنشاء سياسات الأمان لجدول push_tokens
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_tokens;
CREATE POLICY "Users can manage their own push tokens"
    ON public.push_tokens
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. التحقق من وجود المحفز (Trigger) لإرسال الإشعارات وإعادة إنشائه
DROP FUNCTION IF EXISTS public.handle_new_message() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- استدعاء وظيفة Edge Function لإرسال الإشعارات
    PERFORM
        net.http_post(
            url := 'https://xuigvkwnjnfgxxnuhnhr.supabase.co/functions/v1/send-push-notification',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase_functions.secret.service_role') || '"}',
            body := json_build_object('record', row_to_json(NEW))
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إنشاء المحفز على جدول messages
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

-- 6. التأكد من تفعيل امتداد pg_net لإرسال طلبات HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 7. منح الصلاحيات اللازمة للوظيفة
GRANT USAGE ON SCHEMA net TO postgres, service_role, anon, authenticated;

-- 8. إصلاح مشكلة عدم وصول الإشعارات عند إرسال الرسائل
ALTER FUNCTION public.handle_new_message() SET search_path = public;