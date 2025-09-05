-- سياسة RLS للسماح بالإدراج في جدول users لأي مستخدم مصادق عليه
-- يمكن حذف هذه السياسة لاحقاً إذا أردت منع الإدراج من التطبيق، لكن يجب أن تبقى ما دام التطبيق يحتاج إنشاء مستخدمين جدد


ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for authenticated" ON users;

CREATE POLICY "Allow insert for authenticated" ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- بعد التنفيذ، يمكن حذف هذا الاستعلام من قاعدة البيانات، لكن يجب أن تبقى السياسة فعالة ما دام التطبيق يحتاجها
