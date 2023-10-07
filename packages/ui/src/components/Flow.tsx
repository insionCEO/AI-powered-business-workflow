import { useState, useCallback, useMemo, useEffect, useContext, useRef } from 'react';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import SideBar from './bars/Sidebar';
import RightIconButton from './buttons/ConfigurationButton';
import ConfigPopup from './popups/ConfigPopup';
import { FiHelpCircle } from 'react-icons/fi';
import HelpPopup from './popups/HelpPopup';
import DnDSidebar from './side-views/DnDSidebar';
import { NodeProvider } from './providers/NodeProvider';
import { ControlsStyled, MiniMapStyled, ReactFlowStyled } from './shared/Node.styles';
import UserMessagePopup, { MessageType, UserMessage } from './popups/UserMessagePopup';
import { SocketContext } from './providers/SocketProvider';
import { getConfigViaType } from '../nodesConfiguration/nodeConfig';
import { NodeType, allNodeTypes, getAllNodeTypesComponentMapping, specificNodeTypes } from '../utils/mappings';
import { useTranslation } from 'react-i18next';
import { toastInfoMessage } from '../utils/toastUtils';

export interface FlowProps {
  nodes?: Node[];
  edges?: Edge[];
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
  showOnlyOutput?: boolean;
  isRunning: boolean;
  onRunChange: (isRunning: boolean) => void;
}

function Flow(props: FlowProps) {

  const { t } = useTranslation('flow');

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | undefined>(undefined);
  const { socket } = useContext(SocketContext);

  const nodeTypes = useMemo(() => getAllNodeTypesComponentMapping(), []);

  const [nodes, setNodes] = useState<Node[]>(props.nodes ? props.nodes : []);
  const [edges, setEdges] = useState<Edge[]>(props.edges ? props.edges : []);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [currentUserMessage, setCurrentUserMessage] = useState<UserMessage>({ content: '' });
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [currentNodeRunning, setCurrentNodeRunning] = useState<string>('');
  const [errorCount, setErrorCount] = useState<number>(0);

  const onInit = (reactFlowInstance: ReactFlowInstance) => {
    setReactFlowInstance(reactFlowInstance);
  }

  useEffect(() => {
    if (!!socket) {
      socket.on('progress', onProgress);
      socket.on('error', onError)
      socket.on('run_end', onRunEnd)
      socket.on('current_node_running', onCurrentNodeRunning)
      socket.on('disconnect', onDisconnect)
    }

    return () => {
      if (!!socket) {
        socket.off('progress', onProgress);
        socket.off('error', onError)
        socket.off('run_end', onRunEnd)
        socket.off('current_node_running', onCurrentNodeRunning)
        socket.off('disconnect', onDisconnect)
      }
    }
  }, [socket]);

  useEffect(() => {
    if (props.onFlowChange) {
      props.onFlowChange(nodes, edges);
    }
  }, [nodes, edges]);

  const onProgress = (data: any) => {
    const nodeToUpdate = data.instanceName as string;
    const output = data.output;

    if (nodeToUpdate && output) {
      setNodes((currentState) => {
        return [...currentState.map((node) => {
          if (node.data.name == nodeToUpdate) {
            node.data = { ...node.data, outputData: output, lastRun: new Date() };
          }

          return node;
        })]
      }
      );
    }
  }

  const onError = (data: any) => {
    setCurrentUserMessage({ content: data.error, type: MessageType.Error });
    props.onRunChange(false);
    setErrorCount(prevErrorCount => prevErrorCount + 1);
    setIsPopupOpen(true);
  }

  const onRunEnd = (data: any) => {
    props.onRunChange(false);
  }

  const onCurrentNodeRunning = (data: any) => {
    setCurrentNodeRunning(data.instanceName);
  }

  const onDisconnect = (reason: any) => {
    if (reason === 'transport close') {
      toastInfoMessage(t('socketConnectionLost'));
    }
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => {
      if (isNodeAlreadyTargeted(connection, eds)) {
        return eds;
      }
      return addEdge({ ...connection, type: 'smoothstep', markerEnd: 'arrowClosed' }, eds);
    }),
    [setEdges]
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const generatedIdIdentifier = '#';

  const createUniqNodeId = (suffix: string) => {
    return Math.random().toString(36).substr(2, 9) + generatedIdIdentifier + suffix;
  }

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      if (!!reactFlowWrapper && !!reactFlowInstance && !!reactFlowWrapper.current) {
        const reactFlowBounds = (reactFlowWrapper.current as any).getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');

        // check if the dropped element is valid
        if (typeof type === 'undefined' || !type) {
          return;
        }

        const position = (reactFlowInstance as any).project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const id = createUniqNodeId(type);
        const newNode: Node = {
          id,
          type,
          data: {
            name: id,
            processorType: type,
            config: getConfigViaType(type),
          },
          position,
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance]
  );

  const isNodeAlreadyTargeted = (connection: Connection, eds: Edge[]) => {
    if (eds.filter(edge => edge.target === connection.target).length > 0) {
      return true;
    }
    return false;
  }

  const handleNodesClick = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Check if clicked on an existing node
    if (event.target !== event.currentTarget) {
      return;
    }

    setIsPopupOpen(true);
  }, []);

  //Popup
  const handlePopupClose = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  const handleConfigClose = useCallback(() => {
    setIsConfigOpen(false);
  }, []);

  function handleChangeFlow(nodes: Node[], edges: Edge[]): void {
    setNodes(nodes);
    setEdges(edges);
  }

  const handleUpdateNodeData = (nodeId: string, data: any) => {
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data };
      }
      return node;
    });
    setNodes(updatedNodes);
  }

  const handleUpdateNodes = (updatedNodes: Node[], updatesEdges: Edge[]) => {
    setNodes(updatedNodes);
    setEdges(updatesEdges);
  }

  return (
    <NodeProvider nodes={nodes} edges={edges} showOnlyOutput={props.showOnlyOutput}
      isRunning={props.isRunning} currentNodeRunning={currentNodeRunning} errorCount={errorCount}
      onUpdateNodeData={handleUpdateNodeData} onUpdateNodes={handleUpdateNodes}>
      <div style={{ height: '100%' }} onClick={handleNodesClick}>
        <div className="reactflow-wrapper" style={{ height: '100%' }} ref={reactFlowWrapper}>
          <ReactFlowStyled
            nodes={nodes}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            edges={edges}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={onInit}
            fitView
          >
            {/* <Background /> */}
            <MiniMapStyled style={{ right: '4vw' }} />
            {/* <ControlsStyled style={{ left: '9vw' }} /> */}
          </ReactFlowStyled>
        </div>
        <SideBar nodes={nodes} edges={edges} onChangeFlow={handleChangeFlow} />
        <DnDSidebar />
        <RightIconButton onClick={() => setIsConfigOpen(true)} />
        <RightIconButton onClick={() => setIsHelpOpen(true)} color='#6576f8' bottom='80px' icon={<FiHelpCircle />} />
        <UserMessagePopup isOpen={isPopupOpen} onClose={handlePopupClose} message={currentUserMessage} />
        <ConfigPopup isOpen={isConfigOpen} onClose={handleConfigClose} />
        {isHelpOpen && <HelpPopup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />}
      </div>
    </NodeProvider>
  );
}

export default Flow;

