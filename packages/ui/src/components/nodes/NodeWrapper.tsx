import React, { useContext, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { NodeContext } from "../../providers/NodeProvider";

type NodeWrapperProps = {
  children: React.ReactNode;
  nodeId: string;
};

function NodeWrapper({ children, nodeId }: NodeWrapperProps) {
  const [showIcon, setShowIcon] = useState(false);
  const { onUpdateNodes, nodes, edges } = useContext(NodeContext);

  const currentNode = nodes.find((node) => node.id === nodeId);
  const currentNodeIsMissingFields =
    currentNode?.data?.missingFields?.length > 0;

  let hideIconTimeout: ReturnType<typeof setTimeout>;

  const showIconWithDelay = () => {
    setShowIcon(true);
  };

  const hideIconWithDelay = () => {
    hideIconTimeout = setTimeout(() => setShowIcon(false), 500);
  };

  const clearHideIconTimeout = () => {
    if (hideIconTimeout) {
      clearTimeout(hideIconTimeout);
    }
  };

  function handleRemoveNode(nodeId: string): void {
    const nodesUpdated = nodes.filter((node) => node.id !== nodeId);
    const edgesUpdated = edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    );
    onUpdateNodes(nodesUpdated, edgesUpdated);
  }

  return (
    <div
      className={`group relative p-1 transition-all ${currentNodeIsMissingFields ? "rounded-lg border-2 border-dashed border-red-500/80" : ""}`}
      onClick={showIconWithDelay}
      onMouseLeave={hideIconWithDelay}
    >
      {children}
      <span
        className="absolute right-1/2 top-0 -translate-y-14 translate-x-1/2 cursor-pointer 
                        rounded-full bg-slate-200/10
                        p-2
                        text-xl
                        text-stone-100
                        hover:bg-slate-200/20
                        hover:text-red-400
                        "
        onClick={() => handleRemoveNode(nodeId)}
        onMouseEnter={clearHideIconTimeout}
        onMouseLeave={hideIconWithDelay}
        style={{ display: showIcon ? "block" : "none" }}
      >
        <AiOutlineClose />
      </span>
    </div>
  );
}

export default NodeWrapper;
