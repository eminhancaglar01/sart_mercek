import { describe, it, expect } from 'vitest';
import { validateFindingsQuotes } from './quote-validator';
import { parseAndValidateLLMJson } from '../schemas/analysis-schema';
import { ValidatedFinding } from '../schemas/analysis-schema';

const SAMPLE_SOURCE = `
KULLANIM KOŞULLARI VE ABONELİK ŞARTLARI
Madde 1: Şirketimiz, işbu sözleşme koşullarını önceden haber vermeksizin dilediği zaman tek taraflı olarak değiştirme hakkını saklı tutar.
Madde 2: Abonelikler, dönem sonunda kullanıcı tarafından iptal edilmediği sürece aynı ücret üzerinden otomatik olarak bir yıl daha yenilenir.
Madde 3: Kullanıcının yüklediği tüm içerikler üzerinde şirketimize süresiz, geri alınamaz, dünya çapında ve telifsiz bir kullanım lisansı verilmiş sayılır.
Madde 4: Şirket, sistem kesintilerinden veya veri kayıplarından doğabilecek doğrudan veya dolaylı zararlardan hiçbir şekilde sorumlu tutulamaz.
`;

describe('quote-validator — Alıntı Doğrulama Testleri', () => {
  const baseFinding: Omit<ValidatedFinding, 'id' | 'quote'> = {
    category: 'unilateral_change',
    severity: 'high',
    titleTr: 'Tek taraflı değişiklik',
    explanationTr: 'Şartlar haber verilmeden değiştirilebilir.',
    impactTr: 'Kullanıcı aleyhine yeni kurallar getirilebilir.',
    recommendationTr: 'Değişiklik bildirimlerini düzenli kontrol edin.',
    confidence: 0.95
  };

  it('Case 1: Kaynakta birebir bulunan alıntı kabul ediliyor', () => {
    const findings: ValidatedFinding[] = [
      {
        ...baseFinding,
        id: 'f-1',
        quote: 'Şirketimiz, işbu sözleşme koşullarını önceden haber vermeksizin dilediği zaman tek taraflı olarak değiştirme hakkını saklı tutar.'
      }
    ];

    const result = validateFindingsQuotes(findings, SAMPLE_SOURCE);

    expect(result.verifiedCount).toBe(1);
    expect(result.rejectedCount).toBe(0);
    expect(result.verifiedFindings[0].isQuoteVerified).toBe(true);
    expect(result.verifiedFindings[0].quoteStartIndex).toBeDefined();
  });

  it('Case 2: Uydurulmuş (hallucinated) alıntı reddediliyor', () => {
    const findings: ValidatedFinding[] = [
      {
        ...baseFinding,
        id: 'f-fake',
        quote: 'Kullanıcılar her ay 500 Dolar ceza ödemeyi peşinen kabul ederler.'
      }
    ];

    const result = validateFindingsQuotes(findings, SAMPLE_SOURCE);

    expect(result.verifiedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.rejectedFindings[0].rejectionReason).toBe('QUOTE_NOT_FOUND_IN_SOURCE');
  });

  it('Case 3: Kaynaktaki anlamı değiştirerek veya yeniden yazılarak oluşturulmuş alıntı reddediliyor', () => {
    const findings: ValidatedFinding[] = [
      {
        ...baseFinding,
        id: 'f-paraphrased',
        // Orijinal: "Abonelikler, dönem sonunda kullanıcı tarafından iptal edilmediği sürece..."
        // Paraphrased:
        quote: 'Kullanıcı iptal etmezse aboneliği otomatik olarak bir sene daha uzatılacaktır.'
      }
    ];

    const result = validateFindingsQuotes(findings, SAMPLE_SOURCE);

    expect(result.verifiedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.rejectedFindings[0].rejectionReason).toBe('QUOTE_NOT_FOUND_IN_SOURCE');
  });

  it('Case 4: Kaynaktan yalnızca bir bölüm içeren geçerli kısa alıntı doğru yönetiliyor', () => {
    const findings: ValidatedFinding[] = [
      {
        ...baseFinding,
        id: 'f-snippet',
        category: 'content_licensing_ip',
        quote: 'süresiz, geri alınamaz, dünya çapında ve telifsiz bir kullanım lisansı'
      }
    ];

    const result = validateFindingsQuotes(findings, SAMPLE_SOURCE);

    expect(result.verifiedCount).toBe(1);
    expect(result.rejectedCount).toBe(0);
    expect(result.verifiedFindings[0].quote).toBe('süresiz, geri alınamaz, dünya çapında ve telifsiz bir kullanım lisansı');
  });

  it('Case 5: Boş veya yalnızca boşluklardan oluşan alıntı reddediliyor', () => {
    const findings: ValidatedFinding[] = [
      {
        ...baseFinding,
        id: 'f-empty',
        quote: '    '
      }
    ];

    const result = validateFindingsQuotes(findings, SAMPLE_SOURCE);

    expect(result.verifiedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.rejectedFindings[0].rejectionReason).toBe('EMPTY_QUOTE');
  });

  it('Case 6: LLM geçersiz JSON döndürdüğünde güvenli hata oluşuyor', () => {
    const malformedJson = '{"schemaVersion": "1.0", "findings": [ { "id": "1", unclosed json';
    const result = parseAndValidateLLMJson(malformedJson);

    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON ayrıştırma hatası');
    expect(result.data).toBeUndefined();
  });

  it('Case 7: Geçersiz tek bir kayıt, diğer geçerli kayıtların güvenli biçimde değerlendirilmesini engellemiyor', () => {
    const findings: ValidatedFinding[] = [
      {
        ...baseFinding,
        id: 'valid-1',
        quote: 'Şirketimiz, işbu sözleşme koşullarını önceden haber vermeksizin dilediği zaman tek taraflı olarak değiştirme hakkını saklı tutar.'
      },
      {
        ...baseFinding,
        id: 'invalid-hallucinated',
        quote: 'Tamamen uydurma bir sözleşme cümlesi.'
      },
      {
        ...baseFinding,
        id: 'valid-2',
        category: 'liability_limitation',
        quote: 'doğrudan veya dolaylı zararlardan hiçbir şekilde sorumlu tutulamaz'
      }
    ];

    const result = validateFindingsQuotes(findings, SAMPLE_SOURCE);

    expect(result.totalChecked).toBe(3);
    expect(result.verifiedCount).toBe(2);
    expect(result.rejectedCount).toBe(1);
    expect(result.verifiedFindings.map((f) => f.id)).toEqual(['valid-1', 'valid-2']);
    expect(result.rejectedFindings.map((f) => f.id)).toEqual(['invalid-hallucinated']);
  });
});
