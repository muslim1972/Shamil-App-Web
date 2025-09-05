
-- إصلاح البيانات غير المتسقة في جدول user_conversation_settings
-- هذا السكربت سيقوم بتحديث السجلات التي يكون فيها is_archived = true ولكن archived_at = null

-- أولاً، قم بعرض السجلات التي سيتم تحديثها للتأكد
SELECT 
    user_id,
    conversation_id,
    is_archived,
    archived_at,
    'قبل التحديث' as status
FROM 
    user_conversation_settings
WHERE 
    is_archived = true AND archived_at IS NULL;

-- ثانياً، قم بتحديث هذه السجلات
UPDATE 
    user_conversation_settings
SET 
    archived_at = NOW()
WHERE 
    is_archived = true AND archived_at IS NULL;

-- ثالثاً، قم بعرض السجلات بعد التحديث للتأكد من نجاح العملية
SELECT 
    user_id,
    conversation_id,
    is_archived,
    archived_at,
    'بعد التحديث' as status
FROM 
    user_conversation_settings
WHERE 
    user_id IN (
        SELECT user_id FROM user_conversation_settings 
        WHERE is_archived = true AND archived_at IS NULL
    )
    OR conversation_id IN (
        SELECT conversation_id FROM user_conversation_settings 
        WHERE is_archived = true AND archived_at IS NULL
    );

-- رابعاً، تحقق من وجود أي حالات عدم اتساق أخرى
SELECT 
    user_id,
    conversation_id,
    is_archived,
    archived_at,
    CASE 
        WHEN is_archived = true AND archived_at IS NOT NULL THEN 'متسق (مؤرشفة)'
        WHEN is_archived = false AND archived_at IS NULL THEN 'متسق (غير مؤرشفة)'
        WHEN is_archived = true AND archived_at IS NULL THEN 'غير متسق (is_archived=true لكن archived_at=null)'
        WHEN is_archived = false AND archived_at IS NOT NULL THEN 'غير متسق (is_archived=false لكن archived_at ليس null)'
        ELSE 'حالة غير معروفة'
    END as status
FROM 
    user_conversation_settings
WHERE 
    (is_archived = true AND archived_at IS NULL) OR
    (is_archived = false AND archived_at IS NOT NULL);
