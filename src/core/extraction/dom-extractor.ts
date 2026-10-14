import { ExtractedDocument, DocumentDetectionResult } from '../../shared/types/contract';
import { detectDocumentType } from '../document-detection/detector';

export interface ExtractionOptions {
  maxCharacters?: number;
  includeShadowDom?: boolean;
}

const DEFAULT_MAX_CHARS = 35000; // Safe upper bound for single LLM prompt context

/**
 * Deterministic hash computation (SHA-256 when crypto.subtle is available,
 * fallback to 32-bit FNV-1a hex for pure synchronous / legacy environments).
 */
export async function computeContentHash(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // FNV-1a 32-bit hash fallback
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Checks whether an element is visually hidden from the user.
 * Evaluates inline styles, CSS computed styles (if available in window context),
 * and standard HTML hidden attributes.
 */
export function isElementHidden(element: Element): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  // 1. Explicit HTML attributes
  if (element.hasAttribute('hidden')) return true;
  if (element.getAttribute('aria-hidden') === 'true') return true;

  // 2. Inline styles
  const style = element.style;
  if (style) {
    if (style.display === 'none') return true;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return true;
    if (style.opacity === '0') return true;
  }

  // 3. Computed styles (if available in browser context)
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    try {
      const computed = window.getComputedStyle(element);
      if (computed.display === 'none') return true;
      if (computed.visibility === 'hidden' || computed.visibility === 'collapse') return true;
      if (computed.opacity === '0') return true;
    } catch {
      // Ignore if disconnected or unsupported
    }
  }

  return false;
}

/**
 * Check if the element is irrelevant (menus, nav, ads, scripts, footer, etc.)
 */
const IRRELEVANT_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'SVG',
  'CANVAS',
  'AUDIO',
  'VIDEO',
  'NAV',
  'HEADER',
  'FOOTER',
  'ASIDE'
]);

const IRRELEVANT_SELECTORS = [
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '[aria-modal="true"]',
  '.cookie-banner',
  '.cookie-notice',
  '#cookie-banner',
  '.advertisement',
  '.ad-banner',
  '.sidebar',
  '.site-footer',
  '.site-header',
  '.nav-menu'
];

export function isIrrelevantElement(element: Element): boolean {
  if (IRRELEVANT_TAGS.has(element.tagName.toUpperCase())) {
    return true;
  }

  for (const selector of IRRELEVANT_SELECTORS) {
    try {
      if (element.matches && element.matches(selector)) {
        return true;
      }
    } catch {
      // Ignore selector errors
    }
  }

  return false;
}

/**
 * Traverses a DOM node recursively, skipping hidden & irrelevant elements,
 * and extracting text segments with proper spacing.
 */
function extractNodeText(node: Node, lines: string[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      lines.push(text);
    }
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;

    if (isElementHidden(el)) {
      return; // Skip hidden elements entirely (prevents display:none prompt injection)
    }

    if (isIrrelevantElement(el)) {
      return; // Skip nav, footer, scripts, etc.
    }

    // Handle Shadow DOM if present
    if (el.shadowRoot) {
      for (const child of Array.from(el.shadowRoot.childNodes)) {
        extractNodeText(child, lines);
      }
    }

    // Traverse child nodes
    for (const child of Array.from(el.childNodes)) {
      extractNodeText(child, lines);
    }

    // If block element, push a line break marker
    const tag = el.tagName.toUpperCase();
    if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'SECTION', 'ARTICLE'].includes(tag)) {
      lines.push('\n');
    }
  }
}

/**
 * Extracts visible, readable contract text from a Document or Root Element.
 */
export async function extractDocumentFromDOM(
  doc: Document,
  sourceUrl = '',
  options: ExtractionOptions = {}
): Promise<ExtractedDocument> {
  const maxChars = options.maxCharacters ?? DEFAULT_MAX_CHARS;
  const pageTitle = doc.title || '';
  const url = sourceUrl || (typeof window !== 'undefined' ? window.location.href : '');

  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = 'localhost';
  }

  // Find candidate main content root: <main>, <article>, [role="main"], or <body>
  const mainCandidate =
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('[role="main"]') ||
    doc.body;

  const rawLines: string[] = [];
  if (mainCandidate) {
    extractNodeText(mainCandidate, rawLines);
  }

  // Normalize extracted text
  const joinedText = rawLines.join(' ');
  const cleanedText = joinedText
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();

  // Extract headings for detection
  const headingElements = doc.querySelectorAll('h1, h2, h3');
  const headings = Array.from(headingElements)
    .filter((h) => !isElementHidden(h))
    .map((h) => h.textContent?.trim() || '')
    .filter(Boolean);

  // Detect document type and confidence
  const detection = detectDocumentType({
    url,
    title: pageTitle,
    headings,
    sampleText: cleanedText
  });

  const totalLength = cleanedText.length;
  const isTruncated = totalLength > maxChars;
  const analyzedText = isTruncated ? cleanedText.slice(0, maxChars) : cleanedText;
  const analyzedLength = analyzedText.length;
  const coveragePercentage = totalLength === 0 ? 0 : Math.round((analyzedLength / totalLength) * 100);

  const contentHash = await computeContentHash(cleanedText);

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sourceUrl: url,
    domain,
    pageTitle,
    detectedType: detection.detectedType,
    detectionConfidence: detection.confidence,
    detectionReasons: detection.reasons,
    rawText: cleanedText,
    normalizedText: analyzedText,
    contentHash,
    capturedAt: new Date().toISOString(),
    coverage: isTruncated ? 'partial' : 'full',
    coveragePercentage,
    totalLength,
    analyzedLength,
    isTruncated,
    truncationReason: isTruncated
      ? `Sözleşme çok uzun (${totalLength.toLocaleString('tr-TR')} karakter). Güvenli model bağlamı için metnin ilk ${analyzedLength.toLocaleString('tr-TR')} karakterlik kısmi bölümü (%${coveragePercentage}) analize dahil edildi.`
      : undefined
  };
}
