import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import Flow from './Flow';
import { FiSun, FiMoon } from 'react-icons/fi';
import { Node, Edge } from 'reactflow';
import { ThemeContext } from './providers/ThemeProvider';
import { darken, lighten } from 'polished';
import { useTranslation } from 'react-i18next';
import { FaEye, FaPlus } from 'react-icons/fa';
import { convertFlowToJson, convertJsonToFlow, nodesTopologicalSort } from '../utils/flowUtils';
import { toastFastInfoMessage, toastInfoMessage } from '../utils/toastUtils';
import ButtonRunAll from './buttons/ButtonRunAll';
import { SocketContext } from './providers/SocketProvider';
interface FlowTab {
  nodes: Node[];
  edges: Edge[];
}

interface FlowManagerState {
  tabs: FlowTab[];
}

const FlowTabs = () => {
  const { t } = useTranslation('flow');

  const [flowTabs, setFlowTabs] = useState<FlowManagerState>({ tabs: [{ nodes: [], edges: [] }] });
  const [currentTab, setCurrentTab] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [showOnlyOutput, setShowOnlyOutput] = useState(false);
  const { dark, toggleTheme } = useContext(ThemeContext);
  const { socket, verifyConfiguration, config } = useContext(SocketContext);
  const [isRunning, setIsRunning] = useState(false);

  const handleToggleOutput = () => {
    setShowOnlyOutput(!showOnlyOutput);
  };

  useEffect(() => {
    const savedFlowTabs = localStorage.getItem('flowTabs');
    if (savedFlowTabs) {
      setFlowTabs(JSON.parse(savedFlowTabs));
      setRefresh(true);
    }
  }, []);

  useEffect(() => {
    if (flowTabs.tabs.length >= 1 && flowTabs.tabs[0].nodes.length !== 0)
      localStorage.setItem('flowTabs', JSON.stringify(flowTabs));
  }, [flowTabs]);

  useEffect(() => {
    const loadIntroFile = async () => {
      const firstVisit = localStorage.getItem('firstVisit') !== 'false';
      const savedFlowTabs = localStorage.getItem('flowTabs');

      if (firstVisit && !savedFlowTabs) {
        try {
          const response = await fetch('/samples/intro.json');
          if (!response.ok) {
            throw new Error('Failed to fetch intro file');
          }
          const jsonData = await response.json();
          const newFlowTab: FlowManagerState = { tabs: [] }
          newFlowTab.tabs.push(convertJsonToFlow(jsonData))

          setFlowTabs(newFlowTab);
          setRefresh(true);

          localStorage.setItem('firstVisit', 'false');
        } catch (error) {
          console.error("Cannot load sample file :", error);
        }
      }
    };

    loadIntroFile();
  }, []);

  const addFlowTab = () => {
    const newFlowTab = { ...flowTabs }
    newFlowTab.tabs.push({ nodes: [], edges: [] })
    setFlowTabs(newFlowTab);
  };

  const handleFlowChange = (nodes: Node[], edges: Edge[]) => {
    const updatedTabs = flowTabs.tabs.map((tab, index) => {
      if (index === currentTab) {
        return { nodes, edges };
      }
      return tab;
    });
    const updatedFlowTabs = { ...flowTabs, tabs: updatedTabs };
    setFlowTabs(updatedFlowTabs);
  };

  const handleRunAllCurrentFlow = () => {
    if (!verifyConfiguration()) {
      toastInfoMessage(t('ApiKeyRequiredMessage'));
      return;
    }

    const nodes = flowTabs.tabs[currentTab].nodes;
    const edges = flowTabs.tabs[currentTab].edges;

    const nodesSorted = nodesTopologicalSort(nodes, edges);
    const flowFile = convertFlowToJson(nodesSorted, edges, true);
    socket?.emit('process_file',
      {
        jsonFile: JSON.stringify(flowFile),
        openaiApiKey: config?.openaiApiKey,
        stabilityaiApiKey: config?.stabilityaiApiKey,
      });
    setIsRunning(true);
  }

  const handleChangeRun = (runStatus: boolean) => {
    setIsRunning(runStatus);
  }

  const handleChangeTab = (index: number) => {
    if (!isRunning) {
      setCurrentTab(index);
    } else {
      toastFastInfoMessage(t('CannotChangeTabWhileRunning'));
    }
  }

  return (
    <FlowManagerContainer>
      <TabsContainer className='max-h-12 py-2'>
        <img src="logo.png" className='ml-5 mr-5 mx-auto max-w-full max-h-full' alt="Logo"></img>
        <Tabs>
          {flowTabs.tabs.map((tab, index) => (
            <TabButton
              key={index}
              active={index === currentTab}
              onClick={() => handleChangeTab(index)}
            >
              {t('Flow')} {index + 1}
            </TabButton>
          ))}
        </Tabs>
        <AddTabButton onClick={addFlowTab}>
          <FaPlus />
        </AddTabButton>
        <RightControls>
          <ButtonRunAll onClick={handleRunAllCurrentFlow} isRunning={isRunning} />
          <ShowOutputButton onClick={handleToggleOutput}>
            <FaEye />
          </ShowOutputButton>
          <ToggleThemeButton onClick={toggleTheme}>
            {dark ? <FiMoon /> : <FiSun />}
          </ToggleThemeButton>
        </RightControls>
      </TabsContainer>
      <FeedbackIcon className="fixed right-10 top-12 px-6 bg-slate-500 text-slate-100 z-10 rounded-b-md invisible:sd visible:md">Feedback ?</FeedbackIcon>
      <Flow
        key={`flow-${currentTab}-${refresh}`}
        nodes={flowTabs.tabs[currentTab].nodes}
        edges={flowTabs.tabs[currentTab].edges}
        onFlowChange={handleFlowChange}
        showOnlyOutput={showOnlyOutput}
        isRunning={isRunning}
        onRunChange={handleChangeRun}
      />
    </FlowManagerContainer>
  );
};

const FeedbackIcon = styled.div`
`;

const FlowManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const buttonPaddingValue = "8px 12px";

const TabsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background: linear-gradient(to right, ${({ theme }) => theme.tabBarBg}, ${({ theme }) => darken(0.01, theme.tabBarBg)});
  z-index: 11;
  font-family: Roboto;
  border-bottom: solid;
  border-color: rgb(53 52 52 / 30%);
`;

const Tabs = styled.div`
  white-space: nowrap;
  overflow-y: hidden;
  overflow-x: auto;
  padding-bottom: 3px;
  max-width: 60%;
`;

export const TabButton = styled.button<{ active: boolean }>`
  position: relative;
  margin-right: 10px;
  padding: ${buttonPaddingValue};
  background-color: ${(props) => (props.theme.nodeInput)};
  color: ${(props) => (props.active ? props.theme.text : props.theme.accentText)};
  cursor: pointer;
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
  transform: ${(props) => (props.active ? 'scale(1.15)' : 'scale(1)')};

  &::after {
    content: "";
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: 0;
    left: 15%;
    right: 15%;
    height: 3px;
    background: ${(props) => props.theme.accent};
    transform: ${(props) => (props.active ? 'scaleX(1)' : 'scaleX(0)')};
    transition: transform 0.3s ease-in-out;
    z-index: 11;
  }
`;

const AddTabButton = styled.div`
  padding: ${buttonPaddingValue};
  border: none;
  background-color: ${({ theme }) => theme.nodeBg};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
  border-radius: 3%;

  :hover {
    background-color: ${({ theme }) => lighten(0.2, theme.nodeBg)};
  }
  
`;

const RightControls = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

const ToggleThemeButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.accentText};
  margin-right: 10px;

  :hover {
    color:${({ theme }) => theme.text};
  }
`;

const ShowOutputButton = styled.div`
  padding: 8px 12px;
  border: none;
  background-color: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.accentText};
  cursor: pointer;

  :hover {
    color:${({ theme }) => theme.text};
  }
`;


export default FlowTabs;