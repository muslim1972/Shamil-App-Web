-- This script fixes the user synchronization issue by syncing existing users and creating a trigger for new ones.

-- Part 1: Manually sync the existing users who are missing from the public.users table.
-- This will fix the 4 users you just created.
INSERT INTO public.users (id, email, username)
SELECT
    id,
    email,
    raw_user_meta_data->>'username' AS username
FROM
    auth.users
WHERE
    id NOT IN (SELECT id FROM public.users);

-- Part 2: Create a trigger to automatically sync all *new* users in the future.

-- Step 2a: Create the function that the trigger will call.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;

-- Step 2b: Create the trigger on the auth.users table.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Successfully synced existing users and created a trigger for new users.' as result;
