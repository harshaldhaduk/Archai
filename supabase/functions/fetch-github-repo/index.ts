import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fetch-github-repo] Received request');
    
    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[fetch-github-repo] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`[fetch-github-repo] Authenticated user: ${user.id}`);

    const { githubUrl } = await req.json();

    if (!githubUrl) {
      return new Response(
        JSON.stringify({ error: 'GitHub URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse GitHub URL to extract owner and repo
    // Supports: https://github.com/owner/repo, github.com/owner/repo, owner/repo
    const match = githubUrl.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const [, owner, repoRaw] = match;
    const repo = repoRaw.replace(/\.git$/, ''); // Remove .git suffix if present

    console.log(`[fetch-github-repo] Fetching ${owner}/${repo}`);

    // Fetch repository zipball from GitHub API
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;
    console.log(`[fetch-github-repo] Requesting: ${githubApiUrl}`);
    
    let githubResponse;
    try {
      githubResponse = await fetch(githubApiUrl, {
        headers: {
          'User-Agent': 'Archai-CodeSight',
          'Accept': 'application/vnd.github+json',
        },
        redirect: 'follow',
      });
    } catch (fetchError) {
      console.error('[fetch-github-repo] Network error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Unable to connect to GitHub. Please check your internet connection and try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    if (!githubResponse.ok) {
      console.error(`[fetch-github-repo] GitHub API error: ${githubResponse.status}`);
      
      if (githubResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Repository not found. Please check the URL and ensure the repository is public.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      if (githubResponse.status === 403 || githubResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'GitHub API rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      return new Response(
        JSON.stringify({ error: `Failed to fetch repository from GitHub: ${githubResponse.statusText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: githubResponse.status }
      );
    }

    console.log('[fetch-github-repo] Repository downloaded from GitHub');

    // Get the ZIP file as blob
    const zipBlob = await githubResponse.blob();
    const zipBuffer = await zipBlob.arrayBuffer();
    const zipFile = new Uint8Array(zipBuffer);

    // Upload to Supabase storage with user-specific path
    const fileName = `${owner}-${repo}.zip`;
    const filePath = `${user.id}/${crypto.randomUUID()}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('codebases')
      .upload(filePath, zipFile, {
        contentType: 'application/zip',
        upsert: false,
      });

    if (uploadError) {
      console.error('[fetch-github-repo] Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: `Failed to store repository: ${uploadError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[fetch-github-repo] Repository stored at: ${filePath}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        filePath,
        fileName,
        githubUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[fetch-github-repo] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
