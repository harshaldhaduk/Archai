-- Add user_id column to codebase_analyses table
ALTER TABLE public.codebase_analyses
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow public read on analyses" ON public.codebase_analyses;
DROP POLICY IF EXISTS "Allow public insert on analyses" ON public.codebase_analyses;
DROP POLICY IF EXISTS "Allow public update on analyses" ON public.codebase_analyses;

-- Create user-scoped RLS policies
CREATE POLICY "Users can view own analyses"
ON public.codebase_analyses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own analyses"
ON public.codebase_analyses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analyses"
ON public.codebase_analyses FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own analyses"
ON public.codebase_analyses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add storage RLS policies for user-based file isolation
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'codebases' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'codebases' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'codebases' AND
  (storage.foldername(name))[1] = auth.uid()::text
);