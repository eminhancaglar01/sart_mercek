import { ExtractedDocument } from '../../shared/types/contract';
import { AnalysisReport } from '../../shared/types/analysis';
import { LLMResponse } from '../llm/types';
import { parseAndValidateLLMJson } from '../schemas/analysis-schema';
import { validateFindingsQuotes } from '../validation/quote-validator';
import { calculateDeterministicRiskScore } from '../risk-scoring/scorer';
import { inspectTextForPromptInjection } from '../security/injection-detector';
import { AppError } from '../../shared/errors/app-errors';

export function generateAnalysisReport(
  document: ExtractedDocument,
  llmResponse: LLMResponse
): AnalysisReport {
  // 1. Security inspection for prompt injection patterns
  const securityReport = inspectTextForPromptInjection(document.rawText);

  // 2. Parse & Validate JSON with Zod Schema
  const parseResult = parseAndValidateLLMJson(llmResponse.rawOutputText);
  if (!parseResult.success || !parseResult.data) {
    throw new AppError(
      'SCHEMA_VALIDATION_ERROR',
      parseResult.error || 'Model çıktısı beklenen şemaya uygun JSON üretmedi.'
    );
  }

  const validatedOutput = parseResult.data;

  // 3. Deterministic Quote Verification
  const quoteResult = validateFindingsQuotes(validatedOutput.findings, document.rawText);

  // 4. Calculate Deterministic Risk Score based strictly on verified findings
  const scoring = calculateDeterministicRiskScore(
    quoteResult.verifiedFindings,
    document.isTruncated,
    document.coveragePercentage
  );

  // If prompt injection was detected, incorporate into uncertainty note
  let finalUncertaintyTr = scoring.uncertaintyTr;
  if (securityReport.promptInjectionDetected) {
    finalUncertaintyTr += ' [GÜVENLİK BİLDİRİMİ: Metinde yapay zekâ yönlendirme girişimi tespit edilmiştir; bu komutlar analizi etkilemeyecek şekilde izole edilmiştir.]';
  }

  return {
    schemaVersion: '1.0',
    document: {
      type: document.detectedType,
      title: document.pageTitle,
      sourceUrl: document.sourceUrl,
      domain: document.domain,
      coverage: document.coverage,
      coveragePercentage: document.coveragePercentage,
      contentHash: document.contentHash,
      totalChars: document.totalLength,
      analyzedChars: document.analyzedLength
    },
    overall: {
      score: scoring.score,
      level: scoring.level,
      summaryTr: scoring.summaryTr,
      uncertaintyTr: finalUncertaintyTr,
      llmSuggestedScore: validatedOutput.overall.suggestedScore
    },
    findings: quoteResult.verifiedFindings,
    rejectedFindings: quoteResult.rejectedFindings,
    security: securityReport,
    metadata: {
      model: llmResponse.model,
      provider: llmResponse.provider,
      analyzedAt: new Date().toISOString(),
      durationMs: llmResponse.durationMs,
      verifiedFindingCount: quoteResult.verifiedCount,
      rejectedFindingCount: quoteResult.rejectedCount
    }
  };
}
