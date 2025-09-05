-- This script creates the necessary security policies for the 'call-files' storage bucket.

-- Policy 1: Allow authenticated users to upload files.
-- This policy allows any logged-in user to insert files into the 'public' folder inside the bucket.
CREATE POLICY "Allow authenticated uploads to public folder" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'call-files' AND (storage.foldername(name))[1] = 'public' );

-- Policy 2: Allow authenticated users to view/download files.
-- The app uses signed URLs, but this is a good policy to have for general access control.
CREATE POLICY "Allow authenticated downloads from public folder"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'call-files' AND (storage.foldername(name))[1] = 'public' );

SELECT 'Storage policies for call-files bucket created successfully.' as result;
