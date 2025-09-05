-- This script deletes the single RLS policy that is causing the infinite recursion error.

DROP POLICY "Users can view members of their conversations" ON public.conversation_members;

SELECT 'The recursive policy has been successfully deleted. The app should work now.' as result;
