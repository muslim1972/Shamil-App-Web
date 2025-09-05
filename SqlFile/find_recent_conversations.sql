-- This query will get the 10 most recently updated conversations.

SELECT id, participants, updated_at
FROM public.conversations
ORDER BY updated_at DESC
LIMIT 10;
