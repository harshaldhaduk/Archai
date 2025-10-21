import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceDetailsProps {
  node: any;
}

export const ServiceDetails = ({ node }: ServiceDetailsProps) => {
  if (!node) {
    return (
      <Card className="glass-panel p-6 h-auto min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Click on a node to view details</p>
        </div>
      </Card>
    );
  }

  const typeColors: Record<string, string> = {
    service: "bg-primary/20 text-primary border-primary/50",
    database: "bg-secondary/20 text-secondary border-secondary/50",
    api: "bg-green-500/20 text-green-500 border-green-500/50",
    llm: "bg-orange-500/20 text-orange-500 border-orange-500/50",
  };

  return (
    <Card className="glass-panel p-6 h-auto overflow-y-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Badge className={typeColors[node.data.type] || typeColors.service}>
            {node.data.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {node.data.connections} connections
          </span>
        </div>
        <h3 className="text-2xl font-bold">{node.data.label}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Summary
          </h4>
          <p className="text-sm leading-relaxed">{node.data.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Dependencies
          </h4>
          <div className="space-y-2">
            {node.data.dependencies?.map((dep: string, i: number) => (
              <div
                key={i}
                className="text-sm flex items-center gap-2 text-muted-foreground"
              >
                <ArrowRight className="w-3 h-3" />
                <span className="code-font">{dep}</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">No dependencies</p>}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Code Path
          </h4>
          <code className="text-xs code-font bg-code-bg p-3 rounded block">
            {node.data.codePath || "./services/" + node.data.label.toLowerCase()}
          </code>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm" className="gap-2">
          View Source Code
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
