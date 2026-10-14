import { describe, it, expect } from 'vitest';
import { calculateDeterministicRiskScore } from './scorer';
import { ContractFinding } from '../../shared/types/analysis';

function makeMockFinding(id: string, severity: 'low' | 'medium' | 'high' | 'critical'): ContractFinding {
  return {
    id,
    category: 'unilateral_change',
    severity,
    titleTr: `Bulgu ${id}`,
    quote: 'Örnek alıntı metni',
    isQuoteVerified: true,
    explanationTr: 'Açıklama',
    impactTr: 'Etki',
    recommendationTr: 'Öneri',
    confidence: 0.9
  };
}

describe('calculateDeterministicRiskScore', () => {
  it('should return score 0 and low risk when no verified findings exist', () => {
    const result = calculateDeterministicRiskScore([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
    expect(result.summaryTr).toContain('Doğrulanmış herhangi bir yüksek riskli madde tespit edilmedi');
  });

  it('should calculate weighted sum correctly (critical=25, high=15, medium=8, low=3)', () => {
    const findings: ContractFinding[] = [
      makeMockFinding('1', 'critical'), // 25
      makeMockFinding('2', 'high'),     // 15
      makeMockFinding('3', 'medium')    // 8
    ]; // Total = 48 -> moderate risk (21-50)

    const result = calculateDeterministicRiskScore(findings);
    expect(result.score).toBe(48);
    expect(result.level).toBe('moderate');
    expect(result.severityCounts.critical).toBe(1);
    expect(result.severityCounts.high).toBe(1);
    expect(result.severityCounts.medium).toBe(1);
  });

  it('should clamp total score to maximum 100', () => {
    const findings: ContractFinding[] = [
      makeMockFinding('1', 'critical'), // 25
      makeMockFinding('2', 'critical'), // 25
      makeMockFinding('3', 'critical'), // 25
      makeMockFinding('4', 'critical'), // 25
      makeMockFinding('5', 'critical')  // 25 -> 125 clamped to 100
    ];

    const result = calculateDeterministicRiskScore(findings);
    expect(result.score).toBe(100);
    expect(result.level).toBe('critical');
  });

  it('should append uncertainty warning when document is truncated', () => {
    const findings: ContractFinding[] = [makeMockFinding('1', 'medium')];
    const result = calculateDeterministicRiskScore(findings, true, 45);

    expect(result.uncertaintyTr).toContain('metnin yalnızca %45\'lik bölümü analiz edilmiştir');
  });
});
