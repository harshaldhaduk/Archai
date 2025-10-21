import { useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

interface ArchitectureGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: Node) => void;
}

export const ArchitectureGraph = ({ nodes, edges, onNodeClick }: ArchitectureGraphProps) => {
  const [nodesState, , onNodesChange] = useNodesState(nodes);
  const [edgesState, , onEdgesChange] = useEdgesState(edges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border bg-card">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 400 }}
        minZoom={0.1}
        maxZoom={1.5}
        className="bg-card"
        proOptions={{ hideAttribution: true }}
      >
        <Background className="bg-background" />
        <Controls className="bg-card border-border" />
        <MiniMap
          className="bg-card border-border"
          nodeColor={(node) => {
            switch (node.data.type) {
              case "service": return "hsl(191 91% 55%)";
              case "database": return "hsl(267 84% 65%)";
              case "api": return "hsl(142 76% 36%)";
              case "llm": return "hsl(24 95% 53%)";
              default: return "hsl(215 20% 65%)";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
