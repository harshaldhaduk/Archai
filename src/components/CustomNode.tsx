import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database, Box, Cpu, Sparkles, LucideIcon } from "lucide-react";

interface CustomNodeData {
  label: string;
  description: string;
  type: "service" | "database" | "api" | "llm";
  connections: number;
  dependencies?: string[];
  codePath?: string;
}

const iconMap: Record<string, LucideIcon> = {
  service: Box,
  database: Database,
  api: Cpu,
  llm: Sparkles,
};

const colorMap: Record<string, string> = {
  service: "from-primary/20 to-primary/10 border-primary/50",
  database: "from-secondary/20 to-secondary/10 border-secondary/50",
  api: "from-green-500/20 to-green-500/10 border-green-500/50",
  llm: "from-orange-500/20 to-orange-500/10 border-orange-500/50",
};

export const CustomNode = memo((props: NodeProps) => {
  const data = props.data as unknown as CustomNodeData;
  const Icon = iconMap[data.type] || Box;
  const colorClass = colorMap[data.type] || colorMap.service;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gradient-to-br ${colorClass} backdrop-blur-sm min-w-[180px] cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-background/50 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground capitalize">{data.type}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
});

CustomNode.displayName = "CustomNode";
