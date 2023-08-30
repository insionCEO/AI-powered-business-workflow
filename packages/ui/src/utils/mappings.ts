import { NodeProps } from "reactflow";
import DataSplitterNode from "../components/nodes/dataSplitterNode/DataSplitterNode";
import FileDropNode from "../components/nodes/fileDropNode/fileDropNode";
import GenericNode from "../components/nodes/genericNode/GenericNode";
import AIDataSplitterNode from "../components/nodes/aiDataSplitterNode/AIDataSplitterNode";

/**
 * All nodes types must be declared here. By default, every node will be associated with the GenericNode component.
 */
export const allNodeTypes = ['gpt', 'file', 'url_input', 'dalle-prompt', 'data-splitter', 'ai-data-splitter', 'input-text', 'gpt-prompt', 'youtube_transcript_input', 'gpt-no-context-prompt', 'stable-diffusion-stabilityai-prompt'] as const;
export type NodeType = typeof allNodeTypes[number];


/**
 * Nodes types that uses specific components, instead of the generic one. 
 */
export const specificNodeTypes: Partial<Record<NodeType, React.FC<NodeProps>>> = {
  "file": FileDropNode,
  "data-splitter": DataSplitterNode,
  "ai-data-splitter": AIDataSplitterNode,
};


/**
 * Generate the mapping used by ReactFlow. 
 * 
 * @returns The complete mapping of all node types to their respective components.
 */
export const getAllNodeTypesComponentMapping = () => {
  const completeNodeTypes: Record<NodeType, React.FC<NodeProps>> = {} as Record<NodeType, React.FC<NodeProps>>;

  allNodeTypes.forEach(type => {
    completeNodeTypes[type] = specificNodeTypes[type] || GenericNode;
  });

  return completeNodeTypes;
}