import { ContractFinding, OverallRiskLevel } from '../../shared/types/analysis';
import { SEVERITY_LEVELS, RISK_SCORE_THRESHOLDS } from '../../shared/constants/categories';

export interface ScoreCalculationResult {
  score: number; // 0 - 100
  level: OverallRiskLevel;
  levelLabelTr: string;
  summaryTr: string;
  uncertaintyTr: string;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Calculates deterministic risk score based strictly on verified findings.
 * Weights:
 * - Critical: 25 points
 * - High: 15 points
 * - Medium: 8 points
 * - Low: 3 points
 *
 * Total is clamped between 0 and 100.
 */
export function calculateDeterministicRiskScore(
  verifiedFindings: ContractFinding[],
  isTruncated = false,
  coveragePercentage = 100
): ScoreCalculationResult {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  let rawScore = 0;

  for (const finding of verifiedFindings) {
    const sev = finding.severity;
    if (sev === 'critical') {
      counts.critical++;
      rawScore += SEVERITY_LEVELS.critical.weight;
    } else if (sev === 'high') {
      counts.high++;
      rawScore += SEVERITY_LEVELS.high.weight;
    } else if (sev === 'medium') {
      counts.medium++;
      rawScore += SEVERITY_LEVELS.medium.weight;
    } else if (sev === 'low') {
      counts.low++;
      rawScore += SEVERITY_LEVELS.low.weight;
    }
  }

  const score = Math.min(100, Math.max(0, rawScore));

  let level: OverallRiskLevel = 'low';
  let levelLabelTr = RISK_SCORE_THRESHOLDS.low.labelTr;

  if (score > RISK_SCORE_THRESHOLDS.high.max) {
    level = 'critical';
    levelLabelTr = RISK_SCORE_THRESHOLDS.critical.labelTr;
  } else if (score > RISK_SCORE_THRESHOLDS.moderate.max) {
    level = 'high';
    levelLabelTr = RISK_SCORE_THRESHOLDS.high.labelTr;
  } else if (score > RISK_SCORE_THRESHOLDS.low.max) {
    level = 'moderate';
    levelLabelTr = RISK_SCORE_THRESHOLDS.moderate.labelTr;
  }

  let summaryTr = '';
  if (verifiedFindings.length === 0) {
    summaryTr = 'Doğrulanmış herhangi bir yüksek riskli madde tespit edilmedi veya sözleşme standart şartlar içermektedir.';
  } else {
    const items: string[] = [];
    if (counts.critical > 0) items.push(`${counts.critical} kritik`);
    if (counts.high > 0) items.push(`${counts.high} yüksek`);
    if (counts.medium > 0) items.push(`${counts.medium} orta`);
    if (counts.low > 0) items.push(`${counts.low} düşük`);
    summaryTr = `Sözleşmede ${verifiedFindings.length} adet doğrulanmış riskli madde (${items.join(', ')}) tespit edildi.`;
  }

  let uncertaintyTr = 'Bu skor, kaynak metinden doğrulanmış alıntılara dayalı algoritmik bir sezgisel puandır; hukuki bağlayıcılığı veya kesinliği yoktur.';
  if (isTruncated) {
    uncertaintyTr += ` DİKKAT: Sayfa çok uzun olduğundan metnin yalnızca %${coveragePercentage}'lik bölümü analiz edilmiştir; kapsam dışı kalan kısımlarda ilave riskler bulunabilir.`;
  }

  return {
    score,
    level,
    levelLabelTr,
    summaryTr,
    uncertaintyTr,
    severityCounts: counts
  };
}
