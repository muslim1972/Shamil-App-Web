
-- تعديل دالة تحديث حالة المحادثة عند إرسال رسالة جديدة
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث حالة المحادثة عند إرسال رسالة جديدة
    UPDATE public.user_conversation_settings
    SET 
        is_hidden = FALSE,
        hidden_at = NULL,
        last_read_at = NOW()
    WHERE 
        conversation_id = NEW.conversation_id AND 
        user_id = NEW.sender_id;

    -- إخفاء الرسائل القديمة للمستخدم عند إرسال رسالة جديدة في محادثة مخفية
    -- هذا سيجعل المحادثة تبدو وكأنها جديدة عند إعادة فتحها
    UPDATE public.messages
    SET 
        is_hidden = TRUE,
        hidden_at = NOW()
    WHERE 
        conversation_id = NEW.conversation_id AND 
        (
            -- إخفاء جميع الرسائل المرسلة من قبل المستخدم الحالي
            sender_id = NEW.sender_id OR
            -- إخفاء جميع الرسائل المرسلة إلى المستخدم الحالي
            id IN (
                SELECT m.id 
                FROM public.messages m
                WHERE 
                    m.conversation_id = NEW.conversation_id AND
                    -- التحقق من أن المستخدم الحالي هو مستلم الرسالة
                    EXISTS (
                        SELECT 1 
                        FROM public.user_conversation_settings ucs
                        WHERE 
                            ucs.conversation_id = m.conversation_id AND
                            ucs.user_id = NEW.sender_id AND
                            ucs.is_hidden = FALSE
                    )
            )
        ) AND
        -- لا تخفي الرسالة الجديدة التي تم إرسالها الآن
        id != NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة حقل is_hidden و hidden_at إلى جدول messages إذا لم يكونا موجودين
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_hidden'
    ) THEN
        ALTER TABLE public.messages
        ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_hidden added to messages table successfully.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'hidden_at'
    ) THEN
        ALTER TABLE public.messages
        ADD COLUMN hidden_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column hidden_at added to messages table successfully.';
    END IF;
END $$;

-- تحديث دالة جلب الرسائل لتجاهل الرسائل المخفية
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id UUID, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    sender_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.sender_id,
        m.created_at,
        m.is_edited
    FROM 
        public.messages m
    WHERE 
        m.conversation_id = p_conversation_id AND
        m.is_hidden = FALSE AND
        (
            -- عرض الرسائل المرسلة من قبل المستخدم الحالي
            m.sender_id = p_user_id OR
            -- عرض الرسائل المرسلة إلى المستخدم الحالي
            EXISTS (
                SELECT 1 
                FROM public.user_conversation_settings ucs
                WHERE 
                    ucs.conversation_id = m.conversation_id AND
                    ucs.user_id = p_user_id AND
                    ucs.is_hidden = FALSE
            )
        )
    ORDER BY 
        m.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(UUID, UUID) TO service_role;

-- التحقق من إنشاء الدوال بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_conversation_on_message') THEN
        RAISE NOTICE 'Function update_conversation_on_message updated successfully.';
    ELSE
        RAISE NOTICE 'Failed to update function update_conversation_on_message.';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_conversation_messages') THEN
        RAISE NOTICE 'Function get_conversation_messages updated successfully.';
    ELSE
        RAISE NOTICE 'Failed to update function get_conversation_messages.';
    END IF;
END $$;
