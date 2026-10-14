import { describe, it, expect } from 'vitest';
import { detectDocumentType } from './detector';

describe('detectDocumentType', () => {
  it('should detect Turkish terms of service with high confidence when URL, heading, and body match', () => {
    const result = detectDocumentType({
      url: 'https://ornek.com/kullanim-kosullari',
      title: 'Kullanım Koşulları - Örnek Servis',
      headings: ['1. Genel Hükümler', '2. Tarafların Hak ve Yükümlülükleri'],
      sampleText: 'İşbu sözleşme, tarafların hak ve yükümlülüklerini ve fikri mülkiyet haklarını düzenler. Sorumluluğun sınırlandırılması hükümleri aşağıdadır.'
    });

    expect(result.isLikelyContract).toBe(true);
    expect(result.detectedType).toBe('terms_of_service');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should detect privacy policy with KVKK / Aydınlatma metni keywords', () => {
    const result = detectDocumentType({
      url: 'https://ornek.com/gizlilik-politikasi',
      title: 'Gizlilik ve Kişisel Verilerin Korunması',
      headings: ['KVKK Aydınlatma Metni', 'Çerez Politikası'],
      sampleText: 'Veri sorumlusu sıfatıyla kişisel verileriniz 6698 sayılı kanun kapsamında üçüncü taraflarla paylaşım kurallarına uygun olarak işlenmektedir.'
    });

    expect(result.isLikelyContract).toBe(true);
    expect(result.detectedType).toBe('privacy_policy');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should detect subscription / billing terms', () => {
    const result = detectDocumentType({
      url: 'https://ornek.com/abonelik-sozlesmesi',
      title: 'Abonelik Şartları',
      headings: ['Ödeme ve İade Koşulları'],
      sampleText: 'Hizmet paketleri otomatik yenileme esasına dayalıdır. Cayma hakkı ve iptal ve iade süreçleri 14 gün ile sınırlıdır.'
    });

    expect(result.isLikelyContract).toBe(true);
    expect(result.detectedType).toBe('subscription_terms');
  });

  it('should NOT decide solely because URL contains "terms" if page content has no contract text', () => {
    const result = detectDocumentType({
      url: 'https://ornek.com/search?q=search-terms-for-shoes',
      title: 'Ayakkabı Arama Sonuçları',
      headings: ['Popüler Ürünler', 'En Çok Satanlar'],
      sampleText: 'Kırmızı spor ayakkabı, beyaz koşu ayakkabısı, indirimli fiyatlar ve ücretsiz kargo fırsatı.'
    });

    expect(result.isLikelyContract).toBe(false);
    expect(result.detectedType).toBe('unknown');
    expect(result.confidence).toBeLessThan(0.45);
  });

  it('should return low confidence for extremely short pages', () => {
    const result = detectDocumentType({
      url: 'https://ornek.com/terms',
      title: 'Terms',
      headings: [],
      sampleText: 'Kısa metin.'
    });

    expect(result.isLikelyContract).toBe(false);
    expect(result.confidence).toBeLessThanOrEqual(0.3);
  });
});
