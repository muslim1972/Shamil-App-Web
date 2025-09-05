-- This command notifies PostgREST to reload its schema cache.
-- This can help ensure that all new RLS policies are applied correctly for real-time.

NOTIFY pgrst, 'reload schema';
