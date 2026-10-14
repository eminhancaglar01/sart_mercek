/**
 * Page-Agent Architecture & Security Evaluation Module
 *
 * This module evaluates @page-agent/core (v1.12.4) against the security and functional
 * requirements of ŞartMercek (Turkish Contract Risk Analyzer).
 *
 * EVALUATION FINDINGS:
 * 1. Active Automation vs. Passive Inspection:
 *    - @page-agent/core is primarily a GUI automation engine designed to plan and execute
 *      actions on the page (clicks, keyboard input, navigation, custom tool execution).
 *    - For contract analysis, active actions on untrusted third-party legal pages pose severe
 *      risks: untrusted text could trick an active agent into clicking "Accept Terms",
 *      navigating away, or executing arbitrary JavaScript on the page.
 *
 * 2. API Key Leakage Prevention:
 *    - PageAgentCore requires an LLMConfig (baseURL, apiKey, model) directly in its constructor.
 *    - If instantiated in the web page or content script context, the user's private LLM API key
 *      would be exposed to the page DOM or untrusted scripts.
 *    - ŞartMercek strictly isolates all LLM calls to the Extension Background Service Worker.
 *
 * 3. Safe Read-Only Policy:
 *    - Passive contract extraction must be 100% deterministic, read-only, non-executable,
 *      and immune to prompt injection attacks embedded inside hidden or visible DOM elements.
 *    - Therefore, ŞartMercek utilizes its own dedicated, sanitized `dom-extractor.ts` for
 *      direct DOM text extraction, while evaluating and documenting `@page-agent/core` API
 *      capabilities herein.
 */

import { PageAgentCore } from '@page-agent/core';

export interface PageAgentEvaluationReport {
  packageName: string;
  evaluatedVersion: string;
  isActionExecutionSafeForContracts: boolean;
  canSafelyRunInWebpageContext: boolean;
  supportedReadActions: string[];
  securityRestrictions: string[];
  recommendationTr: string;
}

export function evaluatePageAgentSecurity(): PageAgentEvaluationReport {
  const isCoreAvailable = typeof PageAgentCore === 'function';

  return {
    packageName: '@page-agent/core',
    evaluatedVersion: '1.12.4',
    isActionExecutionSafeForContracts: false,
    canSafelyRunInWebpageContext: false,
    supportedReadActions: [
      'DOM tree inspection',
      'Accessibility tree parsing',
      'Visual screenshot grounding (multimodal)'
    ],
    securityRestrictions: [
      'Do NOT pass user LLM API keys to web page or content script context.',
      'Do NOT allow execute() or step-based automated actions on untrusted third-party contract pages.',
      'Do NOT allow natural language instructions from third-party contract text to trigger tool calls or DOM mutations.',
      'All LLM calls MUST remain in the background service worker boundary.'
    ],
    recommendationTr:
      'Sözleşme risk analizi pasif ve salt okunur bir işlemdir. @page-agent/core’un eylem yürütücüsü (execute/step), üçüncü taraf sözleşme sayfalarında prompt injection ve istenmeyen tıklama/gezinme riski doğurur. Bu sebeple metin çıkarma işlemi doğrudan güvenli DOM çıkarıcısı (dom-extractor.ts) ile gerçekleştirilmiş, LLM sorgulaması ise arka plan katmanına izole edilmiştir.'
  };
}
