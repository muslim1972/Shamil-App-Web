
-- ملف لإنشاء سياسات الأمان (RLS) للجداول
-- مع التأكد من وجود الجداول والأعمدة الصحيحة

-- سياسات جدول المستخدمين
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    CREATE POLICY "Users can view their own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    CREATE POLICY "Users can insert their own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = id);

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول المستخدمين';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول المستخدمين: %', SQLERRM;
END $$;

-- سياسات جدول المحادثات
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view conversations they are members of" ON public.conversations;
    CREATE POLICY "Users can view conversations they are members of" ON public.conversations
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = conversations.id
                AND conversation_members.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can insert conversations they are members of" ON public.conversations;
    CREATE POLICY "Users can insert conversations they are members of" ON public.conversations
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = conversations.id
                AND conversation_members.user_id = auth.uid()
            )
        );

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول المحادثات';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول المحادثات: %', SQLERRM;
END $$;

-- سياسات جدول أعضاء المحادثات
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view conversation members" ON public.conversation_members;
    CREATE POLICY "Users can view conversation members" ON public.conversation_members
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.conversation_members cm2
                WHERE cm2.conversation_id = conversation_members.conversation_id
                AND cm2.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can insert conversation members" ON public.conversation_members;
    CREATE POLICY "Users can insert conversation members" ON public.conversation_members
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete themselves from conversations" ON public.conversation_members;
    CREATE POLICY "Users can delete themselves from conversations" ON public.conversation_members
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول أعضاء المحادثات';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول أعضاء المحادثات: %', SQLERRM;
END $$;

-- سياسات جدول الرسائل
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view messages in conversations they are members of" ON public.messages;
    CREATE POLICY "Users can view messages in conversations they are members of" ON public.messages
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = messages.conversation_id
                AND conversation_members.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can insert messages in conversations they are members of" ON public.messages;
    CREATE POLICY "Users can insert messages in conversations they are members of" ON public.messages
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
    CREATE POLICY "Users can update their own messages" ON public.messages
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
    CREATE POLICY "Users can delete their own messages" ON public.messages
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول الرسائل';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول الرسائل: %', SQLERRM;
END $$;

-- سياسات جدول الرموز المميزة للإشعارات
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.push_tokens;
    CREATE POLICY "Users can view their own push tokens" ON public.push_tokens
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert their own push tokens" ON public.push_tokens;
    CREATE POLICY "Users can insert their own push tokens" ON public.push_tokens
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.push_tokens;
    CREATE POLICY "Users can update their own push tokens" ON public.push_tokens
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.push_tokens;
    CREATE POLICY "Users can delete their own push tokens" ON public.push_tokens
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول الرموز المميزة للإشعارات';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول الرموز المميزة للإشعارات: %', SQLERRM;
END $$;

-- سياسات جدول الرسائل المخفية
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own hidden messages" ON public.hidden_messages;
    CREATE POLICY "Users can view their own hidden messages" ON public.hidden_messages
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert their own hidden messages" ON public.hidden_messages;
    CREATE POLICY "Users can insert their own hidden messages" ON public.hidden_messages
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own hidden messages" ON public.hidden_messages;
    CREATE POLICY "Users can delete their own hidden messages" ON public.hidden_messages
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول الرسائل المخفية';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول الرسائل المخفية: %', SQLERRM;
END $$;

-- سياسات جدول قراءة الرسائل
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view message reads" ON public.message_reads;
    CREATE POLICY "Users can view message reads" ON public.message_reads
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = (
                    SELECT messages.conversation_id FROM public.messages
                    WHERE messages.id = message_reads.message_id
                )
                AND conversation_members.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can insert their own message reads" ON public.message_reads;
    CREATE POLICY "Users can insert their own message reads" ON public.message_reads
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own message reads" ON public.message_reads;
    CREATE POLICY "Users can update their own message reads" ON public.message_reads
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own message reads" ON public.message_reads;
    CREATE POLICY "Users can delete their own message reads" ON public.message_reads
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'تم إنشاء سياسات الأمان لجدول قراءة الرسائل';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء إنشاء سياسات الأمان لجدول قراءة الرسائل: %', SQLERRM;
END $$;
