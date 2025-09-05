-- This query directly simulates the logic of the RLS policy for the receiver.
-- It checks if a specific user is considered a participant in the specific conversation.
-- The expected result is 'true'.

SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE
        id = 'd9fc6d8a-6ced-4fc7-bfb0-9fbf418c1381'::uuid
        AND '43fbfe7a-51c8-49a7-9491-eff946189bbb'::uuid = ANY(participants)
) as "is_receiver_a_participant";
