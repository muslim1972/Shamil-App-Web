-- =================================================================
--  FIX RLS POLICIES TO USE PARTICIPANTS ARRAY
-- =================================================================
-- This script updates the Row Level Security (RLS) policies
-- to work with the current database schema, which uses a 
-- `participants` array in the `conversations` table instead of
-- the old `conversation_members` table.
-- =================================================================

-- Step 1: Drop the obsolete helper function as it queries a deleted table.
DROP FUNCTION IF EXISTS public.is_conversation_member(uuid);

-- Step 2: Drop the old, incorrect policies from all relevant tables.
DROP POLICY IF EXISTS "Allow read access to own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow read access to messages in user's conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow insert access for conversation members" ON public.messages;
-- Drop any other old policies that might conflict
DROP POLICY IF EXISTS "Allow read access to own conversation members" ON public.conversation_members; -- This table is deleted, but policy might linger


-- Step 3: Create new, correct policies based on the `participants` array.

-- Policy 1: Allow users to see conversations they are a part of.
CREATE POLICY "Allow read access to own conversations" 
ON public.conversations FOR SELECT
USING (auth.uid() = ANY(participants));

-- Policy 2: Allow users to read messages in conversations they are a part of.
CREATE POLICY "Allow read access to messages in user's conversations" 
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id AND auth.uid() = ANY(c.participants)
  )
);

-- Policy 3: Allow users to send messages in conversations they are a part of.
CREATE POLICY "Allow insert for conversation participants" 
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id AND auth.uid() = ANY(c.participants)
  )
);


-- Final confirmation message
SELECT 'RLS policies have been successfully updated to use the participants array.' as result;
