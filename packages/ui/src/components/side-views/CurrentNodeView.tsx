import React, { useContext, memo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { NodeContext } from "../../providers/NodeProvider";
import NodeOutput from "../nodes/node-output/NodeOutput";
import { useFormFields } from "../../hooks/useFormFields";
import { Field } from "../../nodes-configuration/nodeConfig";
import OutputDisplay from "../nodes/node-output/OutputDisplay";
import ExpandableBloc from "../selectors/ExpandableBloc";

interface CurrentNodeViewProps {}

const CurrentNodeView: React.FC<CurrentNodeViewProps> = () => {
  const { t } = useTranslation("flow");
  const { onUpdateNodeData, currentNodeIdSelected, findNode, hasParent } =
    useContext(NodeContext);

  const node = findNode(currentNodeIdSelected);

  const handleNodeDataChange = (fieldName: string, value: any) => {
    if (!node) return;
    onUpdateNodeData(node.id, {
      ...node.data,
      [fieldName]: value,
    });
  };

  function setDefaultOptions() {
    if (!node) return;
    const defaultOptions: any = {};
    node.data.config.fields
      .filter(
        (field: Field) =>
          field.options?.find((option) => option.default) &&
          !node.data[field.name],
      )
      .forEach((field: Field) => {
        defaultOptions[field.name] = field.options?.find(
          (option) => option.default,
        )?.value;
      });

    onUpdateNodeData(node.id, {
      ...node.data,
      ...defaultOptions,
    });
  }

  const formFields = useFormFields(
    node?.data,
    node?.id ?? "",
    handleNodeDataChange,
    setDefaultOptions,
    hasParent,
    {
      showHandles: false,
      showLabels: true,
    },
  );

  return (
    <>
      <ViewContainer className="space-y-2">
        <div className="flex justify-center text-lg">
          {currentNodeIdSelected}
        </div>
        <div className="flex flex-col space-y-3">
          <ExpandableBloc title="Inputs" defaultOpen>
            <div>{formFields}</div>
          </ExpandableBloc>
        </div>
        {!!node?.data && (
          <div className="flex flex-col space-y-3">
            <ExpandableBloc title="Output" defaultOpen>
              <OutputDisplay data={node?.data} />
            </ExpandableBloc>
          </div>
        )}
      </ViewContainer>
    </>
  );
};

const ViewContainer = styled.div`
  padding: 20px;
`;

export default memo(CurrentNodeView);
