import { useCallback, useEffect } from "react";
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
  useReactFlow,
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

const GraphContent = ({ nodes, edges, onNodeClick }: ArchitectureGraphProps) => {
  const [nodesState, , onNodesChange] = useNodesState(nodes);
  const [edgesState, , onEdgesChange] = useEdgesState(edges);
  const { fitView } = useReactFlow();

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  useEffect(() => {
    // Fit view on mount with more padding to zoom out
    const timer = setTimeout(() => {
      fitView({ padding: 0.3, duration: 400, minZoom: 0.5, maxZoom: 1 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodesState}
      edges={edgesState}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      connectionMode={ConnectionMode.Loose}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: false,
        style: { stroke: 'hsl(191 91% 55% / 0.7)', strokeWidth: 2 }
      }}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.3}
      maxZoom={1.2}
      defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      className="bg-card"
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <MiniMap
        nodeColor={(node) => {
          switch (node.data.type) {
            case "service": return "hsl(191 91% 55%)";
            case "database": return "hsl(267 84% 65%)";
            case "api": return "hsl(142 76% 36%)";
            case "llm": return "hsl(24 95% 53%)";
            default: return "hsl(215 20% 65%)";
          }
        }}
        maskColor="hsl(222 47% 5% / 0.8)"
        style={{
          backgroundColor: 'hsl(222 47% 8%)',
        }}
      />
    </ReactFlow>
  );
};

export const ArchitectureGraph = (props: ArchitectureGraphProps) => {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border bg-card">
      <GraphContent {...props} />
    </div>
  );
};
