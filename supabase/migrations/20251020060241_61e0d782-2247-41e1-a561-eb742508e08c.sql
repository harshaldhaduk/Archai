-- Create storage bucket for codebase uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('codebases', 'codebases', false);

-- Create RLS policies for codebase bucket
CREATE POLICY "Allow public upload to codebases"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'codebases');

CREATE POLICY "Allow public read from codebases"
ON storage.objects FOR SELECT
USING (bucket_id = 'codebases');

-- Create table to store analysis results
CREATE TABLE public.codebase_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT,
  github_url TEXT,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('upload', 'github', 'demo')),
  graph_data JSONB NOT NULL,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.codebase_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analyses
CREATE POLICY "Allow public insert on analyses"
ON public.codebase_analyses FOR INSERT
WITH CHECK (true);

-- Allow anyone to read analyses
CREATE POLICY "Allow public read on analyses"
ON public.codebase_analyses FOR SELECT
USING (true);

-- Allow anyone to update analyses (for adding AI insights)
CREATE POLICY "Allow public update on analyses"
ON public.codebase_analyses FOR UPDATE
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.codebase_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();