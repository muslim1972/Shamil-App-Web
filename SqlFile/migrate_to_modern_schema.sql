-- =====================================================================================
-- WARNING: MAJOR SCHEMA MIGRATION SCRIPT
-- PLEASE, TAKE A FULL BACKUP OF YOUR DATABASE BEFORE RUNNING THIS.
-- =====================================================================================

BEGIN; -- Start a transaction to ensure all steps succeed or none do.

-- Step 1: Add the 'participants' column to the 'conversations' table if it doesn't exist.
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS participants uuid[];

-- Step 2: Populate the new 'participants' column from the old 'conversation_members' table.
-- This ensures no data about who is in which conversation is lost.
UPDATE public.conversations c
SET participants = ARRAY(
    SELECT cm.user_id
    FROM public.conversation_members cm
    WHERE cm.conversation_id = c.id
)
WHERE EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = c.id
);

-- Step 3: Clean up all old RLS policies from related tables.
-- We are dropping everything to start from a clean slate.
DROP POLICY IF EXISTS "Allow insert for conversation members" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow read access to own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Allow insert for conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can delete themselves from conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can insert conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update their own conversation member" ON public.conversation_members;
DROP POLICY IF EXISTS "Allow read access to own conversation members" ON public.conversation_members;

DROP POLICY IF EXISTS "Allow read access to messages in user's conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow insert access for conversation members" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Step 4: Drop the old 'conversation_members' table and the unused helper function.
DROP TABLE IF EXISTS public.conversation_members;
DROP FUNCTION IF EXISTS public.is_conversation_member(uuid);

-- Step 5: Create the new, clean, and modern RLS policies.
-- These policies are based on the official Supabase migration file and use the 'participants' array.

-- Conversations Policies
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can create new conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE conversations.id = messages.conversation_id
        AND auth.uid() = ANY(conversations.participants)
    )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
    (sender_id = auth.uid()) AND
    (EXISTS (
        SELECT 1 FROM public.conversations
        WHERE conversations.id = messages.conversation_id
        AND auth.uid() = ANY(conversations.participants)
    ))
);

-- Step 6: Update the main function to use the new schema.
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE ( id uuid, participants uuid[], created_at timestamptz, updated_at timestamptz )
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.participants, c.created_at, c.updated_at
    FROM public.conversations c
    WHERE c.participants @> ARRAY[auth.uid()]
    ORDER BY c.updated_at DESC;
END;
$$;

COMMIT; -- Finalize the transaction.

SELECT 'SUCCESS: Database migration to modern schema is complete.' as result;
