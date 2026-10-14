export type DocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'subscription_terms'
  | 'user_agreement'
  | 'unknown';

export interface ExtractedDocument {
  id: string;
  sourceUrl: string;
  domain: string;
  pageTitle: string;
  detectedType: DocumentType;
  detectionConfidence: number; // 0.0 to 1.0
  detectionReasons: string[];
  rawText: string;
  normalizedText: string;
  contentHash: string;
  capturedAt: string; // ISO 8601
  coverage: 'full' | 'partial';
  coveragePercentage: number;
  totalLength: number;
  analyzedLength: number;
  isTruncated: boolean;
  truncationReason?: string;
}

export interface DocumentDetectionResult {
  isLikelyContract: boolean;
  detectedType: DocumentType;
  confidence: number; // 0.0 to 1.0
  reasons: string[];
  titleTr: string;
}
