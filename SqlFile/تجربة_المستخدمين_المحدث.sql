-- تجربة المستخدمين والمحادثات - إصدار محدث بدون أخطاء
-- هذا الملف يعمل مع الهيكل الجديد بعد الإصلاحات

-- 1. عرض جميع المستخدمين في النظام
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC;

-- 2. التحقق من وجود المستخدم muslimakeel@yahoo.com
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.created_at
FROM public.users u
WHERE u.email = 'muslimakeel@yahoo.com';

-- 3. إذا لم يكن موجوداً، نستخدم دالة ensure_user_exists
-- SELECT public.ensure_user_exists('USER_UUID_HERE');

-- 4. عرض جميع المحادثات
SELECT 
    c.id,
    c.name,
    c.type,
    u.email as created_by_email,
    c.created_at,
    c.updated_at
FROM public.conversations c
LEFT JOIN public.users u ON c.created_by = u.id
ORDER BY c.updated_at DESC;

-- 5. عرض مشاركات المستخدمين في المحادثات
SELECT 
    cm.conversation_id,
    c.name as conversation_name,
    u.email as user_email,
    cm.joined_at
FROM public.conversation_members cm
JOIN public.conversations c ON cm.conversation_id = c.id
JOIN public.users u ON cm.user_id = u.id
ORDER BY cm.conversation_id, cm.joined_at;

-- 6. عرض الرسائل في كل محادثة
SELECT 
    m.id,
    m.conversation_id,
    c.name as conversation_name,
    u.email as sender_email,
    m.content,
    m.message_type,
    m.created_at
FROM public.messages m
JOIN public.conversations c ON m.conversation_id = c.id
JOIN public.users u ON m.sender_id = u.id
ORDER BY m.conversation_id, m.created_at;

-- 7. إحصائيات سريعة
SELECT 
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.conversations) as total_conversations,
    (SELECT COUNT(*) FROM public.messages) as total_messages;