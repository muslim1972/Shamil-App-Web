-- This script creates the user_conversation_settings table for per-user archiving.

CREATE TABLE IF NOT EXISTS public.user_conversation_settings (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    is_archived boolean DEFAULT FALSE,
    PRIMARY KEY (user_id, conversation_id)
);

-- Enable RLS for the new table
ALTER TABLE public.user_conversation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_conversation_settings

-- Allow users to view their own settings
CREATE POLICY "Users can view their own conversation settings"
ON public.user_conversation_settings FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert/update their own settings
CREATE POLICY "Users can manage their own conversation settings"
ON public.user_conversation_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

SELECT 'Table user_conversation_settings and its RLS policies created successfully.' as result;
