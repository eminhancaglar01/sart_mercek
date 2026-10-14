import { DocumentType } from './contract';
import { RiskCategoryId, SeverityLevel, OverallRiskLevel } from '../constants/categories';

export interface ContractFinding {
  id: string;
  category: RiskCategoryId;
  severity: SeverityLevel;
  titleTr: string;
  quote: string;
  quoteStartIndex?: number;
  quoteEndIndex?: number;
  isQuoteVerified: boolean;
  explanationTr: string;
  impactTr: string;
  recommendationTr: string;
  confidence: number; // 0.0 - 1.0
}

export type RejectionReason =
  | 'QUOTE_NOT_FOUND_IN_SOURCE'
  | 'EMPTY_QUOTE'
  | 'HALLUCINATED_QUOTE'
  | 'PARAPHRASED_QUOTE';

export interface RejectedFinding {
  id: string;
  category: string;
  rejectionReason: RejectionReason;
  titleTr: string;
  attemptedQuoteSnippet: string; // Truncated/masked snippet, no private leakage
}

export interface SecurityReport {
  promptInjectionDetected: boolean;
  suspiciousPatternsFound: string[];
  noteTr: string | null;
}

export interface AnalysisReport {
  schemaVersion: '1.0';
  document: {
    type: DocumentType;
    title: string;
    sourceUrl: string;
    domain: string;
    coverage: 'full' | 'partial';
    coveragePercentage: number;
    contentHash: string;
    totalChars: number;
    analyzedChars: number;
  };
  overall: {
    score: number; // 0 - 100, deterministically calculated
    level: OverallRiskLevel;
    summaryTr: string;
    uncertaintyTr: string;
    llmSuggestedScore?: number;
  };
  findings: ContractFinding[];
  rejectedFindings: RejectedFinding[];
  security: SecurityReport;
  metadata: {
    model: string;
    provider: string;
    analyzedAt: string;
    durationMs: number;
    verifiedFindingCount: number;
    rejectedFindingCount: number;
  };
}

export interface RawLLMFinding {
  id: string;
  category: string;
  severity: string;
  titleTr: string;
  quote: string;
  explanationTr: string;
  impactTr: string;
  recommendationTr: string;
  confidence: number;
}

export interface RawLLMOutput {
  schemaVersion: string;
  overall: {
    suggestedScore: number;
    summaryTr: string;
    uncertaintyTr: string;
  };
  findings: RawLLMFinding[];
  securityNotes?: string;
}
