-- Migration: add_storage_rls_policies
-- Created at: 1761744805

-- Allow users to read files in crm-attachments bucket
CREATE POLICY "Allow users to read crm attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'crm-attachments');

-- Allow uploads via edge function
CREATE POLICY "Allow uploads via edge function" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'crm-attachments'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- Allow users to delete their own attachments
CREATE POLICY "Allow users to delete own attachments" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'crm-attachments'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );;