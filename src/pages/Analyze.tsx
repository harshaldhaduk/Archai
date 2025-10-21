import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Wand2 } from "lucide-react";
import { ArchitectureGraph } from "@/components/ArchitectureGraph";
import { ServiceDetails } from "@/components/ServiceDetails";
import { Node } from "@xyflow/react";
import { generateInsights } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

const Analyze = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  const { analysisId, graphData: initialGraphData, fileName, githubUrl, type } = location.state || {};

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

      // For demo mode, use mock insights instead of calling Supabase
      if (type === 'demo') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockInsights = `## Architecture Analysis

**Overall Pattern**: Microservices Architecture with API Gateway

**Key Strengths**:
- **Centralized Entry Point**: API Gateway provides a single point of entry, simplifying client interactions and enabling consistent authentication and rate limiting
- **Service Separation**: Clear separation between Auth Service, User Service, and AI Processor allows independent scaling and deployment
- **Database Optimization**: PostgreSQL handles transactional data while Redis Cache provides high-speed caching, optimizing for different access patterns
- **AI Integration**: Dedicated AI Processor service enables advanced natural language understanding without impacting core business services

**Scalability Considerations**:
- API Gateway may become a bottleneck under high load - consider implementing horizontal scaling with load balancers
- Redis Cache provides excellent read performance but ensure proper cache invalidation strategies
- AI Processor should implement request queuing for expensive LLM operations
- Database connection pooling should be configured appropriately for expected concurrent users

**Security Recommendations**:
- Implement proper authentication at the API Gateway using OAuth2/JWT tokens
- Use HTTPS/TLS for all inter-service communications
- Add rate limiting to prevent abuse and DDoS attacks
- Implement proper secret management for API keys and database credentials
- Consider adding API request signing between services

**Potential Improvements**:
- Add a message queue (e.g., RabbitMQ, Kafka) for asynchronous processing and better fault tolerance
- Implement circuit breakers between services to prevent cascade failures
- Add comprehensive health checks and monitoring for all services
- Consider implementing service mesh (e.g., Istio) for advanced traffic management
- Add database read replicas for improved read performance
- Implement proper logging aggregation and distributed tracing

**Technology Stack Assessment**:
- Modern microservices architecture well-suited for cloud deployment
- Good separation of concerns with dedicated services for specific functionalities
- Scalable data layer with both relational and in-memory storage`;

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
      toast({
        title: "Failed to generate insights",
        description: error instanceof Error ? error.message : "An error occurred",
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
                <Card className="glass-panel p-6 animate-fade-in">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">AI Insights</h2>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
                    <ReactMarkdown
                      components={{
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />,
                        p: ({node, ...props}) => <p className="text-base leading-relaxed mb-3 text-foreground/90" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-primary text-base" {...props} />,
                        ul: ({node, ...props}) => <ul className="space-y-2 my-3 pl-5" {...props} />,
                        li: ({node, ...props}) => <li className="text-base leading-relaxed text-foreground/90" {...props} />,
                      }}
                    >
                      {insights}
                    </ReactMarkdown>
                  </div>
                </Card>
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
