import { NodeConfig } from "./nodeConfig";

export const llmPromptNodeConfig: NodeConfig = {
    nodeName: 'LLMPrompt',
    icon: 'FaRobot',
    inputNames: ['initData'],
    fields: [
        {
            name: 'model',
            label: '',
            type: 'option',
            options: [
                {
                    label: 'GPT3.5',
                    value: 'gpt-3.5-turbo',
                    default: true,
                },
                {
                    label: 'GPT4',
                    value: 'gpt-4-turbo-preview'
                }
            ]
        },
        {
            name: 'prompt',
            type: 'textarea',
            required: true,
            placeholder: 'PromptPlaceholder',
        },

    ],
    outputType: 'text',
    hasInputHandle: true,
    section: 'models',
    helpMessage: 'llmPromptHelp',
};