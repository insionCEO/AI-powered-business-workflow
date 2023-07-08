import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import Flow from './Flow';
import { FiSun, FiMoon } from 'react-icons/fi';
import { Node, Edge } from 'reactflow';
import { ThemeContext, ThemeProvider } from './providers/ThemeProvider';
import { darken, lighten } from 'polished';
import { useTranslation } from 'react-i18next';

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

  return (
      <FlowManagerContainer>
        <TabsContainer>
          {flowTabs.tabs.map((tab, index) => (
            <TabButton
              key={index}
              active={index === currentTab}
              onClick={() => setCurrentTab(index)}
            >
              {t('Flow')} {index + 1}
            </TabButton>
          ))}
          <AddTabButton onClick={addFlowTab}>{t('AddTab')}</AddTabButton>
          <RightControls>
            <ShowOutputButton onClick={handleToggleOutput}>
              {t(showOnlyOutput ? 'ShowOnlyOutputs' : 'ShowOnlyParams')}
            </ShowOutputButton>
            <ToggleThemeButton onClick={toggleTheme}>
              {dark ? <FiMoon/> : <FiSun/>}
            </ToggleThemeButton>
          </RightControls>
        </TabsContainer>
        <Flow
          key={`flow-${currentTab}-${refresh}`}
          nodes={flowTabs.tabs[currentTab].nodes}
          edges={flowTabs.tabs[currentTab].edges}
          onFlowChange={handleFlowChange}
          showOnlyOutput={showOnlyOutput}
        />
      </FlowManagerContainer>
  );
};



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
  padding: 10px;
  background: linear-gradient(to right, ${({ theme }) => theme.tabBarBg}, ${({ theme }) => darken(0.01, theme.tabBarBg)});
  z-index: 10;
  font-family: Roboto;
  border-bottom: solid;
  border-color: rgb(53 52 52 / 30%);
`;

const TabButton = styled.button<{ active: boolean }>`
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

const AddTabButton = styled.button`
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

const ShowOutputButton = styled.button`
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