-- Complete database setup after reset
-- This migration creates all necessary tables, functions, and policies

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participants uuid[] NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL DEFAULT '',
    created_at timestamptz DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- Create ensure_user_exists function
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found in auth.users';
    END IF;

    -- Insert or update user in public.users
    INSERT INTO public.users (id, email, username, created_at, updated_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            SPLIT_PART(au.email, '@', 1)
        ) as username,
        au.created_at,
        au.updated_at
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- Create check_user_exists function
CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- Create create_or_get_conversation_with_user function
CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id uuid;
    v_conversation_id uuid;
    v_participants uuid[];
BEGIN
    -- Get current user ID
    v_current_user_id := auth.uid();
    
    -- Check if users are different
    IF v_current_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;
    
    -- Check if other user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_other_user_id) THEN
        RAISE EXCEPTION 'Other user does not exist';
    END IF;
    
    -- Sort IDs to ensure consistency
    v_participants := ARRAY[
        LEAST(v_current_user_id, p_other_user_id),
        GREATEST(v_current_user_id, p_other_user_id)
    ];
    
    -- Look for existing conversation
    SELECT id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.participants @> v_participants
      AND c.participants <@ v_participants
    ORDER BY c.created_at DESC
    LIMIT 1;
    
    -- If no conversation exists, create new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participants, created_at, updated_at)
        VALUES (v_participants, NOW(), NOW())
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- Create get_user_conversations function
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id uuid,
    participants uuid[],
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.participants, c.created_at, c.updated_at
    FROM public.conversations c
    WHERE c.participants @> ARRAY[auth.uid()]
    ORDER BY c.updated_at DESC;
END;
$$;

-- Create has_user_conversations function
CREATE OR REPLACE FUNCTION public.has_user_conversations()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_count integer;
BEGIN
    SELECT COUNT(*) INTO conversation_count
    FROM public.conversations c
    WHERE c.participants @> ARRAY[auth.uid()];

    RETURN conversation_count > 0;
END;
$$;

-- Sync existing auth users to public.users
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'username',
        SPLIT_PART(au.email, '@', 1)
    ) as username,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_conversations() TO service_role;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = ANY(participants));

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE conversations.id = messages.conversation_id 
        AND auth.uid() = ANY(conversations.participants)
    )
);
CREATE POLICY "Users can send messages in own conversations" ON public.messages FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE conversations.id = messages.conversation_id 
        AND auth.uid() = ANY(conversations.participants)
    )
);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (user_id = auth.uid());