export type LLMProviderType = 'openai' | 'custom' | 'mock';

export interface UserSettings {
  provider: LLMProviderType;
  baseUrl: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  externalConsentAcknowledged: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
  maxTokens: 3000,
  temperature: 0.1,
  externalConsentAcknowledged: false
};
