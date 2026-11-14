import { AnthropicInput, ChatAnthropic as LangchainChatAnthropic } from '@langchain/anthropic'
import { BaseCache } from '@langchain/core/caches'
import { BaseLLMParams } from '@langchain/core/language_models/llms'
import { ICommonObject, IMultiModalOption, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { ChatAnthropic } from './FlowiseChatAnthropic'
import { getModels, MODEL_TYPE } from '../../../src/modelLoader'
import { getDefaultModelFor } from '../../../src/defaultChatModel'
import { DEFAULT_ADAPTIVE_THINKING_MODEL, supportsSamplingParams } from '../../../src/anthropicUtils'

class ChatAnthropic_ChatModels implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Anthropic Claude'
        this.name = 'chatAnthropic'
        this.version = 8.0
        this.type = 'ChatAnthropic'
        this.icon = 'Anthropic.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around ChatAnthropic large language models that use the Chat endpoint'
        this.baseClasses = [this.type, ...getBaseClasses(LangchainChatAnthropic)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['anthropicApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: getDefaultModelFor('anthropic')
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Allow Image Uploads',
                name: 'allowImageUploads',
                type: 'boolean',
                description:
                    'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
                optional: true
            },
            {
                label: 'Thinking Effort',
                description: 'Control how much effort the model spends on a response. Leave blank to use the model default.',
                name: 'thinkingEffort',
                type: 'options',
                optional: true,
                options: [
                    {
                        label: 'Low',
                        name: 'low'
                    },
                    {
                        label: 'Medium',
                        name: 'medium'
                    },
                    {
                        label: 'High',
                        name: 'high'
                    },
                    {
                        label: 'X-High',
                        name: 'xhigh',
                        description: 'Available on supported models.'
                    },
                    {
                        label: 'Max',
                        name: 'max',
                        description: 'Use the highest effort. Available on supported models.'
                    }
                ],
                additionalParams: true,
                show: {
                    modelName: DEFAULT_ADAPTIVE_THINKING_MODEL.source
                }
            },
            {
                label: 'Max Tokens',
                name: 'maxTokensToSample',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listModels(): Promise<INodeOptionsValue[]> {
            return await getModels(MODEL_TYPE.CHAT, 'chatAnthropic')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const temperature = nodeData.inputs?.temperature as string
        const modelName = nodeData.inputs?.modelName as string
        const maxTokens = nodeData.inputs?.maxTokensToSample as string
        const topP = nodeData.inputs?.topP as string
        const topK = nodeData.inputs?.topK as string
        const streaming = nodeData.inputs?.streaming as boolean
        const cache = nodeData.inputs?.cache as BaseCache
        const extendedThinking = nodeData.inputs?.extendedThinking as boolean
        const budgetTokens = nodeData.inputs?.budgetTokens as string
        const adaptiveThinking = nodeData.inputs?.adaptiveThinking as boolean
        // The SDK forwards effort verbatim, but its current type omits xhigh.
        const thinkingEffort = nodeData.inputs?.thinkingEffort as NonNullable<AnthropicInput['outputConfig']>['effort']

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const anthropicApiKey = getCredentialParam('anthropicApiKey', credentialData, nodeData)

        const allowImageUploads = nodeData.inputs?.allowImageUploads as boolean

        const adaptiveByDefault = DEFAULT_ADAPTIVE_THINKING_MODEL.test(modelName)
        const samplingSupported = !adaptiveByDefault && supportsSamplingParams(modelName)
        const useAdaptiveThinking = adaptiveByDefault || adaptiveThinking
        const thinkingEnabled = useAdaptiveThinking || extendedThinking

        const obj: Partial<AnthropicInput> & BaseLLMParams & { anthropicApiKey?: string } = {
            modelName,
            anthropicApiKey,
            streaming: streaming ?? true
        }

        // Temperature is incompatible with thinking modes and with models that
        // don't support sampling parameters.
        if (samplingSupported && !thinkingEnabled) {
            obj.temperature = parseFloat(temperature)
        }

        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (samplingSupported && topP) obj.topP = parseFloat(topP)
        if (samplingSupported && topK) obj.topK = parseFloat(topK)
        if (cache) obj.cache = cache

        // LangChain otherwise sends { type: 'disabled' }, which some current models reject.
        if (useAdaptiveThinking) {
            obj.thinking = {
                type: 'adaptive'
            }
            if (thinkingEffort) {
                obj.outputConfig = {
                    effort: thinkingEffort
                }
            }
        } else if (extendedThinking) {
            obj.thinking = {
                type: 'enabled',
                budget_tokens: parseInt(budgetTokens ?? '1024', 10)
            }
        }

        const multiModalOption: IMultiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        }

        const model = new ChatAnthropic(nodeData.id, obj)
        model.setMultiModalOption(multiModalOption)
        return model
    }
}

module.exports = { nodeClass: ChatAnthropic_ChatModels }
