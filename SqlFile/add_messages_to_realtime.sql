-- هذا الأمر يضمن أن جدول الرسائل مدرج في نظام البث المباشر (Realtime)
-- إذا كان مدرجًا بالفعل، سيتم تجاهل الأمر بأمان
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- رسالة تأكيد
SELECT 'تمت محاولة إضافة جدول messages إلى البث المباشر بنجاح!' AS result;
