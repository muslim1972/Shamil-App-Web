-- This query finds the specific 1-on-1 conversation between testuser1 and testuser2.

SELECT id, participants
FROM public.conversations
WHERE
  -- The '@>' operator checks if the participants array contains all elements of the given array
  participants @> ARRAY['d28d2d11-cdc6-4d4c-9bc4-7305b8124c0d'::uuid, 'c088ae46-930e-45de-971d-4e80e44e32f4'::uuid]
  -- We also check the length to ensure it's a 1-on-1 chat and not a group chat
  AND array_length(participants, 1) = 2;
