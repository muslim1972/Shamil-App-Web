
-- دالة لتحديث حالة المحادثة عند إرسال رسالة جديدة
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث حالة المحادثة عند إرسال رسالة جديدة
    UPDATE public.user_conversation_settings
    SET 
        is_hidden = FALSE,
        last_read_at = COALESCE(last_read_at, NOW())
    WHERE 
        conversation_id = NEW.conversation_id AND 
        user_id = NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء ترايجر لتنفيذ الدالة عند إضافة رسالة جديدة
DROP TRIGGER IF EXISTS update_conversation_on_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_on_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_on_message();

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO service_role;

-- التحقق من إنشاء الدالة والترايجر بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_conversation_on_message') THEN
        RAISE NOTICE 'Function update_conversation_on_message created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function update_conversation_on_message.';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversation_on_message_trigger') THEN
        RAISE NOTICE 'Trigger update_conversation_on_message_trigger created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create trigger update_conversation_on_message_trigger.';
    END IF;
END $$;
