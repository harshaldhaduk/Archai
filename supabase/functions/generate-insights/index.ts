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
    console.log('[generate-insights] Received insights request');
    
    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const { analysisId, graphData } = await req.json();

    if (!analysisId || !graphData) {
      throw new Error('Missing required parameters: analysisId and graphData');
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
      console.error('[generate-insights] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`[generate-insights] Authenticated user: ${user.id}`);

    // Get OPENAI_API_KEY from environment
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Prepare context for AI
    const servicesList = graphData.nodes
      .map((node: any) => `- ${node.data.label} (${node.data.type}): ${node.data.description || 'No description'}`)
      .join('\n');

    const edgesInfo = graphData.edges.length > 0 
      ? `\nDependencies: ${graphData.edges.length} connections between services`
      : '\nNo explicit dependencies defined';

    const prompt = `Analyze this software architecture and provide key insights:

Services detected:
${servicesList}
${edgesInfo}

Provide a concise analysis covering:
1. Overall architecture pattern (e.g., microservices, monolith, event-driven)
2. Key strengths of this architecture
3. Potential scalability concerns
4. Security considerations
5. Recommended improvements

Keep the analysis under 200 words and focus on actionable insights.`;

    console.log('[generate-insights] Calling OpenAI API...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software architect specializing in system design and architecture analysis. Provide clear, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-insights] AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your workspace.');
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content;

    if (!insights) {
      throw new Error('No insights generated from AI');
    }

    console.log('[generate-insights] AI insights generated successfully');

    // Update the analysis with insights
    const { error: updateError } = await supabase
      .from('codebase_analyses')
      .update({ ai_insights: insights })
      .eq('id', analysisId);

    if (updateError) {
      console.error('[generate-insights] Database update error:', updateError);
      throw new Error(`Failed to save insights: ${updateError.message}`);
    }

    console.log('[generate-insights] Insights saved to database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[generate-insights] Error:', error);
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
