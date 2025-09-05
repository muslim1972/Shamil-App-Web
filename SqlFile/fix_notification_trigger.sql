-- الخطوة 1: حذف المحفز القديم الذي يستدعي الدالة الخاطئة
DROP TRIGGER IF EXISTS on_new_message_send_notification ON public.messages;
DROP FUNCTION IF EXISTS send_notification_on_new_message(); -- نحذف الدالة القديمة أيضًا لتجنب أي تعارضات

-- الخطوة 2: إنشاء دالة جديدة تقوم باستدعاء دالة الإشعارات (Edge Function) بشكل صحيح
-- هذه الدالة ستعمل كوسيط لإرسال طلب HTTP إلى الدالة الطرفية الخاصة بنا
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- ضروري لتمرير مفتاح الخدمة بأمان
AS $$
BEGIN
  -- إرسال طلب POST إلى دالة الإشعارات الطرفية
  -- نمرر بيانات الرسالة الجديدة (new) في جسم الطلب
  PERFORM net.http_post(
    url := 'https://xuigvkwnjnfgxxnuhhhr.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWd2a3duam5mZ3h4bnVobmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc1MzA2NywiZXhwIjoyMDY3MzI5MDY3fQ.dkPEz8xBkKPCI8Wquc1PMoZbGmIB7rRqdQ31KHTaf3g"}'::jsonb,
    body := jsonb_build_object('record', NEW)
  );
  RETURN NEW;
END;
$$;

-- الخطوة 3: إنشاء المحفز الجديد الذي سيتم تفعيله بعد كل عملية إدراج في جدول الرسائل
-- هذا المحفز سيقوم باستدعاء الدالة الجديدة التي أنشأناها في الخطوة 2
CREATE TRIGGER on_new_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- رسالة تأكيد
SELECT 'تم إنشاء محفز الإشعارات بنجاح!' AS result;
