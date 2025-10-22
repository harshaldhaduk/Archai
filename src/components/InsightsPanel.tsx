import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface InsightsPanelProps {
  insights: string;
  selectedNodeId?: string | null;
  graphNodes?: any[];
}

interface InsightSection {
  title: string;
  content: string;
  id: string;
}

export const InsightsPanel = ({ insights, selectedNodeId, graphNodes }: InsightsPanelProps) => {
  const [sections, setSections] = useState<InsightSection[]>([]);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Parse insights into sections
  useEffect(() => {
    const parsedSections: InsightSection[] = [];
    const lines = insights.split('\n');
    let currentSection: { title: string; content: string } | null = null;
    
    lines.forEach((line) => {
      // Check if line is a bold header (e.g., "**Overview**:")
      const headerMatch = line.match(/^\*\*(.+?)\*\*:\s*$/);
      if (headerMatch) {
        if (currentSection) {
          parsedSections.push({
            ...currentSection,
            id: `section-${parsedSections.length}`
          });
        }
        currentSection = { title: headerMatch[1], content: '' };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection) {
      parsedSections.push({
        ...currentSection,
        id: `section-${parsedSections.length}`
      });
    }

    setSections(parsedSections);
    
    // Only open the first section (Overview) by default
    setOpenSections(parsedSections.length > 0 ? [parsedSections[0].id] : []);
  }, [insights]);

  // Handle node selection - highlight related section
  useEffect(() => {
    if (!selectedNodeId || !graphNodes) {
      setHighlightedSection(null);
      return;
    }

    const selectedNode = graphNodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) return;

    // Find "Key Components & Responsibilities" section and highlight it
    const keyComponentsSection = sections.find(s => 
      s.title.toLowerCase().includes('component') || 
      s.title.toLowerCase().includes('responsibilities')
    );

    if (keyComponentsSection) {
      setHighlightedSection(keyComponentsSection.id);
      
      // Ensure the section is open
      if (!openSections.includes(keyComponentsSection.id)) {
        setOpenSections(prev => [...prev, keyComponentsSection.id]);
      }

      // Scroll to the section after a brief delay
      setTimeout(() => {
        sectionRefs.current[keyComponentsSection.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 300);

      // Remove highlight after 2 seconds
      const timer = setTimeout(() => {
        setHighlightedSection(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, graphNodes, sections, openSections]);

  return (
    <Card className="glass-panel p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border/50">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
        <h2 className="text-lg sm:text-xl font-semibold">AI Insights</h2>
      </div>
      
      <Accordion 
        type="multiple" 
        className="w-full" 
        value={openSections}
        onValueChange={setOpenSections}
      >
        {sections.map((section) => (
          <AccordionItem 
            key={section.id} 
            value={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className={`
              transition-all duration-300 ease-in-out
              ${highlightedSection === section.id ? 'bg-primary/10 border-primary/50 rounded-lg px-1 sm:px-2 -mx-1 sm:-mx-2' : ''}
            `}
          >
            <AccordionTrigger 
              className={`
                text-sm sm:text-base font-semibold hover:no-underline
                transition-colors duration-200 ease-in-out py-3 sm:py-4
                ${highlightedSection === section.id ? 'text-primary' : 'text-foreground hover:text-primary'}
              `}
            >
              <span className="text-left">{section.title}</span>
            </AccordionTrigger>
            <AccordionContent className="transition-all duration-300 ease-in-out">
              <div className="prose prose-slate dark:prose-invert max-w-none pt-2">
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => (
                      <p className="text-xs sm:text-sm leading-relaxed mb-2 text-foreground/90" {...props} />
                    ),
                    strong: ({node, ...props}) => (
                      <strong className="font-bold text-primary text-xs sm:text-sm" {...props} />
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="space-y-1.5 my-2 pl-4 sm:pl-5 list-disc" {...props} />
                    ),
                    li: ({node, ...props}) => (
                      <li className="text-xs sm:text-sm leading-relaxed text-foreground/90" {...props} />
                    ),
                  }}
                >
                  {section.content.trim()}
                </ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
};

