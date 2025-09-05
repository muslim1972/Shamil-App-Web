-- تجربة المستخدمين والمحادثات - إصدار مصحح نهائياً
-- هذا الملف يعمل مع الهيكل الصحيح

-- 1. عرض جميع المستخدمين في النظام
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC;

-- 2. التحقق من وجود المستخدمين المطلوبين
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.created_at
FROM public.users u
WHERE u.email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com');

-- 3. عرض جميع المحادثات (استخدام name بدلاً من title)
SELECT 
    c.id,
    c.name,
    c.type,
    c.is_group,
    u.email as created_by_email,
    c.created_at,
    c.updated_at
FROM public.conversations c
LEFT JOIN public.users u ON c.created_by = u.id
ORDER BY c.updated_at DESC;

-- 4. عرض مشاركات المستخدمين في المحادثات
SELECT 
    cm.conversation_id,
    c.name as conversation_name,
    u.email as user_email,
    cm.joined_at,
    cm.is_admin
FROM public.conversation_members cm
JOIN public.conversations c ON cm.conversation_id = c.id
JOIN public.users u ON cm.user_id = u.id
ORDER BY cm.conversation_id, cm.joined_at;

-- 5. عرض الرسائل في كل محادثة
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

-- 6. إحصائيات سريعة
SELECT 
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.conversations) as total_conversations,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.conversation_members) as total_memberships;

-- 7. التحقق من المستخدمين في auth.users مقابل public.users
SELECT 
    'في auth.users فقط' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'في public.users فقط' as status,
    COUNT(*) as count
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL

UNION ALL

SELECT 
    'في كلا الجدولين' as status,
    COUNT(*) as count
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id;