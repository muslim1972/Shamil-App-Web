-- إنشاء مستخدم اختبار جديد
-- نفذ هذا في Supabase SQL Editor

-- إنشاء مستخدم اختبار مع كلمة مرور معروفة
-- ملاحظة: هذا يتطلب تفعيل "Enable email confirmations" في Supabase Auth settings

-- 1. أولاً، تحقق من إعدادات المصادقة
SELECT 
    'Auth Settings Check' as info,
    'يجب تعطيل Email Confirmations مؤقتاً للاختبار' as note;

-- 2. إذا كان لديك صلاحية admin، يمكنك إنشاء مستخدم مباشرة
-- (هذا يعمل فقط مع service_role key)

-- البديل: استخدم Supabase Dashboard -> Authentication -> Users -> Invite User
-- أو استخدم التطبيق لإنشاء حساب جديد