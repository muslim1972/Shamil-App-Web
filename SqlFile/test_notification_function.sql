-- Test script to directly invoke the push notification Edge Function
-- Set the password for the connection
\setenv PGPASSWORD vaFMojQOmCPLqYkO

-- Connect to the database
\connect postgresql://postgres@db.xuigvkwnjnfgxxnuhhhr.supabase.co:5432/postgres

-- Run the test query
SELECT net.http_post(
    url := 'https://xuigvkwnjnfgxxnuhhhr.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWd2a3duam5mZ3h4bnVobmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc1MzA2NywiZXhwIjoyMDY3MzI5MDY3fQ.dkPEz8xBkKPCI8Wquc1PMoZbGmIB7rRqdQ31KHTaf3g"}'::jsonb,
    -- Using dummy data that mimics a real message payload
    body := jsonb_build_object(
        'record', jsonb_build_object(
            'id', 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
            'conversation_id', 'f103120e-9571-4922-bb1e-35673399861e', -- A known conversation_id from logs
            'sender_id', '9ab0b373-4ad8-43be-b6e0-002e64867dc5', -- A known sender_id from logs
            'content', 'Test message from psql',
            'message_type', 'text'
        )
    )
) AS response;