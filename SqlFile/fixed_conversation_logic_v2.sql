
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لإخفاء المحادثة ورسائلها للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.hide_conversation_for_user(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    -- إخفاء المحادثة للمستخدم الحالي
    UPDATE public.user_conversation_settings
    SET 
        is_hidden = TRUE,
        hidden_at = NOW()
    WHERE 
        conversation_id = p_conversation_id AND 
        user_id = p_user_id;

    -- إخفاء الرسائل للمستخدم الحالي
    -- نستخدم جدول منفصل لتتبع إخفاء الرسائل لكل مستخدم
    INSERT INTO public.user_message_visibility (user_id, message_id, is_hidden, hidden_at)
    SELECT 
        p_user_id,
        m.id,
        TRUE,
        NOW()
    FROM 
        public.messages m
    WHERE 
        m.conversation_id = p_conversation_id AND
        NOT EXISTS (
            SELECT 1 
            FROM public.user_message_visibility umv 
            WHERE umv.user_id = p_user_id AND umv.message_id = m.id
        );

    -- تحديث السجلات الموجودة إذا كانت موجودة بالفعل
    UPDATE public.user_message_visibility
    SET 
        is_hidden = TRUE,
        hidden_at = NOW()
    WHERE 
        user_id = p_user_id AND
        message_id IN (
            SELECT m.id 
            FROM public.messages m 
            WHERE m.conversation_id = p_conversation_id
        );

    GET DIAGNOSTICS v_success = ROW_COUNT;
    RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql;

-- إنشاء جدول لتتبع إخفاء الرسائل لكل مستخدم إذا لم يكن موجودًا
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_message_visibility'
    ) THEN
        CREATE TABLE public.user_message_visibility (
            user_id UUID NOT NULL,
            message_id UUID NOT NULL,
            is_hidden BOOLEAN DEFAULT FALSE,
            hidden_at TIMESTAMP WITH TIME ZONE,
            PRIMARY KEY (user_id, message_id),
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
            FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE
        );
        RAISE NOTICE 'Table user_message_visibility created successfully.';
    END IF;
END $$;

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

-- تحديث دالة جلب الرسائل لتجاهل الرسائل المخفية للمستخدم الحالي
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
        -- لا تعرض الرسائل المخفية للمستخدم الحالي
        NOT EXISTS (
            SELECT 1 
            FROM public.user_message_visibility umv 
            WHERE umv.user_id = p_user_id AND umv.message_id = m.id AND umv.is_hidden = TRUE
        ) AND
        -- لا تعرض الرسائل المخفية عالميًا
        m.is_hidden = FALSE
    ORDER BY 
        m.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO service_role;
GRANT EXECUTE ON FUNCTION public.hide_conversation_for_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_conversation_for_user(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(UUID, UUID) TO service_role;
GRANT ALL ON public.user_message_visibility TO authenticated;
GRANT ALL ON public.user_message_visibility TO service_role;

-- التحقق من إنشاء الدوال والجدول بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_conversation_on_message') THEN
        RAISE NOTICE 'Function update_conversation_on_message updated successfully.';
    ELSE
        RAISE NOTICE 'Failed to update function update_conversation_on_message.';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'hide_conversation_for_user') THEN
        RAISE NOTICE 'Function hide_conversation_for_user created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function hide_conversation_for_user.';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_conversation_messages') THEN
        RAISE NOTICE 'Function get_conversation_messages updated successfully.';
    ELSE
        RAISE NOTICE 'Failed to update function get_conversation_messages.';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_message_visibility') THEN
        RAISE NOTICE 'Table user_message_visibility exists successfully.';
    ELSE
        RAISE NOTICE 'Failed to create table user_message_visibility.';
    END IF;
END $$;
