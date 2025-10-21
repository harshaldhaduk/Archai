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
      toast({
        title: "Fetching repository...",
        description: githubUrl,
      });
      
      // Fetch GitHub repository
      const fetchResult = await fetchGithubRepo(githubUrl);
      
      toast({
        title: "Parsing repository...",
        description: "Analyzing repository structure",
      });
      
      // Parse the fetched repository
      const parseResult = await parseArchitecture(
        fetchResult.filePath,
        fetchResult.fileName,
        'github'
      );
      
      navigate("/analyze", { 
        state: { 
          analysisId: parseResult.analysisId,
          graphData: parseResult.graphData,
          githubUrl, 
          type: "github" 
        } 
      });
    } catch (error) {
      console.error('GitHub fetch error:', error);
      toast({
        title: "Fetch failed",
        description: error instanceof Error ? error.message : "Failed to fetch repository",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
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
