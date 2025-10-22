import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Wand2 } from "lucide-react";
import { ArchitectureGraph } from "@/components/ArchitectureGraph";
import { ServiceDetails } from "@/components/ServiceDetails";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Node } from "@xyflow/react";
import { generateInsights } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Analyze = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  const { analysisId, graphData: initialGraphData, fileName, githubUrl, type, readme, repoDescription } = location.state || {};

  useEffect(() => {
    if (!type) {
      navigate("/");
      return;
    }

    if (initialGraphData) {
      setGraphData(initialGraphData);
    }
  }, [type, initialGraphData, navigate]);

  const handleGenerateInsights = async () => {
    if (!graphData) return;

    setIsGeneratingInsights(true);
    
    try {
      toast({
        title: "Generating AI insights...",
        description: "Analyzing architecture patterns and best practices",
      });

      // For demo and GitHub mode, use mock insights
      if (type === 'demo' || type === 'github') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate domain-aware onboarding guide
        const nodeCount = graphData.nodes.length;
        const edgeCount = graphData.edges.length;
        const nodeTypes = graphData.nodes.map((n: any) => n.data.type);
        const hasDatabase = nodeTypes.includes('database');
        const hasApi = nodeTypes.includes('api');
        const hasLlm = nodeTypes.includes('llm');
        const repoName = fileName || githubUrl || 'this project';
        
        // Extract context from README
        const extractReadmeContext = (readmeText: string) => {
          if (!readmeText) return { purpose: '', features: [], techStack: [], keywords: '' };
          
          const lower = readmeText.toLowerCase();
          
          // Extract purpose from first few paragraphs
          const lines = readmeText.split('\n').filter(l => l.trim());
          const descLines = lines.slice(0, 15).join(' ').toLowerCase();
          
          // Extract features (lines starting with - or * in first section)
          const features = lines
            .filter(l => l.match(/^[\-\*]\s+/))
            .slice(0, 8)
            .map(l => l.replace(/^[\-\*]\s+/, '').trim());
          
          // Extract tech stack mentions
          const techStack: string[] = [];
          if (lower.match(/react|next\.?js|vue|angular/)) techStack.push('React/Frontend');
          if (lower.match(/node\.?js|express|fastify/)) techStack.push('Node.js');
          if (lower.match(/python|django|flask|fastapi/)) techStack.push('Python');
          if (lower.match(/postgres|mysql|mongodb|redis/)) techStack.push('Database');
          if (lower.match(/docker|kubernetes|k8s/)) techStack.push('Containers');
          if (lower.match(/gpt|openai|llm|ai|anthropic|claude/)) techStack.push('AI/LLM');
          if (lower.match(/supabase|firebase/)) techStack.push('Backend-as-a-Service');
          
          return { purpose: descLines, features, techStack, keywords: lower };
        };
        
        const readmeContext = extractReadmeContext(readme || '');
        
        // Infer project domain from component names, structure, and README
        const componentNames = graphData.nodes.map((n: any) => n.data.label.toLowerCase()).join(' ');
        const descriptions = graphData.nodes.map((n: any) => (n.data.description || '').toLowerCase()).join(' ');
        const allText = `${componentNames} ${descriptions} ${repoName.toLowerCase()} ${repoDescription?.toLowerCase() || ''} ${readmeContext.keywords}`;
        
        let projectType = 'application';
        let projectPurpose = 'manage and organize functionality';
        let userFacing = 'users';
        let specificContext = '';
        
        // Detect domain based on keywords and README content
        if (allText.match(/dashboard|admin|panel|analytics|metrics|chart/i)) {
          projectType = 'dashboard application';
          projectPurpose = 'visualize data and provide insights through interactive charts and metrics';
          userFacing = 'administrators and analysts';
          if (readmeContext.purpose.match(/monitor|track|observe/)) {
            specificContext = 'It monitors system performance and displays real-time metrics.';
          }
        } else if (allText.match(/scraper|crawler|fetch|extract|parse.*news|article/i)) {
          projectType = 'web scraper';
          projectPurpose = 'automatically collect and process data from websites';
          userFacing = 'data analysts';
          if (readmeContext.purpose.match(/stock|ticker|financial|trading/)) {
            specificContext = 'It focuses on financial data, tracking stock tickers and market news.';
          } else if (readmeContext.purpose.match(/news|article|headline/)) {
            specificContext = 'It collects news articles and headlines from various sources.';
          }
        } else if (allText.match(/chat|bot|message|conversation|ai.*response/i) && hasLlm) {
          projectType = 'chatbot or conversational AI';
          projectPurpose = 'interact with users through natural language conversations';
          userFacing = 'end users seeking information or assistance';
          if (readmeContext.purpose.match(/customer.*support|help.*desk/)) {
            specificContext = 'It provides automated customer support and answers common questions.';
          } else if (readmeContext.purpose.match(/assistant|copilot/)) {
            specificContext = 'It acts as an AI assistant to help users complete tasks.';
          }
        } else if (allText.match(/e-?commerce|shop|cart|checkout|product|order|payment/i)) {
          projectType = 'e-commerce platform';
          projectPurpose = 'enable online shopping with product catalogs, cart management, and checkout';
          userFacing = 'shoppers and store administrators';
        } else if (allText.match(/blog|cms|content|article|post|publish/i)) {
          projectType = 'content management system';
          projectPurpose = 'create, edit, and publish content';
          userFacing = 'content creators and readers';
        } else if (allText.match(/auth|login|signup|user.*management|profile/i) && !hasLlm) {
          projectType = 'authentication service';
          projectPurpose = 'manage user accounts, authentication, and permissions';
          userFacing = 'application users';
        } else if (hasLlm && allText.match(/generate|create|analyze.*code|insight|architecture/i)) {
          projectType = 'AI-powered code analysis tool';
          projectPurpose = 'analyze codebases and generate intelligent insights about architecture';
          userFacing = 'developers and technical teams';
          if (readmeContext.purpose.match(/visuali[sz]e|graph|diagram/)) {
            specificContext = 'It creates visual representations of code structure and dependencies.';
          } else if (readmeContext.purpose.match(/documentation|explain/)) {
            specificContext = 'It generates documentation and explanations from source code.';
          }
        } else if (allText.match(/api.*gateway|microservice|orchestrat/i) && nodeCount > 5) {
          projectType = 'microservices platform';
          projectPurpose = 'coordinate multiple independent services';
          userFacing = 'other services and applications';
        } else if (hasApi && hasDatabase && !hasLlm) {
          projectType = 'web application';
          projectPurpose = 'provide online functionality through a user interface and API';
          userFacing = 'end users';
        }
        
        // Extract real-world use case from README if available
        let useCaseExample = '';
        if (readmeContext.purpose) {
          const purposeSnippet = readmeContext.purpose.split('.')[0];
          if (purposeSnippet.length > 20 && purposeSnippet.length < 200) {
            useCaseExample = purposeSnippet.trim();
          }
        }
        
        // Get actual component names from graph with full metadata
        const components = graphData.nodes.map((n: any) => ({
          name: n.data.label,
          type: n.data.type,
          deps: n.data.dependencies || [],
          codePath: n.data.codePath || '',
          description: n.data.description || '',
          connections: n.data.connections || 0
        }));
        
        // Detect duplicate/similar service names and group them
        const serviceGroups = new Map<string, typeof components>();
        components.forEach(comp => {
          // Normalize name (lowercase, remove common suffixes)
          const baseName = comp.name.toLowerCase()
            .replace(/[-_](service|client|server|api|sdk|integration|config|functions?)$/i, '');
          
          if (!serviceGroups.has(baseName)) {
            serviceGroups.set(baseName, []);
          }
          serviceGroups.get(baseName)!.push(comp);
        });
        
        // Find groups with multiple instances for special handling
        const duplicateGroups = Array.from(serviceGroups.entries())
          .filter(([_, group]) => group.length > 1)
          .map(([baseName, group]) => ({
            baseName,
            instances: group.map(comp => ({
              name: comp.name,
              path: comp.codePath,
              role: inferRole(comp.name, comp.codePath, comp.type),
              deps: comp.deps,
              connections: comp.connections
            }))
          }));
        
        // Helper to infer component role from name and path
        function inferRole(name: string, path: string, type: string): string {
          const lowerName = name.toLowerCase();
          const lowerPath = path.toLowerCase();
          
          if (lowerPath.includes('/client') || lowerPath.includes('/frontend') || lowerPath.includes('/src/integrations')) {
            return 'client-side';
          }
          if (lowerPath.includes('/server') || lowerPath.includes('/backend') || lowerPath.includes('/api')) {
            return 'server-side';
          }
          if (lowerPath.includes('/functions')) {
            return 'serverless function';
          }
          if (lowerName.includes('auth')) {
            return 'authentication';
          }
          if (lowerName.includes('storage') || lowerName.includes('upload')) {
            return 'file storage';
          }
          if (type === 'database') {
            return 'data persistence';
          }
          if (type === 'api') {
            return 'API layer';
          }
          
          return 'core module';
        }
        
        // Build relationship map
        const relationships: string[] = [];
        components.forEach(comp => {
          if (comp.deps.length > 0) {
            comp.deps.slice(0, 3).forEach(dep => {
              const depComp = components.find(c => c.name === dep);
              if (depComp) {
                const purpose = inferRelationshipPurpose(comp.type, depComp.type);
                relationships.push(`**${comp.name}** → **${dep}** for ${purpose}`);
              }
            });
          }
        });
        
        function inferRelationshipPurpose(sourceType: string, targetType: string): string {
          if (targetType === 'database') return 'data persistence';
          if (targetType === 'api') return 'external communication';
          if (targetType === 'llm') return 'AI processing';
          if (sourceType === 'api' && targetType === 'service') return 'business logic';
          return 'functionality';
        }
        
        // Find key components
        const rootComponent = components[0];
        const apiComponents = components.filter(c => c.type === 'api');
        const dbComponents = components.filter(c => c.type === 'database');
        const serviceComponents = components.filter(c => c.type === 'service');
        
        // Helper to describe component purpose in domain context with README awareness
        const describeComponent = (comp: typeof components[0], detailed: boolean = false) => {
          const name = comp.name;
          const lowerName = name.toLowerCase();
          const desc = comp.description?.toLowerCase() || '';
          
          if (projectType.includes('scraper')) {
            // Financial/Stock scraper specific
            if (specificContext.includes('financial') || specificContext.includes('stock')) {
              if (lowerName.match(/ticker|symbol/)) return detailed ? `finds and extracts stock ticker symbols (like AAPL, TSLA) from text or APIs` : `extracts stock tickers`;
              if (lowerName.match(/fetch|download|get/) && lowerName.match(/news|article/)) return detailed ? `connects to financial news APIs and downloads articles about specific stocks` : `fetches financial news`;
              if (lowerName.match(/sentiment|analyz/)) return detailed ? `analyzes whether news about a stock is positive, negative, or neutral using NLP` : `analyzes sentiment`;
              if (lowerName.match(/price|quote|market/)) return detailed ? `retrieves current and historical stock prices from market data APIs` : `fetches stock prices`;
            }
            // Generic scraper
            if (lowerName.match(/fetch|download|get|crawl/)) return detailed ? `connects to websites or APIs and downloads the raw data` : `fetches data from sources`;
            if (lowerName.match(/parse|extract/)) return detailed ? `parses HTML/JSON and pulls out the specific information you need` : `extracts key information`;
            if (lowerName.match(/stor|save|db|database/)) return detailed ? `saves all the collected data to a database for later analysis` : `stores collected data`;
            if (lowerName.match(/clean|process|transform/)) return detailed ? `cleans messy data, removes duplicates, and standardizes formats` : `cleans and processes data`;
          } else if (projectType.includes('dashboard') || projectType.includes('analytics')) {
            if (lowerName.match(/chart|visual|graph/)) return detailed ? `renders interactive charts and graphs to visualize trends and patterns` : `displays data visually`;
            if (lowerName.match(/data|query/) || comp.type === 'database') return detailed ? `queries the database and aggregates numbers for display` : `retrieves data to show`;
            if (lowerName.match(/filter|search/)) return detailed ? `lets users filter data by date, category, or custom criteria` : `filters information`;
            if (lowerName.match(/export|report/)) return detailed ? `generates downloadable reports in PDF, CSV, or Excel format` : `exports reports`;
            if (lowerName.match(/auth|login/)) return detailed ? `manages user login and controls who can access which dashboards` : `handles authentication`;
          } else if (projectType.includes('chat') || projectType.includes('bot')) {
            if (lowerName.match(/message|chat|conversation/)) return detailed ? `manages the chat interface and message history` : `handles conversations`;
            if (lowerName.match(/llm|ai|gpt|claude/)) return detailed ? `sends user questions to AI (GPT/Claude) and gets intelligent responses` : `generates AI responses`;
            if (lowerName.match(/context|memory|session/)) return detailed ? `remembers the conversation history so the bot knows what you talked about earlier` : `tracks conversation context`;
            if (lowerName.match(/intent|understand/)) return detailed ? `figures out what the user is actually asking for (booking, info, help, etc.)` : `understands user intent`;
          } else if (projectType.includes('e-commerce')) {
            if (lowerName.match(/product|catalog|inventory/)) return detailed ? `manages the product catalog, prices, stock levels, and descriptions` : `manages products`;
            if (lowerName.match(/cart|basket/)) return detailed ? `keeps track of what customers have added to their cart` : `manages shopping cart`;
            if (lowerName.match(/payment|checkout|stripe/)) return detailed ? `processes credit card payments through Stripe/PayPal` : `handles payments`;
            if (lowerName.match(/order/)) return detailed ? `tracks orders from checkout through shipping to delivery` : `manages orders`;
          } else if (projectType.includes('code analysis')) {
            if (lowerName.match(/parse|analyz/) && !lowerName.match(/components/)) return detailed ? `parses source code files and understands the structure` : `analyzes code structure`;
            if (lowerName.match(/graph|visual/)) return detailed ? `creates visual diagrams showing how different parts connect` : `visualizes architecture`;
            if (lowerName.match(/insight|ai|llm/)) return detailed ? `uses AI to explain what the code does and suggest improvements` : `generates AI insights`;
            if (lowerName.match(/upload|fetch/)) return detailed ? `lets you upload your codebase or pull it from GitHub` : `handles codebase input`;
          }
          
          // Generic fallbacks with description hints
          if (desc.includes('api') || comp.type === 'api') return detailed ? `acts as the API layer that receives requests and routes them to the right handler` : `handles API requests`;
          if (desc.includes('database') || comp.type === 'database') return detailed ? `stores all the data persistently so nothing is lost when the app restarts` : `stores data`;
          if (desc.includes('auth') || lowerName.match(/auth|login/)) return detailed ? `manages user authentication (login, signup, password resets)` : `handles user authentication`;
          if (comp.type === 'llm') return detailed ? `processes AI-powered features using large language models` : `provides AI capabilities`;
          if (lowerName.match(/component|ui/) && desc.includes('reusable')) return detailed ? `contains reusable UI pieces (buttons, forms, etc.) used throughout the app` : `provides UI components`;
          
          return detailed ? `handles ${name.toLowerCase()} functionality for the application` : `manages ${name.toLowerCase()}`;
        };
        
        const mockInsights = `**Overview**:
This is a **${projectType}** designed to ${projectPurpose}. It's built for ${userFacing}.${specificContext ? ' ' + specificContext : ''}${useCaseExample ? '\n\n*From the README:* ' + useCaseExample : ''}

${readmeContext.techStack.length > 0 ? `**Tech Stack:** ${readmeContext.techStack.join(', ')}\n\n` : ''}Think of it like this: ${hasDatabase && hasApi ? `${apiComponents[0]?.name || 'The API'} is the front desk that takes requests, ${serviceComponents[0]?.name || 'the core modules'} do the actual work, and ${dbComponents[0]?.name || 'the database'} is where everything gets saved.` : hasApi ? `${apiComponents[0]?.name || 'The API'} routes everything like a switchboard, connecting ${userFacing} to the right features.` : hasDatabase ? `${dbComponents[0]?.name || 'The database'} acts as the system's memory, while other parts read and update it.` : `Each part handles a specific job, and they all communicate to get things done.`}${readmeContext.features.length > 0 ? `\n\n**Key Features:**\n${readmeContext.features.slice(0, 6).map(f => `- ${f.replace(/^[-*]\s*/, '')}`).join('\n')}` : ''}

**Processes**:
Here's the actual workflow for this ${projectType}:

${projectType.includes('scraper') && specificContext.includes('financial') ? 
`**Stock news scraping flow:**
1. **Find tickers** → ${components.find(c => c.name.toLowerCase().match(/ticker|symbol/))?.name || 'Ticker extractor'} scans text or calls APIs to get stock symbols (AAPL, TSLA, etc.)
2. **Fetch articles** → ${components.find(c => c.name.toLowerCase().match(/fetch|news/))?.name || 'News fetcher'} downloads articles about each ticker from financial news sites
3. **Analyze sentiment** → ${components.find(c => c.name.toLowerCase().match(/sentiment|analyz/))?.name || 'Sentiment analyzer'} reads each article and determines if it's positive/negative/neutral
4. **Get prices** → ${components.find(c => c.name.toLowerCase().match(/price|quote/))?.name || 'Price fetcher'} pulls current stock prices from market APIs
5. **Save everything** → ${dbComponents[0]?.name || 'Database'} stores tickers, articles, sentiment scores, and prices for later analysis` :
projectType.includes('scraper') ?
`**Web scraping flow:**
1. **Target sites** → ${components.find(c => c.name.toLowerCase().match(/crawl|fetch|download/))?.name || 'Crawler'} visits the websites you want to scrape
2. **Extract data** → ${components.find(c => c.name.toLowerCase().match(/parse|extract/))?.name || 'Parser'} pulls out the specific information from HTML/JSON
3. **Clean it up** → ${components.find(c => c.name.toLowerCase().match(/clean|process/))?.name || 'Processor'} removes duplicates, fixes formatting, validates data
4. **Store results** → ${dbComponents[0]?.name || 'Database'} saves everything for querying and analysis` :
projectType.includes('dashboard') ?
`**Dashboard data flow:**
1. **User opens dashboard** → ${apiComponents[0]?.name || 'Frontend'} loads and requests data
2. **Query database** → ${dbComponents[0]?.name || 'Database'} aggregates numbers, calculates metrics
3. **Format for display** → ${serviceComponents[0]?.name || 'Backend'} packages data into chart-ready format
4. **Render visualizations** → ${components.find(c => c.name.toLowerCase().match(/chart|visual|graph/))?.name || 'Chart components'} draw interactive graphs
5. **Filter/drill down** → User clicks to filter → repeats steps 2-4 with new criteria` :
projectType.includes('chat') || projectType.includes('bot') ?
`**Chat conversation flow:**
1. **User sends message** → ${components.find(c => c.name.toLowerCase().match(/message|chat/))?.name || 'Chat interface'} receives the text
2. **Load context** → ${components.find(c => c.name.toLowerCase().match(/context|memory/))?.name || 'Context manager'} retrieves previous messages to maintain conversation continuity
3. **Generate response** → ${components.find(c => c.type === 'llm')?.name || 'AI service'} sends everything to GPT/Claude and gets an intelligent reply
4. **Save conversation** → ${dbComponents[0]?.name || 'Database'} stores the exchange for future context
5. **Display to user** → Response appears in the chat interface` :
projectType.includes('code analysis') ?
`**Code analysis flow:**
1. **Upload/fetch code** → ${components.find(c => c.name.toLowerCase().match(/upload|fetch|github/))?.name || 'Input handler'} gets your codebase (zip upload or GitHub URL)
2. **Parse structure** → ${components.find(c => c.name.toLowerCase().match(/parse|analyz/))?.name || 'Parser'} reads files and understands how they're organized
3. **Build graph** → ${components.find(c => c.name.toLowerCase().match(/graph|visual/))?.name || 'Graph builder'} creates a visual map of components and connections
4. **Generate insights** → ${components.find(c => c.type === 'llm')?.name || 'AI service'} analyzes patterns and writes explanations
5. **Display results** → Interactive graph + AI insights appear in the UI` :
hasApi && hasDatabase ? 
`1. **Request arrives** → ${apiComponents[0]?.name || 'API'} receives it from ${userFacing}
2. **Route to handler** → ${serviceComponents[0]?.name || 'Service layer'} picks it up based on the endpoint
3. **Process** → Business logic validates, transforms, and prepares data
4. **Database interaction** → ${dbComponents[0]?.name || 'Database'} queries or updates based on needs
5. **Send response** → Results flow back through the chain to ${userFacing}` :
`1. **Initialize** → ${rootComponent?.name || 'Main module'} starts up
2. **Delegate work** → Each component (${components.slice(1, 3).map(c => c.name).join(', ')}) handles its part
3. **Coordinate** → They communicate and share data
4. **Complete** → Results get assembled and delivered`}

**Core Principles**:
Where to start exploring:

1. **${rootComponent?.name || 'Root folder'}** → Look at package.json or README to see what technologies this uses${hasApi ? ' (API framework' : ''}${hasDatabase ? hasApi ? ', database' : ' (database' : ''}${hasLlm ? ', AI' : ''}${hasApi || hasDatabase || hasLlm ? ')' : ''}. This tells you how to set it up.

2. **${serviceComponents.length > 0 ? serviceComponents[0].name : components.length > 1 ? components[1].name : 'Core modules'}** → This is where the main work happens. Look for files with names like "handler", "processor", or "controller".

${hasApi ? `3. **${apiComponents[0]?.name || 'API folder'}** → Check routes/ or api/ to see all the endpoints (URLs) this responds to. Each endpoint = one thing the system can do.

` : ''}${hasDatabase ? `${hasApi ? '4' : '3'}. **${dbComponents[0]?.name || 'Database schemas'}** → Look at migrations/ or models/ to see what data gets stored and how it's organized.

` : ''}${hasLlm ? `${(hasApi && hasDatabase) ? '5' : (hasApi || hasDatabase) ? '4' : '3'}. **${components.find(c => c.type === 'llm')?.name || 'AI files'}** → See how prompts are written and how AI responses get used.

` : ''}**Pro tip:** Search the code for "TODO" or "FIXME" comments—developers leave notes about things that need fixing or improving.

**Important Features**:
What each major part does for this ${projectType}:

${components.slice(0, 6).map((c, i) => {
  const pathHint = c.codePath ? ` (\`${c.codePath.split('/').slice(-2).join('/')}\`)` : '';
  const purpose = describeComponent(c, true); // detailed = true
  const depsText = c.deps.length > 0 ? `\n   → Depends on: ${c.deps.slice(0, 2).join(', ')}${c.deps.length > 2 ? ` +${c.deps.length - 2} more` : ''}` : '';
  return `**${i + 1}. ${c.name}**${pathHint}\n   ${purpose}${depsText}`;
}).join('\n\n')}
${components.length > 6 ? `\n\n*Plus ${components.length - 6} more component${components.length - 6 > 1 ? 's' : ''} handling ${projectType.includes('scraper') ? 'data collection and processing' : projectType.includes('dashboard') ? 'visualization and reporting' : projectType.includes('chat') ? 'conversation management' : 'supporting features'}.*` : ''}

${duplicateGroups.length > 0 ? `\n\n**Component Instances (Multiple Roles):**
${duplicateGroups.map(group => {
  return `\n*${group.baseName.charAt(0).toUpperCase() + group.baseName.slice(1)}* has ${group.instances.length} instances:\n${group.instances.map(inst => {
    const pathDisplay = inst.path.split('/').slice(-3).join('/');
    const depsText = inst.deps.length > 0 ? ` → connects to ${inst.deps[0]}${inst.deps.length > 1 ? ` +${inst.deps.length - 1} more` : ''}` : '';
    return `- **${inst.name}** (\`${pathDisplay}\`) — ${inst.role}${depsText}`;
  }).join('\n')}`;
}).join('\n')}

**Why multiple instances?** Different contexts need different configurations. Client-side code runs in browsers with limited permissions, while server-side has full access. Serverless functions are isolated instances that scale independently.
` : ''}
${hasDatabase ? `\n**Data Integrity**: ${dbComponents[0]?.name || 'The database'} is the source of truth. All writes must go through it. Never bypass with direct file writes or in-memory state that doesn't persist.` : ''}
${hasApi ? `\n**API Contracts**: ${apiComponents[0]?.name || 'External API'} interfaces are public contracts. Breaking changes require versioning (v1, v2) or deprecation periods.` : ''}
${hasLlm ? `\n**AI Limits**: LLM tokens cost money and have rate limits. Cache responses aggressively. Implement retries with exponential backoff.` : ''}
${relationships.length > 0 && relationships.length <= 6 ? `\n\n**Key Relationships:**
${relationships.slice(0, 6).map(rel => `- ${rel}`).join('\n')}` : ''}

**Risks**:
Things that commonly go wrong:

${hasApi ? `**When calling external services:**
- APIs have rate limits (like "slow down, you're asking too much"). If you hit one, wait a bit (1s, then 2s, then 4s) before trying again.
- Login tokens expire. Check if it's still valid before each use, don't wait for it to fail.
- Network requests can hang forever. Set a timeout (5-10 seconds max) so users aren't stuck waiting.
${hasApi && hasDatabase ? '- If the API crashes, it might leave database connections open. Always close them properly.' : ''}

` : ''}${hasDatabase ? `**Database problems:**
- Forgetting to close connections = "Too many connections" error and everything stops working.
- Slow queries happen when there's no index. A query that takes 100ms could take 10 seconds without one.
- Two people changing the same data at once = race condition. Use transactions to prevent this.
- Database upgrades (migrations) can fail halfway. Always have a way to undo them.

` : ''}${hasLlm ? `**AI quirks:**
- AI responses are slow (2-10 seconds). Show a loading spinner so users know it's working.
- AI has token limits (like character counts). Long inputs get cut off or rejected.
- Same question = different answer every time. Don't expect exact formatting.
- AI costs money per use. Monitor spending or you'll get a surprise bill.

` : ''}**Setup headaches:**
- Missing environment variables (.env file) cause weird "undefined" errors. Copy .env.example and fill in all values.
${hasApi ? '- CORS errors block browser requests. Add your local and production URLs to the allowed list.' : ''}
- "Port already in use" = something else is running on that port. Kill it or pick a different port.

**Deployment gotchas:**
${nodeCount > 5 ? '- Start services in order: database first, then API, then frontend. Add health checks so they wait for each other.' : '- Run database migrations BEFORE deploying new code. New code expects the updated database structure.'}
- Using different tech in development vs production hides bugs. Keep them the same (both use Postgres, not SQLite in dev).
${hasDatabase ? '- Test your backups monthly. Half of all backups are broken and you only find out when you need them.' : ''}
- Secrets accidentally committed to git can't be fully deleted. Change all passwords immediately and use git-secrets to prevent it.`;

        setInsights(mockInsights);
      } else {
        // For real uploads, call the actual Supabase function
        const result = await generateInsights(analysisId, graphData);
        setInsights(result.insights);
      }

      toast({
        title: "Insights generated!",
        description: "AI analysis complete",
      });
    } catch (error) {
      console.error('Insights generation error:', error);
      
      // Set fallback insights
      setInsights(`**System Overview**:
Unable to generate detailed onboarding insights for this repository. This may be due to a network issue or the repository structure being too complex to analyze automatically.

**Manual Exploration Tips**:
- Start by reading the README.md file in the root directory
- Look for package.json, requirements.txt, or similar files to identify the tech stack
- Check for docker-compose.yml or Dockerfile to understand deployment
- Explore the main source directory (often src/, app/, or lib/)
- Look for test files to understand expected behavior

**Common Next Steps**:
- Set up the development environment following the README
- Run the application locally to see it in action
- Read through configuration files (.env.example, config/)
- Review the API routes or entry points
- Check documentation folders if they exist`);
      
      toast({
        title: "Limited insights generated",
        description: "Showing basic guidance. Full analysis unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {fileName || githubUrl || "Demo Architecture"}
                </span>
              </div>
            </div>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights || !graphData}
              className="gap-2"
            >
              {isGeneratingInsights ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate AI Insights
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {!graphData ? (
          <Card className="glass-panel p-12 text-center space-y-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <h2 className="text-2xl font-semibold mb-2">Analyzing Architecture</h2>
              <p className="text-muted-foreground">
                Parsing files, detecting services, and generating structure...
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-panel p-6">
                <h2 className="text-xl font-semibold mb-4">Architecture Graph</h2>
                <div className="h-[500px]">
                  <ArchitectureGraph
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    onNodeClick={setSelectedNode}
                  />
                </div>
              </Card>

              {insights && (
                <InsightsPanel 
                  insights={insights} 
                  selectedNodeId={selectedNode?.id}
                  graphNodes={graphData.nodes}
                />
              )}
            </div>

            <div>
              <ServiceDetails node={selectedNode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analyze;
