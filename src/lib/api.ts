import { supabase } from "@/integrations/supabase/client";

export interface UploadResponse {
  success: boolean;
  filePath: string;
  fileName: string;
}

export interface ParseResponse {
  success: boolean;
  analysisId: string;
  graphData: {
    nodes: any[];
    edges: any[];
  };
}

export interface InsightsResponse {
  success: boolean;
  insights: string;
}

export async function uploadCodebase(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);

  const { data, error } = await supabase.functions.invoke('upload-codebase', {
    body: formData,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function parseArchitecture(
  filePath: string,
  fileName: string,
  type: 'upload' | 'github' | 'demo'
): Promise<ParseResponse> {
  const { data, error } = await supabase.functions.invoke('parse-architecture', {
    body: { filePath, fileName, type },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function generateInsights(
  analysisId: string,
  graphData: any
): Promise<InsightsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-insights', {
    body: { analysisId, graphData },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchGithubRepo(githubUrl: string): Promise<UploadResponse> {
  const { data, error } = await supabase.functions.invoke('fetch-github-repo', {
    body: { githubUrl },
  });

  if (error) throw new Error(error.message);
  return data;
}
