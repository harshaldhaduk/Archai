import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as yaml from "https://deno.land/std@0.208.0/yaml/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceConfig {
  image?: string;
  build?: string | { context: string };
  ports?: string[];
  depends_on?: string[] | Record<string, any>;
  environment?: Record<string, string> | string[];
}

interface DockerCompose {
  services: Record<string, ServiceConfig>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[parse-architecture] Received request');
    
    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { filePath, fileName, type } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[parse-architecture] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`[parse-architecture] Authenticated user: ${user.id}`);

    let graphData: any;

    if (type === 'demo') {
      // Return enhanced mock data for demo
      graphData = generateDemoGraph();
    } else {
      // Download and parse the ZIP file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('codebases')
        .download(filePath);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      console.log('[parse-architecture] File downloaded, parsing...');

      // Extract docker-compose.yml from ZIP
      const arrayBuffer = await fileData.arrayBuffer();
      const zipData = new Uint8Array(arrayBuffer);
      
      // Look for docker-compose files
      let dockerComposeContent: string | null = null;
      
      try {
        const text = new TextDecoder().decode(zipData);
        if (text.includes('version:') && text.includes('services:')) {
          dockerComposeContent = text;
        }
      } catch (e) {
        console.log('[parse-architecture] Not a text file, attempting ZIP extraction');
      }

      if (!dockerComposeContent) {
        console.log('[parse-architecture] No docker-compose found, attempting to infer structure');
        graphData = await inferRepositoryStructure(zipData, fileName);
      } else {
        // Parse docker-compose.yml
        const compose = yaml.parse(dockerComposeContent) as DockerCompose;
        graphData = parseDockerCompose(compose);
        
        // If only one service found, enhance with repository structure
        if (graphData.nodes.length <= 1) {
          console.log('[parse-architecture] Single service detected, inferring additional structure');
          graphData = await inferRepositoryStructure(zipData, fileName);
        }
      }
    }

    // Save analysis to database
    const { data: analysis, error: dbError } = await supabase
      .from('codebase_analyses')
      .insert({
        file_name: fileName,
        file_path: filePath,
        analysis_type: type,
        graph_data: graphData,
        user_id: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[parse-architecture] Database error:', dbError);
      throw new Error(`Failed to save analysis: ${dbError.message}`);
    }

    console.log('[parse-architecture] Analysis completed and saved');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId: analysis.id,
        graphData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[parse-architecture] Error:', error);
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

function parseDockerCompose(compose: DockerCompose) {
  const nodes: any[] = [];
  const edges: any[] = [];
  const serviceNames = Object.keys(compose.services);
  
  // Position services in a grid
  const cols = Math.ceil(Math.sqrt(serviceNames.length));
  
  serviceNames.forEach((serviceName, index) => {
    const service = compose.services[serviceName];
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Determine service type based on name and config
    let type: 'service' | 'database' | 'api' | 'llm' = 'service';
    const lowerName = serviceName.toLowerCase();
    
    if (lowerName.includes('postgres') || lowerName.includes('mysql') || lowerName.includes('mongo') || lowerName.includes('redis') || lowerName.includes('db')) {
      type = 'database';
    } else if (lowerName.includes('api') || lowerName.includes('gateway')) {
      type = 'api';
    } else if (lowerName.includes('ai') || lowerName.includes('llm') || lowerName.includes('ml')) {
      type = 'llm';
    }
    
    // Get dependencies
    const dependencies: string[] = [];
    if (service.depends_on) {
      if (Array.isArray(service.depends_on)) {
        dependencies.push(...service.depends_on);
      } else {
        dependencies.push(...Object.keys(service.depends_on));
      }
    }
    
    nodes.push({
      id: `service-${index}`,
      type: 'custom',
      position: { x: col * 300 + 100, y: row * 200 + 100 },
      data: {
        label: serviceName,
        description: `Service: ${serviceName}. Image: ${service.image || 'custom build'}. Ports: ${service.ports?.join(', ') || 'none'}`,
        type,
        connections: dependencies.length,
        dependencies,
        codePath: service.build ? `./${typeof service.build === 'string' ? service.build : service.build.context}` : undefined,
      },
    });
    
    // Create edges for dependencies
    dependencies.forEach(dep => {
      const depIndex = serviceNames.indexOf(dep);
      if (depIndex !== -1) {
        edges.push({
          id: `e-${index}-${depIndex}`,
          source: `service-${index}`,
          target: `service-${depIndex}`,
          animated: type === 'llm' || type === 'api',
          style: { stroke: type === 'database' ? 'hsl(267 84% 65%)' : 'hsl(191 91% 55%)' },
        });
      }
    });
  });
  
  return { nodes, edges };
}

async function inferRepositoryStructure(zipData: Uint8Array, fileName: string) {
  console.log('[parse-architecture] Inferring repository structure from ZIP contents');
  
  try {
    // Convert ZIP to text and look for directory patterns
    const text = new TextDecoder('utf-8', { fatal: false }).decode(zipData);
    const projectName = fileName.replace('.zip', '').replace(/.*-/, '');
    
    // Common directory patterns to look for
    const dirPatterns = [
      { pattern: /(?:^|\n)([^\/\n]*\/)(frontend|client|web|ui)\//, type: 'service', role: 'Frontend' },
      { pattern: /(?:^|\n)([^\/\n]*\/)(backend|server|api)\//, type: 'api', role: 'Backend' },
      { pattern: /(?:^|\n)([^\/\n]*\/)(database|db|sql)\//, type: 'database', role: 'Database' },
      { pattern: /(?:^|\n)([^\/\n]*\/)(ml|ai|models)\//, type: 'llm', role: 'AI/ML' },
    ];
    
    const detectedDirs: Array<{ name: string; type: string; role: string; techStack: string[] }> = [];
    
    // Detect directories
    for (const { pattern, type, role } of dirPatterns) {
      const match = text.match(pattern);
      if (match) {
        const dirName = match[2];
        const techStack: string[] = [];
        
        // Look for tech indicators near this directory
        const dirContext = text.slice(Math.max(0, match.index! - 500), match.index! + 2000);
        
        if (dirContext.includes('package.json')) {
          techStack.push('Node.js/JavaScript');
          if (dirContext.includes('react')) techStack.push('React');
          if (dirContext.includes('vue')) techStack.push('Vue');
          if (dirContext.includes('express')) techStack.push('Express');
        }
        if (dirContext.includes('requirements.txt') || dirContext.includes('.py')) {
          techStack.push('Python');
          if (dirContext.includes('django')) techStack.push('Django');
          if (dirContext.includes('flask')) techStack.push('Flask');
        }
        if (dirContext.includes('go.mod')) techStack.push('Go');
        if (dirContext.includes('pom.xml') || dirContext.includes('build.gradle')) techStack.push('Java');
        if (dirContext.includes('Cargo.toml')) techStack.push('Rust');
        
        detectedDirs.push({
          name: `${projectName}-${dirName}`,
          type,
          role,
          techStack,
        });
        
        console.log(`[parse-architecture] Detected ${role}: ${dirName} with tech: ${techStack.join(', ')}`);
      }
    }
    
    // If we found structure, create graph
    if (detectedDirs.length > 0) {
      const nodes: any[] = [];
      const edges: any[] = [];
      const cols = Math.ceil(Math.sqrt(detectedDirs.length));
      
      detectedDirs.forEach((dir, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Infer dependencies based on typical patterns
        const dependencies: string[] = [];
        if (dir.role === 'Frontend' && detectedDirs.some(d => d.role === 'Backend')) {
          dependencies.push(detectedDirs.find(d => d.role === 'Backend')!.name);
        }
        if (dir.role === 'Backend' && detectedDirs.some(d => d.role === 'Database')) {
          dependencies.push(detectedDirs.find(d => d.role === 'Database')!.name);
        }
        if (dir.role === 'Backend' && detectedDirs.some(d => d.role === 'AI/ML')) {
          dependencies.push(detectedDirs.find(d => d.role === 'AI/ML')!.name);
        }
        
        nodes.push({
          id: `inferred-${index}`,
          type: 'custom',
          position: { x: col * 300 + 100, y: row * 200 + 100 },
          data: {
            label: dir.name,
            description: `${dir.role} module. Tech stack: ${dir.techStack.join(', ') || 'Not detected'}. Inferred from repository structure.`,
            type: dir.type,
            connections: dependencies.length,
            dependencies,
            codePath: `./${dir.name.split('-').pop()}`,
          },
        });
        
        // Create edges for dependencies
        dependencies.forEach(dep => {
          const depIndex = detectedDirs.findIndex(d => d.name === dep);
          if (depIndex !== -1) {
            edges.push({
              id: `e-${index}-${depIndex}`,
              source: `inferred-${index}`,
              target: `inferred-${depIndex}`,
              animated: dir.type === 'llm' || dir.type === 'api',
              style: { stroke: dir.type === 'database' ? 'hsl(267 84% 65%)' : 'hsl(191 91% 55%)' },
            });
          }
        });
      });
      
      console.log(`[parse-architecture] Generated ${nodes.length} inferred nodes with ${edges.length} edges`);
      return { nodes, edges };
    }
    
    // Fallback to simple single-node graph
    console.log('[parse-architecture] No structure detected, generating simple graph');
    return generateSimpleGraph(fileName);
    
  } catch (error) {
    console.error('[parse-architecture] Error inferring structure:', error);
    return generateSimpleGraph(fileName);
  }
}

function generateSimpleGraph(fileName: string) {
  return {
    nodes: [
      {
        id: '1',
        type: 'custom',
        position: { x: 250, y: 0 },
        data: {
          label: fileName.replace('.zip', ''),
          description: 'Main application codebase uploaded for analysis.',
          type: 'service',
          connections: 0,
          dependencies: [],
        },
      },
    ],
    edges: [],
  };
}

function generateDemoGraph() {
  return {
    nodes: [
      {
        id: '1',
        type: 'custom',
        position: { x: 250, y: 0 },
        data: {
          label: 'API Gateway',
          description: 'Main entry point handling authentication, rate limiting, and routing requests to microservices.',
          type: 'service',
          connections: 4,
          dependencies: ['Auth Service', 'User Service'],
          codePath: './services/api-gateway',
        },
      },
      {
        id: '2',
        type: 'custom',
        position: { x: 100, y: 150 },
        data: {
          label: 'Auth Service',
          description: 'Manages user authentication and authorization using OAuth2 and JWT tokens.',
          type: 'service',
          connections: 2,
          dependencies: ['PostgreSQL'],
          codePath: './services/auth',
        },
      },
      {
        id: '3',
        type: 'custom',
        position: { x: 400, y: 150 },
        data: {
          label: 'User Service',
          description: 'CRUD operations for user profiles, preferences, and account settings.',
          type: 'service',
          connections: 3,
          dependencies: ['PostgreSQL', 'Redis Cache'],
          codePath: './services/users',
        },
      },
      {
        id: '4',
        type: 'custom',
        position: { x: 250, y: 300 },
        data: {
          label: 'AI Processor',
          description: 'LLM-powered service for natural language understanding and content generation.',
          type: 'llm',
          connections: 2,
          dependencies: ['OpenAI API', 'Vector DB'],
          codePath: './services/ai-processor',
        },
      },
      {
        id: '5',
        type: 'custom',
        position: { x: 100, y: 450 },
        data: {
          label: 'PostgreSQL',
          description: 'Primary relational database storing user data and application state.',
          type: 'database',
          connections: 3,
          codePath: './infrastructure/postgres',
        },
      },
      {
        id: '6',
        type: 'custom',
        position: { x: 400, y: 450 },
        data: {
          label: 'Redis Cache',
          description: 'In-memory data store for caching and session management.',
          type: 'database',
          connections: 2,
          codePath: './infrastructure/redis',
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'hsl(191 91% 55%)' } },
      { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'hsl(191 91% 55%)' } },
      { id: 'e2-5', source: '2', target: '5', style: { stroke: 'hsl(267 84% 65%)' } },
      { id: 'e3-5', source: '3', target: '5', style: { stroke: 'hsl(267 84% 65%)' } },
      { id: 'e3-6', source: '3', target: '6', style: { stroke: 'hsl(267 84% 65%)' } },
      { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: 'hsl(24 95% 53%)' } },
    ],
  };
}
