-- This query finds the specific 1-on-1 conversation between the two real users.

SELECT id, participants
FROM public.conversations
WHERE
  -- Find the conversation containing both user UUIDs
  participants @> ARRAY['7114a334-f6b9-4927-b178-9570248ddc09'::uuid, '43fbfe7a-51c8-49a7-9491-eff946189bbb'::uuid]
  -- Ensure it's not a group chat
  AND array_length(participants, 1) = 2;
