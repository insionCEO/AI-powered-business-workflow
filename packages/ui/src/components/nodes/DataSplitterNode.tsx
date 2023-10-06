import React, { useContext, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import styled from 'styled-components';
import ReactTooltip, { Tooltip } from 'react-tooltip';
import { NodeContext } from '../providers/NodeProvider';
import NodePlayButton from '../shared/nodes-parts/NodePlayButton';
import { generateIdForHandle } from '../../utils/flowUtils';
import { InputHandle, NodeTitle, OutputHandle } from '../shared/Node.styles';
import { darken } from 'polished';
import { useIsPlaying } from '../../hooks/useIsPlaying';

interface DataSplitterNodeData {
  splitChar: string;
  id: string;
  name: string;
  processorType: string;
  nbOutput: number;
  input: string;
  input_key: string;
  outputData?: string[];
}

interface DataSplitterNodeProps extends NodeProps {
  data: DataSplitterNodeData;
}

const DataSplitterNode: React.FC<DataSplitterNodeProps> = React.memo(({ data, id, selected }) => {

  const { onUpdateNodeData } = useContext(NodeContext);

  const updateNodeInternals = useUpdateNodeInternals();


  const [nodeId, setNodeId] = useState<string>(`${data.id}-${Date.now()}`);
  const [isPlaying, setIsPlaying] = useIsPlaying();
  const [isCustomSplit, setIsCustomSplit] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState(false);


  useEffect(() => {
    setNodeId(`${data.id}-${Date.now()}`);
    const newNbOutput = data.outputData ? data.outputData.length : 0;
    if (!data.nbOutput || newNbOutput > data.nbOutput) {
      onUpdateNodeData(id, {
        ...data,
        nbOutput: newNbOutput,
      });
    }
    setIsPlaying(false);
    updateNodeInternals(id);
  }, [data.outputData]);
  const handlePlayClick = () => {
    setIsPlaying(true);
  };


  const handleCollapseClick = () => {
    setCollapsed(!collapsed);
  };


  const handleSplitCharChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === "custom") {
      setIsCustomSplit(true);
    } else {
      setIsCustomSplit(false);

      onUpdateNodeData(id, {
        ...data,
        splitChar: event.target.value,
      });

      updateNodeInternals(id);
    }
  };

  const handleCustomSplitCharChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData(id, {
      ...data,
      splitChar: event.target.value,
    });

    updateNodeInternals(id);
  };

  const handleForceNbOutputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData(id, {
      ...data,
      nbOutput: event.target.value,
    });
    updateNodeInternals(id);
  };

  const getNbOutput = () => {
    return !!data.nbOutput ? data.nbOutput : 0;
  }


  return (
    <DataSplitterNodeContainer selected={selected} nbOutput={getNbOutput()} collapsed={collapsed} key={nodeId} onDoubleClick={handleCollapseClick}>
      {!collapsed
        && <NodeTitle>Splitter</NodeTitle>
      }
      <NodePlayButton isPlaying={isPlaying} nodeName={data.name} onClick={handlePlayClick} />
      {!collapsed && (
        <>
          <SplitCharSelect value={data.splitChar} onChange={handleSplitCharChange}>
            <option value="\n">\n</option>
            <option value=";">;</option>
            <option value=",">,</option>
            <option value="custom">Personnalisé...</option>
          </SplitCharSelect>
          {isCustomSplit && (
            <CustomSplitCharInput value={data.splitChar} onChange={handleCustomSplitCharChange} placeholder="Entrez caractère" />
          )}
          <ForceNbOutputInput
            id="nbOutput"
            value={getNbOutput()}
            onChange={handleForceNbOutputChange}
          />
        </>
      )}
      <InputHandle className="handle" type="target" position={Position.Left} />
      <div className="output-strip-node-outputs">
        {Array.from(Array(getNbOutput())).map((_, index) => (
          <OutputHandle
            key={generateIdForHandle(index)}
            data-tooltip-id={`${nodeId}-tooltip`}
            data-tooltip-content={data.outputData ? data.outputData[index] : ''}
            type="source"
            id={generateIdForHandle(index)}
            position={Position.Right}
            style={{
              background: data?.outputData ? (data.outputData[index] ? 'rgb(224, 166, 79)' : '#ddd') : '#ddd',
              top: `${getNbOutput() === 1 ? 50 : (index / (getNbOutput() - 1)) * 80 + 10}%`
            }}
          />
        ))}
        <Tooltip id={`${nodeId}-tooltip`} style={{ zIndex: 100 }} />
      </div>
    </DataSplitterNodeContainer>
  );
});

const DataSplitterNodeContainer = styled.div<{ selected: boolean, nbOutput: number, collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: ${({ theme }) => theme.bg};
  padding: 10px;
  border: 2px solid ${props => props.selected ? '#72c8fa' : '#ddd'};
  border-radius: 10px;
  box-shadow: ${props => props.selected ? '0px 0px 5px rgba(114, 200, 250, 0.6)' : 'rgba(0, 0, 0, 0.05) 2px 1px 1px'};
  min-height: 250px;
  height: ${props => props.nbOutput * 30 + 100}px;
  width: ${props => props.collapsed ? 'auto' : '150px'};
  transition: all 0.3s ease-in-out;
`;

const ForceNbOutputInput = styled.input`
  margin-top: 10px;
  width: 50%;
  padding: 4px;
  font-size: 0.9em;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.nodeInputBg};
  padding: 5px;
  border-radius: 5px;
`;

const SplitCharSelect = styled.select`
  margin-top: 10px;
  width: 50%;
  border: none;
  border-radius: 5px;
  padding: 5px;
  font-size: 0.9em;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.nodeBg};
  box-shadow: ${({ theme }) => theme.boxShadow};
`;

const CustomSplitCharInput = styled.input`
  margin-top: 10px;
  width: 50%;
  border: none;
  border-radius: 5px;
  padding: 5px;
  font-size: 0.9em;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.nodeInputBg};
`;

const Button = styled.button`
  width: 70px;
  padding: 2px;
  margin-top: 5px;
  font-size: 0.8em;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.nodeBg};
  border: none;
  border-radius: 3px;
  transition: background-color 0.3s ease;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => darken(0.1, theme.nodeBg)};
  }
`;

export default DataSplitterNode;