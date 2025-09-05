
-- الجزء 3 المعدل: إنشاء سياسات الأمان (RLS) للجداول
-- مع التأكد من وجود الجداول والأعمدة الصحيحة

-- أولاً، دعنا نتأكد من وجود الجداول والأعمدة
DO $$
BEGIN
    -- التحقق من وجود جدول المستخدمين
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        RAISE NOTICE 'جدول المستخدمين غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    -- التحقق من وجود جدول المحادثات
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
        RAISE NOTICE 'جدول المحادثات غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    -- التحقق من وجود جدول أعضاء المحادثات
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_members') THEN
        RAISE NOTICE 'جدول أعضاء المحادثات غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    -- التحقق من وجود جدول الرسائل
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        RAISE NOTICE 'جدول الرسائل غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    -- التحقق من وجود جدول الرموز المميزة للإشعارات
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'push_tokens') THEN
        RAISE NOTICE 'جدول الرموز المميزة للإشعارات غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    -- التحقق من وجود جدول الرسائل المخفية
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hidden_messages') THEN
        RAISE NOTICE 'جدول الرسائل المخفية غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    -- التحقق من وجود جدول قراءة الرسائل
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_reads') THEN
        RAISE NOTICE 'جدول قراءة الرسائل غير موجود، يرجى تنفيذ الجزء الأول أولاً';
        RETURN;
    END IF;

    RAISE NOTICE 'جميع الجداول موجودة، سيتم إنشاء سياسات الأمان';
END $$;

-- سياسات جدول المستخدمين
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- سياسات جدول المحادثات
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

-- سياسات جدول أعضاء المحادثات
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

-- سياسات جدول الرسائل
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

-- سياسات جدول الرموز المميزة للإشعارات
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

-- سياسات جدول الرسائل المخفية
DROP POLICY IF EXISTS "Users can view their own hidden messages" ON public.hidden_messages;
CREATE POLICY "Users can view their own hidden messages" ON public.hidden_messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own hidden messages" ON public.hidden_messages;
CREATE POLICY " insert their own hidden messages" ON public.hidden_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own hidden messages" ON public.hidden_messages;
CREATE POLICY "Users can delete their own hidden messages" ON public.hidden_messages
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول قراءة الرسائل
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
