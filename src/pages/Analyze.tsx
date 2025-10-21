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
    if (!analysisId || !graphData) return;

    setIsGeneratingInsights(true);
    
    try {
      toast({
        title: "Generating AI insights...",
        description: "Analyzing architecture patterns and best practices",
      });

      const result = await generateInsights(analysisId, graphData);
      setInsights(result.insights);

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
              <Card className="glass-panel p-6 h-[calc(100vh-20rem)]">
                <h2 className="text-xl font-semibold mb-4">Architecture Graph</h2>
                <ArchitectureGraph
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  onNodeClick={setSelectedNode}
                />
              </Card>

              {insights && (
                <Card className="glass-panel p-6 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">AI Insights</h2>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{insights}</ReactMarkdown>
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
