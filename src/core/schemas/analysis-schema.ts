import { z } from 'zod';

export const CategoryEnum = z.enum([
  'auto_renewal_cancellation',
  'fee_changes_extra_costs',
  'data_collection_sharing',
  'third_party_transfer',
  'content_licensing_ip',
  'account_suspension_termination',
  'unilateral_change',
  'liability_limitation',
  'dispute_resolution_jurisdiction',
  'other_user_rights'
]);

export const SeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const LLMFindingSchema = z.object({
  id: z.string().min(1, 'Finding id zorunludur'),
  category: CategoryEnum,
  severity: SeverityEnum,
  titleTr: z.string().min(1, 'Bulgu başlığı boş olamaz'),
  quote: z.string().min(3, 'Alıntı en az 3 karakter olmalıdır'),
  explanationTr: z.string().min(1, 'Türkçe açıklama boş olamaz'),
  impactTr: z.string().min(1, 'Olası etki açıklaması boş olamaz'),
  recommendationTr: z.string().min(1, 'Öneri açıklaması boş olamaz'),
  confidence: z.number().min(0).max(1)
});

export const LLMOverallSchema = z.object({
  suggestedScore: z.number().min(0).max(100),
  summaryTr: z.string().min(1, 'Özet boş olamaz'),
  uncertaintyTr: z.string().min(1, 'Belirsizlik açıklaması boş olamaz')
});

export const LLMOutputSchema = z.object({
  schemaVersion: z.string().default('1.0'),
  overall: LLMOverallSchema,
  findings: z.array(LLMFindingSchema),
  securityNotes: z.string().optional()
});

export type ValidatedLLMOutput = z.infer<typeof LLMOutputSchema>;
export type ValidatedFinding = z.infer<typeof LLMFindingSchema>;

export function parseAndValidateLLMJson(rawText: string): {
  success: boolean;
  data?: ValidatedLLMOutput;
  error?: string;
  zodIssues?: z.ZodIssue[];
} {
  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      error: 'Model boş yanıt döndürdü'
    };
  }

  // Extract JSON from markdown fence if model wrapped in ```json ... ```
  let cleaned = rawText.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return {
      success: false,
      error: `JSON ayrıştırma hatası: ${err instanceof Error ? err.message : 'Geçersiz JSON biçimi'}`
    };
  }

  const result = LLMOutputSchema.safeParse(parsed);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    return {
      success: false,
      error: `Şema doğrulama hatası: ${errorDetails}`,
      zodIssues: result.error.issues
    };
  }

  return {
    success: true,
    data: result.data
  };
}
