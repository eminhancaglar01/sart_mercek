import { LLMProvider, LLMRequest, LLMResponse } from './types';
import { UserSettings } from '../../shared/types/settings';

export class MockLLMProvider implements LLMProvider {
  private customResponseGenerator?: (docText: string) => string;

  constructor(customResponseGenerator?: (docText: string) => string) {
    this.customResponseGenerator = customResponseGenerator;
  }

  setCustomResponse(generator: (docText: string) => string): void {
    this.customResponseGenerator = generator;
  }

  async testConnection(_settings: UserSettings): Promise<{ success: boolean; messageTr: string }> {
    return {
      success: true,
      messageTr: 'Test sağlayıcısı (Mock) hazır ve çalışıyor.'
    };
  }

  async analyze(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const docText = request.document.normalizedText;

    if (this.customResponseGenerator) {
      const output = this.customResponseGenerator(docText);
      return {
        rawOutputText: output,
        durationMs: Date.now() - startTime,
        model: 'mock-test-model',
        provider: 'mock (test_only)'
      };
    }

    // Default mock response: scans for typical keywords or generates realistic structure
    const defaultResponse = {
      schemaVersion: '1.0',
      overall: {
        suggestedScore: 55,
        summaryTr: 'Otomatik test senaryosu için üretilmiş örnek risk özeti.',
        uncertaintyTr: 'Bu sonuç test amaçlı sahte sağlayıcı (Mock) tarafından üretilmiştir.'
      },
      findings: [
        {
          id: 'mock-1',
          category: 'unilateral_change',
          severity: 'high',
          titleTr: 'Tek taraflı sözleşme değişikliği',
          quote: docText.slice(0, 80).trim(), // extracts a real slice so quote matches
          explanationTr: 'Şirket koşulları tek taraflı değiştirebilir.',
          impactTr: 'Kullanıcı haklarında aleyhe değişiklikler oluşabilir.',
          recommendationTr: 'Şart değişiklik bildirimlerini takip edin.',
          confidence: 0.95
        }
      ],
      securityNotes: undefined
    };

    return {
      rawOutputText: JSON.stringify(defaultResponse, null, 2),
      durationMs: Date.now() - startTime,
      model: 'mock-test-model',
      provider: 'mock (test_only)'
    };
  }
}
