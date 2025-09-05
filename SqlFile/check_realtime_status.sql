SELECT CASE
    WHEN (SELECT count(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') > 0
    THEN 'جدول messages معد للبث المباشر.'
    ELSE 'جدول messages غير معد للبث المباشر. تحتاج إلى إضافته.'
END AS realtime_status;