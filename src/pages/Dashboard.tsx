import { useState } from "react";
import { Upload, Github, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { UploadZone } from "@/components/UploadZone";
import { uploadCodebase, parseArchitecture, fetchGithubRepo } from "@/lib/api";

const Dashboard = () => {
  const [githubUrl, setGithubUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    
    try {
      toast({
        title: "Uploading...",
        description: `Processing ${file.name}`,
      });
      
      // Upload file
      const uploadResult = await uploadCodebase(file);
      
      toast({
        title: "Parsing architecture...",
        description: "Analyzing codebase structure",
      });
      
      // Parse architecture
      const parseResult = await parseArchitecture(
        uploadResult.filePath,
        uploadResult.fileName,
        'upload'
      );
      
      navigate("/analyze", { 
        state: { 
          analysisId: parseResult.analysisId,
          graphData: parseResult.graphData,
          fileName: file.name,
          type: "upload" 
        } 
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSubmit = async () => {
    if (!githubUrl) return;
    
    setIsLoading(true);
    
    try {
      // Parse GitHub URL
      const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        throw new Error("Invalid GitHub URL. Please use format: https://github.com/username/repository");
      }

      const [, owner, repo] = urlMatch;
      const cleanRepo = repo.replace(/\.git$/, '');

      toast({
        title: "Fetching repository...",
        description: `${owner}/${cleanRepo}`,
      });

      // Fetch repository info from GitHub API
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
      
      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          throw new Error("Repository not found. Please check the URL and ensure it's public.");
        } else if (repoResponse.status === 403) {
          throw new Error("GitHub API rate limit reached. Please try again in a few minutes.");
        }
        throw new Error(`GitHub API error: ${repoResponse.statusText}`);
      }

      const repoData = await repoResponse.json();

      toast({
        title: "Analyzing repository...",
        description: "Detecting architecture structure",
      });

      // Fetch repository tree to analyze structure
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${repoData.default_branch}?recursive=1`);
      
      if (!treeResponse.ok) {
        throw new Error("Failed to fetch repository structure");
      }

      const treeData = await treeResponse.json();
      const files = treeData.tree || [];

      // Try to fetch README for additional context
      let readmeContent = '';
      try {
        const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
          headers: {
            'Accept': 'application/vnd.github.v3.raw'
          }
        });
        if (readmeResponse.ok) {
          readmeContent = await readmeResponse.text();
          console.log('[GitHub] README fetched successfully');
        }
      } catch (readmeError) {
        console.log('[GitHub] No README found or error fetching it:', readmeError);
      }

      // Analyze repository structure
      const graphData = analyzeRepositoryStructure(files, repoData);

      navigate("/analyze", { 
        state: { 
          analysisId: `github-${owner}-${cleanRepo}-${Date.now()}`,
          graphData,
          githubUrl,
          fileName: `${owner}/${cleanRepo}`,
          type: "github",
          readme: readmeContent,
          repoDescription: repoData.description || ''
        } 
      });
    } catch (error) {
      console.error('GitHub fetch error:', error);
      toast({
        title: "Unable to fetch repository",
        description: error instanceof Error ? error.message : "Failed to fetch repository",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeRepositoryStructure = (files: any[], repoData: any) => {
    const nodes: any[] = [];
    const edges: any[] = [];
    let nodeId = 1;

    // Build directory tree structure
    const dirTree = new Map<string, any>();
    dirTree.set('', { files: [], subdirs: new Set() });
    
    files.forEach((file: any) => {
      if (file.type === 'tree') return;
      
      const parts = file.path.split('/');
      
      // Build the directory hierarchy
      for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join('/');
        const parentPath = i > 0 ? parts.slice(0, i).join('/') : '';
        
        // If this is a file (last part)
        if (i === parts.length - 1) {
          const dirPath = parentPath;
          if (!dirTree.has(dirPath)) {
            dirTree.set(dirPath, { files: [], subdirs: new Set() });
          }
          dirTree.get(dirPath).files.push(file);
        } else {
          // This is a directory
          if (!dirTree.has(currentPath)) {
            dirTree.set(currentPath, { files: [], subdirs: new Set() });
          }
          
          if (!dirTree.has(parentPath)) {
            dirTree.set(parentPath, { files: [], subdirs: new Set() });
          }
          
          dirTree.get(parentPath).subdirs.add(currentPath);
        }
      }
    });

    // Helper to get directory description
    const getDirDescription = (dirName: string, fileCount: number, fileTypes: string[], subdirCount: number) => {
      const hasMultipleFiles = fileCount > 3;
      const hasFewFiles = fileCount <= 3 && fileCount > 0;
      const hasSubdirs = subdirCount > 0;
      
      if (dirName.match(/^(src|source)$/i)) {
        return `The main source code directory - this is where all the application code lives. Contains ${fileCount} files including components, pages, utilities, and business logic${hasSubdirs ? `, organized into ${subdirCount} subdirectories` : ''}. This is the heart of the application where developers spend most of their time writing and maintaining code.`;
      } else if (dirName.match(/components?/i)) {
        return `Reusable UI components that are used throughout the application. Houses ${fileCount} component files like buttons, cards, modals, and forms${hasSubdirs ? `, with ${subdirCount} subdirectories for organization` : ''}. Each component is self-contained and can be imported wherever needed. When you need to add new UI elements or modify existing ones, this is where you'll work.`;
      } else if (dirName.match(/^ui$/i)) {
        return `The core UI component library containing ${fileCount} fundamental building blocks like buttons, inputs, cards, and dialogs. These primitive components follow a design system and provide consistent styling across the app. Other components combine these basic pieces to create more complex features.`;
      } else if (dirName.match(/pages?|routes?|views?/i)) {
        return `Application pages and routes - contains ${fileCount} page components. Each file represents a different page or route in the application. When users navigate to different URLs, these components are what get rendered. This is where you define what users see at each URL path.`;
      } else if (dirName.match(/contexts?/i)) {
        return `Global application state management using React Context API. Contains ${fileCount} context provider${fileCount > 1 ? 's' : ''} that handle data needed across multiple components, like user authentication, theme settings, or app configuration. Instead of passing data down through many component levels, contexts make it available anywhere in the component tree.`;
      } else if (dirName.match(/hooks?/i)) {
        return `Custom React Hooks - ${fileCount} reusable functions that encapsulate common logic like data fetching, form handling, or working with localStorage. When you see the same logic being repeated across components, it should probably become a custom hook here. These hooks make your components cleaner and more maintainable.`;
      } else if (dirName.match(/lib|utils|helpers?/i)) {
        return `Utility functions and helper methods - ${fileCount} files of pure JavaScript/TypeScript functions for common tasks like formatting dates, validating data, or making API calls. When you need a function that doesn't involve UI rendering, look here first. These are the building blocks used throughout the application.`;
      } else if (dirName.match(/api|server|backend/i)) {
        return `Backend API layer with ${fileCount} files handling server-side logic, database operations, and external API calls. Data gets processed, validated, and stored here before being sent to the frontend. If you're working on data flow, authentication, or third-party integrations, this is where you'll be.`;
      } else if (dirName.match(/public|static|assets/i)) {
        return `Static assets directory containing ${fileCount} files served directly to users. This includes images, fonts, favicon, and other assets that don't need to be processed by the build system. Files in this folder are accessible at the root URL path of your application.`;
      } else if (dirName.match(/styles?|css|scss/i)) {
        return `Styling files for visual design - ${fileCount} files containing themes, global styles, and component styling. May include CSS modules or styling configurations. Understanding how styling works here is key to maintaining consistent design throughout the application.`;
      } else if (dirName.match(/integrations?/i)) {
        return `External service integrations - ${fileCount} files connecting the application to services like payment processors, authentication providers, analytics tools, or cloud platforms${hasSubdirs ? `, organized into ${subdirCount} integration${subdirCount > 1 ? 's' : ''}` : ''}. Each integration has its own configuration, client setup, and helper functions.`;
      } else if (dirName.match(/supabase|firebase/i)) {
        return `Backend-as-a-Service configuration managing your backend infrastructure. Includes ${fileCount} files for database schemas, authentication setup, file storage, and serverless functions${hasSubdirs ? `, with ${subdirCount} organized sections` : ''}. All database queries, user authentication flows, and file uploads happen through code defined here.`;
      } else if (dirName.match(/functions?/i)) {
        return `Serverless/edge functions - ${fileCount} functions that run on-demand in response to HTTP requests or events. Each function is isolated and can be deployed independently. They're used for API endpoints, scheduled jobs, webhooks, or any server-side logic that doesn't require a full backend server.`;
      } else if (dirName.match(/types?|interfaces?/i)) {
        return `TypeScript type definitions - ${fileCount} files describing the shape of data structures used throughout the application, like user objects, API responses, and component props. Understanding these types helps prevent bugs by enforcing data contracts and providing autocomplete in your editor.`;
      } else if (dirName.match(/models?/i)) {
        return `Data models defining ${fileCount} database table structures, validation rules, and relationships between different data entities. These models represent core business objects like users, products, or orders, and control how data is stored and validated.`;
      } else if (dirName.match(/config|settings/i)) {
        return `Application configuration - ${fileCount} files containing environment-specific configs, build configurations, and feature flags. Modify these files to change application behavior across different environments like development, staging, or production.`;
      } else if (dirName.match(/test|spec|__tests__/i)) {
        return `Automated test suite with ${fileCount} test files verifying code works correctly. Includes unit tests for individual functions, integration tests for components working together, and end-to-end tests for full user workflows. Run these tests before deploying to catch bugs early.`;
      } else if (dirName.match(/docs?|documentation/i)) {
        return `Project documentation containing ${fileCount} files with API guides, architecture decisions, and setup instructions. Read through these to understand project context, design decisions, and how to contribute to the codebase.`;
      } else {
        // Generate context-aware descriptions for common directory patterns
        let contextDesc = '';
        const lowerName = dirName.toLowerCase();
        
        if (lowerName.match(/migrations?/)) {
          contextDesc = `Database migration files that track schema changes over time. Each migration represents a set of changes to database tables, columns, or indexes. Run these in order to update your database structure when deploying new versions. Contains ${fileCount} migration${fileCount > 1 ? 's' : ''}.`;
        } else if (lowerName.match(/middleware/)) {
          contextDesc = `Middleware functions that process requests before they reach your route handlers. These handle tasks like authentication verification, logging, error handling, and request validation. Houses ${fileCount} middleware function${fileCount > 1 ? 's' : ''} that run in a pipeline for every API call.`;
        } else if (lowerName.match(/schema/)) {
          contextDesc = `Database schemas defining the structure of your data tables, fields, and relationships. These schemas validate data before it's stored and ensure consistency. Contains ${fileCount} schema definition${fileCount > 1 ? 's' : ''} that act as blueprints for your database.`;
        } else if (lowerName.match(/service/)) {
          contextDesc = `Service layer containing ${fileCount} business logic module${fileCount > 1 ? 's' : ''}. Services encapsulate complex operations, coordinate between different parts of the app, and keep your controllers clean. This is where the real work happens - data processing, calculations, and orchestration.`;
        } else if (lowerName.match(/controller/)) {
          contextDesc = `Controllers handling ${fileCount} API endpoint group${fileCount > 1 ? 's' : ''}. Each controller receives requests, validates input, calls services to do the work, and formats responses. Think of these as traffic cops directing requests to the right place.`;
        } else if (lowerName.match(/router|route/)) {
          contextDesc = `Route definitions mapping ${fileCount} URL path${fileCount > 1 ? 's' : ''} to handler functions. When a request comes in, these routes determine which code should handle it based on the URL and HTTP method (GET, POST, etc.). This is the entry point for all API calls.`;
        } else if (lowerName.match(/constants?/)) {
          contextDesc = `Constants and configuration values used throughout the app. Includes ${fileCount} file${fileCount > 1 ? 's' : ''} with fixed values like API keys, status codes, error messages, and feature flags. Centralizing these makes them easy to update and prevents typos.`;
        } else if (lowerName.match(/validator/)) {
          contextDesc = `Validation rules ensuring ${fileCount} data type${fileCount > 1 ? 's' : ''} meet requirements before processing. These check things like email format, password strength, required fields, and data ranges. Catching invalid data early prevents bugs and security issues.`;
        } else if (lowerName.match(/auth/)) {
          contextDesc = `Authentication and authorization logic managing user access. Handles ${fileCount} aspect${fileCount > 1 ? 's' : ''} of security like login, signup, password resets, token generation, and permission checking. This is the gatekeeper ensuring only authorized users access protected resources.`;
        } else if (lowerName.match(/layout/)) {
          contextDesc = `Layout components defining ${fileCount} page template${fileCount > 1 ? 's' : ''} used across the app. These provide consistent structure like headers, footers, navigation, and sidebars. Every page wraps itself in a layout to maintain uniform design.`;
        } else if (lowerName.match(/store|state/)) {
          contextDesc = `State management handling ${fileCount} global data store${fileCount > 1 ? 's' : ''}. This manages application-wide state that needs to be accessed from multiple components, like user info, theme settings, or shopping cart contents. Centralizing state prevents prop-drilling and keeps data synchronized.`;
        } else {
          contextDesc = `Module organizing ${fileCount} ${dirName}-related file${fileCount > 1 ? 's' : ''}${hasSubdirs ? ` across ${subdirCount} subdirectories` : ''} for the project. ${hasFewFiles ? 'Small, focused module - good starting point for understanding this functionality.' : hasMultipleFiles ? 'Larger module with multiple files working together to provide comprehensive functionality.' : 'Contains core functionality that other parts of the app depend on.'}`;
        }
        
        return contextDesc;
      }
    };

    // Get directory type
    const getDirType = (dirName: string) => {
      if (dirName.match(/api|server|backend|functions?/i)) return 'api';
      if (dirName.match(/db|database|supabase|firebase/i)) return 'database';
      if (dirName.match(/llm|ai|ml/i)) return 'llm';
      return 'service';
    };

    // Create root node
    const rootFiles = dirTree.get('') || { files: [], subdirs: new Set() };
    nodes.push({
      id: String(nodeId),
      type: 'custom',
      position: { x: 500, y: 50 },
      data: {
        label: repoData.name || 'Root',
        description: `This is the repository root containing configuration files like package.json, tsconfig, and other project setup files. All other directories branch out from here.`,
        type: 'service',
        connections: rootFiles.subdirs.size,
        dependencies: [],
        codePath: repoData.html_url,
      }
    });
    const rootNodeId = String(nodeId++);

    // Track nodes by path for creating edges
    const nodeMap = new Map<string, string>();
    nodeMap.set('', rootNodeId);

    // Process directories level by level (BFS)
    const processedDirs = new Set<string>();
    const queue: Array<{path: string, parentId: string, depth: number}> = [];
    
    rootFiles.subdirs.forEach(subdir => {
      queue.push({ path: subdir, parentId: rootNodeId, depth: 1 });
    });

    // Track node count per depth level and cumulative Y offset
    const nodesPerDepth = new Map<number, number>();
    let cumulativeY = 200; // Start position
    let currentDepth = 0;
    let maxRowsAtCurrentDepth = 0;

    while (queue.length > 0) {
      const { path, parentId, depth } = queue.shift()!;
      
      if (processedDirs.has(path) || depth > 3) continue; // Limit to 3 levels deep
      processedDirs.add(path);

      const dirInfo = dirTree.get(path);
      if (!dirInfo) continue;

      const dirName = path.split('/').pop() || path;
      const fileTypes = dirInfo.files.map((f: any) => f.path.split('.').pop()).filter(Boolean);
      const fileCount = dirInfo.files.length;

      // When we move to a new depth, update cumulative Y
      if (depth !== currentDepth) {
        if (currentDepth > 0) {
          // Add space for all rows at the previous depth
          cumulativeY += (maxRowsAtCurrentDepth + 1) * 150;
        }
        currentDepth = depth;
        maxRowsAtCurrentDepth = 0;
      }

      // Calculate position
      const nodesAtThisDepth = nodesPerDepth.get(depth) || 0;
      const nodesPerRow = 4;
      const col = nodesAtThisDepth % nodesPerRow;
      const row = Math.floor(nodesAtThisDepth / nodesPerRow);
      
      maxRowsAtCurrentDepth = Math.max(maxRowsAtCurrentDepth, row);
      
      const x = 100 + (col * 200); // Reduced horizontal spacing
      const y = cumulativeY + (row * 150); // Reduced vertical spacing
      
      nodesPerDepth.set(depth, nodesAtThisDepth + 1);
      

      const type = getDirType(dirName);
      
      // Build enhanced description with file analysis
      const baseDescription = getDirDescription(dirName, fileCount, fileTypes, dirInfo.subdirs.size);
      
      // Analyze file types for more specific description
      const uniqueFileTypes = [...new Set(fileTypes)].filter(Boolean);
      const hasTS = uniqueFileTypes.some(t => typeof t === 'string' && ['ts', 'tsx'].includes(t));
      const hasJS = uniqueFileTypes.some(t => typeof t === 'string' && ['js', 'jsx'].includes(t));
      const hasCSS = uniqueFileTypes.some(t => typeof t === 'string' && ['css', 'scss', 'sass'].includes(t));
      const hasConfig = uniqueFileTypes.some(t => typeof t === 'string' && ['json', 'toml', 'yaml', 'yml'].includes(t));
      const hasSql = uniqueFileTypes.includes('sql');
      const hasMd = uniqueFileTypes.includes('md');
      
      // Build tech stack context
      let techContext = '';
      if (hasTS || hasJS) {
        techContext = hasTS ? ' Built with TypeScript for type safety.' : ' Written in JavaScript.';
      }
      if (hasCSS) {
        techContext += ' Includes styling definitions.';
      }
      if (hasSql) {
        techContext += ' Contains database schemas and migrations.';
      }
      if (hasMd) {
        techContext += ' Includes documentation.';
      }
      if (hasConfig && fileCount < 10) {
        techContext += ' Primarily configuration files.';
      }
      
      // Analyze subdirectories for relationships
      const subdirNames = Array.from(dirInfo.subdirs).map((p: any) => p.split('/').pop());
      const parentPath = path.split('/').slice(0, -1).join('/');
      const parentName = parentPath.split('/').pop() || 'root';
      
      // Build relationship context
      let relationshipContext = '';
      if (dirInfo.subdirs.size > 0) {
        const criticalSubdirs = subdirNames.filter(s => 
          s.match(/api|auth|database|config|core|main|index/i)
        );
        
        if (criticalSubdirs.length > 0) {
          relationshipContext = `\n\nCritical subdirectories: ${criticalSubdirs.slice(0, 3).join(', ')}.`;
        }
        
        // Infer purpose based on subdirectory patterns
        if (subdirNames.some(s => s.match(/test|spec|__tests__/i))) {
          relationshipContext += ' Includes test coverage.';
        }
        if (subdirNames.some(s => s.match(/utils?|helpers?|lib/i))) {
          relationshipContext += ' Provides utility functions.';
        }
        if (subdirNames.some(s => s.match(/types?|interfaces?/i))) {
          relationshipContext += ' Defines TypeScript types.';
        }
      }
      
      // Add file count context if significant
      let fileContext = '';
      if (fileCount > 20) {
        fileContext = `\n\nLarge module with ${fileCount} files—explore subdirectories first for navigation.`;
      } else if (fileCount > 0 && fileCount <= 5 && dirInfo.subdirs.size === 0) {
        fileContext = `\n\nCompact module - good entry point for understanding ${dirName} functionality.`;
      }
      
      // Detect duplicate/similar directories at same level
      const siblingPaths = Array.from(dirTree.keys()).filter(p => {
        const pParts = p.split('/');
        const myParts = path.split('/');
        return pParts.length === myParts.length && pParts.slice(0, -1).join('/') === myParts.slice(0, -1).join('/');
      });
      const siblingNames = siblingPaths.map(p => p.split('/').pop());
      
      let roleContext = '';
      if (depth > 1 && parentName) {
        roleContext = `\n\nPart of ${parentName} module.`;
        
        // Explain role within parent
        if (dirName.match(/client|frontend/i) && siblingNames.some(s => s?.match(/server|backend/i))) {
          roleContext += ' Handles client-side logic (runs in browser with limited permissions).';
        } else if (dirName.match(/server|backend/i) && siblingNames.some(s => s?.match(/client|frontend/i))) {
          roleContext += ' Handles server-side logic (full system access, database connections).';
        } else if (dirName.match(/shared|common/i)) {
          roleContext += ' Shared code used by multiple modules.';
        }
      }

      const currentNodeId = String(nodeId);
      nodes.push({
        id: currentNodeId,
        type: 'custom',
        position: { x, y },
        data: {
          label: dirName,
          description: `${baseDescription}${techContext}${fileContext}${roleContext}${relationshipContext}`,
          type,
          connections: dirInfo.subdirs.size,
          dependencies: subdirNames,
          codePath: `${repoData.html_url}/tree/${repoData.default_branch}/${path}`,
        }
      });

      edges.push({
        id: `e${parentId}-${currentNodeId}`,
        source: parentId,
        target: currentNodeId,
        animated: type === 'api',
        style: { 
          stroke: type === 'api' ? 'hsl(142 76% 36%)' : 
                  type === 'database' ? 'hsl(267 84% 65%)' : 
                  type === 'llm' ? 'hsl(24 95% 53%)' :
                  'hsl(191 91% 55%)' 
        }
      });

      nodeMap.set(path, currentNodeId);
      nodeId++;

      // Add subdirectories to queue
      dirInfo.subdirs.forEach((subdir: string) => {
        queue.push({ path: subdir, parentId: currentNodeId, depth: depth + 1 });
      });
    }

    return { nodes, edges };
  };

  const handleDemoMode = async () => {
    setIsLoading(true);
    
    try {
      // Original Lovable demo data
      const demoGraphData = {
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
      
      navigate("/analyze", { 
        state: { 
          analysisId: 'demo-analysis-123',
          graphData: demoGraphData,
          type: "demo" 
        } 
      });
    } catch (error) {
      console.error('Demo error:', error);
      toast({
        title: "Demo failed",
        description: error instanceof Error ? error.message : "Failed to load demo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Archai</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            AI Systems Intelligence
            <br />
            <span className="gradient-text">Visualized</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your codebase or connect to GitHub. Archai analyzes architecture,
            detects services, and generates intelligent insights using AI.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-5xl mx-auto mt-16 space-y-8">
          <Card className="glass-panel p-8 animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold">Upload Codebase</h2>
              </div>
              
              <UploadZone onFileSelect={handleFileUpload} disabled={isLoading} />
            </div>
          </Card>

          <div className="text-center text-muted-foreground">or</div>

          <Card className="glass-panel p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold">Import from GitHub</h2>
              </div>
              
              <div className="flex gap-3">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="flex-1 bg-card/50"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleGithubSubmit}
                  disabled={!githubUrl || isLoading}
                  className="gap-2"
                >
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="text-center pt-8">
            <Button 
              variant="ghost" 
              onClick={handleDemoMode}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-4 h-4" />
              Try Demo Mode
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-24 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "AI-Powered Analysis",
              description: "Leverages LLM to understand and summarize each service"
            },
            {
              icon: Github,
              title: "Multi-Source Support",
              description: "Upload ZIP files or connect directly to GitHub repos"
            },
            {
              icon: Upload,
              title: "Interactive Graphs",
              description: "Visualize architecture with clickable, explorable nodes"
            }
          ].map((feature, i) => (
            <Card key={i} className="glass-panel p-6 hover:border-primary/50 transition-all duration-300">
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
