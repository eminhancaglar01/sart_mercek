import { LLMProvider, LLMRequest, LLMResponse } from './types';
import { UserSettings } from '../../shared/types/settings';
import { AppError } from '../../shared/errors/app-errors';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder';

export class OpenAIProvider implements LLMProvider {
  private sanitizeBaseUrl(url: string): string {
    const trimmed = (url || 'https://api.openai.com/v1').trim();
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }

  async testConnection(settings: UserSettings): Promise<{ success: boolean; messageTr: string }> {
    if (!settings.apiKey || !settings.apiKey.trim()) {
      return { success: false, messageTr: 'API anahtarı boş bırakılamaz.' };
    }

    const baseUrl = this.sanitizeBaseUrl(settings.baseUrl);
    const endpoint = `${baseUrl}/models`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          messageTr: 'Yetkilendirme başarısız: API anahtarı geçersiz veya yetkisiz.'
        };
      }

      if (!res.ok) {
        return {
          success: false,
          messageTr: `Sunucu hata kodu döndürdü (${res.status}): ${res.statusText}`
        };
      }

      return {
        success: true,
        messageTr: `Bağlantı başarılı! Sağlayıcı ve endpoint erişilebilir (${settings.model}).`
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, messageTr: 'Bağlantı testi zaman aşımına uğradı (10 sn).' };
      }
      return {
        success: false,
        messageTr: `Ağ hatası: ${err instanceof Error ? err.message : 'Sunucuya ulaşılamadı'}`
      };
    }
  }

  async analyze(request: LLMRequest): Promise<LLMResponse> {
    const { document, settings } = request;

    if (!settings.apiKey || !settings.apiKey.trim()) {
      throw new AppError(
        'MISSING_API_KEY',
        'API anahtarı bulunamadı. Lütfen Ayarlar sekmesinden OpenAI uyumlu bir API anahtarı girin.'
      );
    }

    const baseUrl = this.sanitizeBaseUrl(settings.baseUrl);
    const endpoint = `${baseUrl}/chat/completions`;

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(document);

    const payload = {
      model: settings.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: settings.temperature ?? 0.1,
      max_tokens: settings.maxTokens ?? 3000,
      response_format: { type: 'json_object' }
    };

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutMs = 45000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey.trim()}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          'INVALID_API_KEY',
          'API anahtarı geçersiz veya yetkisiz. Lütfen Ayarlar sayfasından anahtarınızı kontrol edin.'
        );
      }

      if (response.status === 429) {
        throw new AppError(
          'RATE_LIMIT_ERROR',
          'API sağlayıcısı hız limiti veya kota aşımı (Rate limit) bildirdi. Lütfen bakiyenizi kontrol edin veya biraz sonra deneyin.'
        );
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new AppError(
          'NETWORK_ERROR',
          `API sağlayıcısı hata döndürdü (Kod ${response.status}): ${response.statusText}`,
          errorBody
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        throw new AppError('SCHEMA_VALIDATION_ERROR', 'Model boş veya tanımsız bir içerik yanıtı üretti.');
      }

      const durationMs = Date.now() - startTime;

      return {
        rawOutputText: content,
        durationMs,
        model: settings.model,
        provider: 'openai'
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof AppError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError(
          'TIMEOUT_ERROR',
          `Model yanıtı belirlenen ${timeoutMs / 1000} saniye içinde vermedi (Zaman Aşımı).`
        );
      }

      throw new AppError(
        'NETWORK_ERROR',
        `API sağlayıcısına bağlanırken ağ hatası oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`
      );
    }
  }
}
