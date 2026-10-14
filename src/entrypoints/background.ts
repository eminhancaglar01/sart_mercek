import { defineBackground } from 'wxt/utils/define-background';
import { UserSettings, DEFAULT_SETTINGS } from '../shared/types/settings';
import { ExtensionMessage, MessageResponse } from '../shared/types/messages';
import { OpenAIProvider } from '../core/llm/openai-provider';
import { MockLLMProvider } from '../core/llm/mock-provider';
import { generateAnalysisReport } from '../core/reporting/report-generator';
import { AppError } from '../shared/errors/app-errors';
import { AnalysisReport } from '../shared/types/analysis';

export default defineBackground(() => {
  // Helper to load settings from storage
  async function getStoredSettings(): Promise<UserSettings> {
    try {
      const data = await chrome.storage.local.get('userSettings');
      return { ...DEFAULT_SETTINGS, ...(data.userSettings || {}) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  // Helper to save settings
  async function saveStoredSettings(settings: UserSettings): Promise<void> {
    await chrome.storage.local.set({ userSettings: settings });
  }

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    // Process asynchronously
    (async () => {
      try {
        switch (message.action) {
          case 'GET_SETTINGS': {
            const settings = await getStoredSettings();
            sendResponse({ success: true, data: settings });
            break;
          }

          case 'SAVE_SETTINGS': {
            await saveStoredSettings(message.settings);
            sendResponse({ success: true, data: message.settings });
            break;
          }

          case 'CLEAR_API_KEY': {
            const settings = await getStoredSettings();
            settings.apiKey = '';
            await saveStoredSettings(settings);
            sendResponse({ success: true, data: settings });
            break;
          }

          case 'TEST_CONNECTION': {
            const provider =
              message.settings.provider === 'mock'
                ? new MockLLMProvider()
                : new OpenAIProvider();
            const result = await provider.testConnection(message.settings);
            sendResponse({
              success: result.success,
              data: result,
              error: result.success ? undefined : result.messageTr
            });
            break;
          }

          case 'START_ANALYSIS': {
            const stored = await getStoredSettings();
            const settings: UserSettings = {
              ...stored,
              ...(message.overrideSettings || {})
            };

            if (settings.provider !== 'mock' && (!settings.apiKey || !settings.apiKey.trim())) {
              throw new AppError(
                'MISSING_API_KEY',
                'Analiz için geçerli bir API anahtarı gereklidir. Lütfen Ayarlar sekmesinden anahtarınızı girin.'
              );
            }

            const provider =
              settings.provider === 'mock'
                ? new MockLLMProvider()
                : new OpenAIProvider();

            const llmResponse = await provider.analyze({
              document: message.document,
              settings
            });

            const report: AnalysisReport = generateAnalysisReport(message.document, llmResponse);

            sendResponse({ success: true, data: report });
            break;
          }

          default:
            sendResponse({ success: false, error: 'Bilinmeyen işlem türü' });
        }
      } catch (err: unknown) {
        if (err instanceof AppError) {
          sendResponse({
            success: false,
            error: err.userMessageTr,
            errorCode: err.code
          });
        } else {
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : 'Bilinmeyen arka plan hatası',
            errorCode: 'UNKNOWN_ERROR'
          });
        }
      }
    })();

    return true; // Keep message channel open for async response
  });
});
