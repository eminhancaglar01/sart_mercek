import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractDocumentFromDOM } from '../core/extraction/dom-extractor';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message && message.action === 'EXTRACT_DOCUMENT') {
        (async () => {
          try {
            const doc = await extractDocumentFromDOM(document, window.location.href);
            sendResponse({ success: true, data: doc });
          } catch (err) {
            sendResponse({
              success: false,
              error: err instanceof Error ? err.message : 'DOM metni çıkarılamadı'
            });
          }
        })();
        return true; // Keep open for async response
      }
    });
  }
});
