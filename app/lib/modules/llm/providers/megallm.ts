import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class MegaLLMProvider extends BaseProvider {
  name = 'MegaLLM';
  getApiKeyLink = 'https://ai.megallm.io';

  config = {
    baseUrlKey: 'MEGALLM_API_BASE_URL',
    apiTokenKey: 'MEGALLM_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // Claude Sonnet 4.5: 200k context, 8692 output limit
    {
      name: 'claude-sonnet-4-5-20250929',
      label: 'Claude 4.5 Sonnet',
      provider: 'MegaLLM',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8692,
    },

    // Claude Sonnet 4: 200k context, 8692 output limit
    {
      name: 'claude-sonnet-4-20250514',
      label: 'Claude 4 Sonnet',
      provider: 'MegaLLM',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8692,
    },

    // Claude Haiku 4.5: 200k context, 8692 output limit
    {
      name: 'claude-haiku-4-5-20251001',
      label: 'Claude 4.5 Haiku',
      provider: 'MegaLLM',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8692,
    },

    // Claude 3.5 Sonnet: 200k context, 8692 output limit
    {
      name: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet',
      provider: 'MegaLLM',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8692,
    },

    // Claude 3 Haiku: 200k context, 8692 output limit
    {
      name: 'claude-3-haiku-20240307',
      label: 'Claude 3 Haiku',
      provider: 'MegaLLM',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8692,
    },

    // Claude Opus 4: 200k context, 8692 output limit
    {
      name: 'claude-opus-4-20250514',
      label: 'Claude 4 Opus',
      provider: 'MegaLLM',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8692,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'MEGALLM_API_BASE_URL',
      defaultApiTokenKey: 'MEGALLM_API_KEY',
    });

    // Use default base URL if not provided
    const finalBaseUrl = baseUrl || 'https://ai.megallm.io/v1';

    if (!apiKey) {
      return this.staticModels;
    }

    try {
      const response = await fetch(`${finalBaseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        console.log(`${this.name}: Failed to fetch dynamic models, using static models`);
        return this.staticModels;
      }

      const res = (await response.json()) as any;
      const staticModelIds = this.staticModels.map((m) => m.name);

      const dynamicModels = res.data
        .filter((model: any) => !staticModelIds.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: `${model.id}`,
          provider: this.name,
          maxTokenAllowed: 200000,
          maxCompletionTokens: 8692,
        }));

      return [...this.staticModels, ...dynamicModels];
    } catch (error) {
      console.log(`${this.name}: Error fetching models, using static models`, error);
      return this.staticModels;
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'MEGALLM_API_BASE_URL',
      defaultApiTokenKey: 'MEGALLM_API_KEY',
    });

    // Use default base URL if not provided
    const finalBaseUrl = baseUrl || 'https://ai.megallm.io/v1';

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    return getOpenAILikeModel(finalBaseUrl, apiKey, model);
  }
}
