-- منح صلاحية تنفيذ دالة http_post للمستخدمين
GRANT EXECUTE ON FUNCTION net.http_post(url text, headers jsonb, body jsonb) TO public;

-- رسالة تأكيد
SELECT 'تم منح صلاحيات http_post بنجاح!' AS result;
