
-- الجزء الثالث: إنشاء سياسات الأمان (RLS) للجداول
-- يجب تنفيذ هذه الاستعلامات بعد تفعيل Row Level Security

-- سياسات جدول المستخدمين
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- سياسات جدول المحادثات
CREATE POLICY "Users can view conversations they are members of" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = conversations.id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations they are members of" ON public.conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = conversations.id
            AND conversation_members.user_id = auth.uid()
        )
    );

-- سياسات جدول أعضاء المحادثات
CREATE POLICY "Users can view conversation members" ON public.conversation_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = conversation_members.conversation_id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversation members" ON public.conversation_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete themselves from conversations" ON public.conversation_members
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول الرسائل
CREATE POLICY "Users can view messages in conversations they are members of" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = messages.conversation_id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in conversations they are members of" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول الرموز المميزة للإشعارات
CREATE POLICY "Users can view their own push tokens" ON public.push_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" ON public.push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" ON public.push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" ON public.push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول الرسائل المخفية
CREATE POLICY "Users can view their own hidden messages" ON public.hidden_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hidden messages" ON public.hidden_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hidden messages" ON public.hidden_messages
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول قراءة الرسائل
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

CREATE POLICY "Users can insert their own message reads" ON public.message_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message reads" ON public.message_reads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message reads" ON public.message_reads
    FOR DELETE USING (auth.uid() = user_id);
