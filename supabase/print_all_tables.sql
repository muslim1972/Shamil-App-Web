-- سكربت لطباعة محتويات جميع الجداول مع أسماء الأعمدة بعد إدخال المستخدم الجديد

-- 1. طباعة محتويات جدول users
SELECT 'users' AS table_name, * FROM users;

-- 2. طباعة محتويات جدول profiles
SELECT 'profiles' AS table_name, * FROM profiles;

-- 3. طباعة محتويات جدول conversations
SELECT 'conversations' AS table_name, * FROM conversations;

-- 4. طباعة محتويات جدول conversation_members
SELECT 'conversation_members' AS table_name, * FROM conversation_members;

-- 5. طباعة محتويات جدول messages
SELECT 'messages' AS table_name, * FROM messages;

-- 6. طباعة محتويات جدول message_reads
SELECT 'message_reads' AS table_name, * FROM message_reads;

-- 7. طباعة محتويات جدول hidden_messages
SELECT 'hidden_messages' AS table_name, * FROM hidden_messages;

-- 8. طباعة محتويات جدول push_tokens
SELECT 'push_tokens' AS table_name, * FROM push_tokens;

-- يمكنك إضافة أو حذف جداول حسب الحاجة
