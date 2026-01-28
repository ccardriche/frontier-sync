-- Create storage bucket for proof of delivery files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pod-files', 'pod-files', true);

-- Allow authenticated users to upload to pod-files bucket
CREATE POLICY "Authenticated users can upload PoD files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pod-files');

-- Allow public read access to PoD files
CREATE POLICY "Public can view PoD files"
ON storage.objects FOR SELECT
USING (bucket_id = 'pod-files');

-- Allow users to update their own PoD files
CREATE POLICY "Users can update own PoD files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pod-files' AND auth.uid()::text = (storage.foldername(name))[1]);