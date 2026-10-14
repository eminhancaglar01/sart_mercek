import { UserSettings } from '../../shared/types/settings';
import { ExtractedDocument } from '../../shared/types/contract';
import { RawLLMOutput } from '../../shared/types/analysis';

export interface LLMRequest {
  document: ExtractedDocument;
  settings: UserSettings;
}

export interface LLMResponse {
  rawOutputText: string;
  parsedOutput?: RawLLMOutput;
  durationMs: number;
  model: string;
  provider: string;
}

export interface LLMProvider {
  analyze(request: LLMRequest): Promise<LLMResponse>;
  testConnection(settings: UserSettings): Promise<{ success: boolean; messageTr: string }>;
}
