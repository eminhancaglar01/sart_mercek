import { ValidatedFinding } from '../schemas/analysis-schema';
import { ContractFinding, RejectedFinding, RejectionReason } from '../../shared/types/analysis';

export interface QuoteValidationResult {
  verifiedFindings: ContractFinding[];
  rejectedFindings: RejectedFinding[];
  totalChecked: number;
  verifiedCount: number;
  rejectedCount: number;
}

/**
 * Normalizes string whitespace for comparison without altering word tokens.
 * Collapses all spaces, tabs, and newlines into a single space and trims.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Safely creates a masked snippet for rejected quotes to avoid leaking sensitive data in logs/reports.
 */
function maskSnippet(quote: string, maxLength = 30): string {
  const trimmed = quote.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}...`;
}

/**
 * Deterministically verifies that each finding's quote exists verbatim or in
 * whitespace-normalized form inside the provided source text.
 * Hallucinated, rewritten, paraphrased, or missing quotes are strictly rejected.
 */
export function validateFindingsQuotes(
  findings: ValidatedFinding[],
  sourceText: string
): QuoteValidationResult {
  const verifiedFindings: ContractFinding[] = [];
  const rejectedFindings: RejectedFinding[] = [];

  if (!sourceText || !sourceText.trim()) {
    // If source text is empty, all findings must be rejected
    for (const f of findings) {
      rejectedFindings.push({
        id: f.id,
        category: f.category,
        rejectionReason: 'QUOTE_NOT_FOUND_IN_SOURCE',
        titleTr: f.titleTr,
        attemptedQuoteSnippet: maskSnippet(f.quote)
      });
    }
    return {
      verifiedFindings: [],
      rejectedFindings,
      totalChecked: findings.length,
      verifiedCount: 0,
      rejectedCount: findings.length
    };
  }

  const normalizedSource = normalizeWhitespace(sourceText);

  for (const finding of findings) {
    const rawQuote = finding.quote;

    // Check empty or whitespace only
    if (!rawQuote || !rawQuote.trim() || rawQuote.trim().length < 3) {
      rejectedFindings.push({
        id: finding.id,
        category: finding.category,
        rejectionReason: 'EMPTY_QUOTE',
        titleTr: finding.titleTr,
        attemptedQuoteSnippet: maskSnippet(rawQuote || '')
      });
      continue;
    }

    const trimmedQuote = rawQuote.trim();

    // 1. Direct verbatim substring search
    const exactIndex = sourceText.indexOf(trimmedQuote);
    if (exactIndex !== -1) {
      verifiedFindings.push({
        id: finding.id,
        category: finding.category,
        severity: finding.severity,
        titleTr: finding.titleTr,
        quote: trimmedQuote,
        quoteStartIndex: exactIndex,
        quoteEndIndex: exactIndex + trimmedQuote.length,
        isQuoteVerified: true,
        explanationTr: finding.explanationTr,
        impactTr: finding.impactTr,
        recommendationTr: finding.recommendationTr,
        confidence: finding.confidence
      });
      continue;
    }

    // 2. Normalized whitespace search (handles differing line breaks/spacing)
    const normalizedQuote = normalizeWhitespace(trimmedQuote);
    const normalizedIndex = normalizedSource.indexOf(normalizedQuote);

    if (normalizedIndex !== -1) {
      // Confirmed in source text with normalized spacing
      verifiedFindings.push({
        id: finding.id,
        category: finding.category,
        severity: finding.severity,
        titleTr: finding.titleTr,
        quote: trimmedQuote,
        isQuoteVerified: true,
        explanationTr: finding.explanationTr,
        impactTr: finding.impactTr,
        recommendationTr: finding.recommendationTr,
        confidence: finding.confidence
      });
      continue;
    }

    // 3. Hallucinated, modified, or paraphrased quote -> REJECT
    rejectedFindings.push({
      id: finding.id,
      category: finding.category,
      rejectionReason: 'QUOTE_NOT_FOUND_IN_SOURCE',
      titleTr: finding.titleTr,
      attemptedQuoteSnippet: maskSnippet(trimmedQuote)
    });
  }

  return {
    verifiedFindings,
    rejectedFindings,
    totalChecked: findings.length,
    verifiedCount: verifiedFindings.length,
    rejectedCount: rejectedFindings.length
  };
}
