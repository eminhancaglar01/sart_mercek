import { DocumentType, DocumentDetectionResult } from '../../shared/types/contract';

interface DetectionInput {
  url: string;
  title: string;
  headings: string[];
  sampleText: string;
}

interface PatternRule {
  type: DocumentType;
  titleTr: string;
  urlKeywords: RegExp[];
  headingKeywords: RegExp[];
  textKeywords: RegExp[];
}

const RULES: PatternRule[] = [
  {
    type: 'terms_of_service',
    titleTr: 'Kullanım Koşulları / Hizmet Şartları',
    urlKeywords: [
      /terms/i,
      /tos\b/i,
      /conditions/i,
      /kullanim-kosullari/i,
      /kullanim-sartlari/i,
      /hizmet-sartlari/i,
      /hizmet-sozlesmesi/i
    ],
    headingKeywords: [
      /kullanım\s+(koşulları|şartları)/i,
      /hizmet\s+(şartları|koşulları|sözleşmesi)/i,
      /terms\s+of\s+(service|use)/i,
      /terms\s+and\s+conditions/i,
      /üye(lik)?\s+sözleşmesi/i
    ],
    textKeywords: [
      /işbu\s+sözleşme/i,
      /kullanım\s+koşulları/i,
      /tarafların\s+hak\s+ve\s+yükümlülükleri/i,
      /fikri\s+mülkiyet/i,
      /sorumluluğun\s+sınırlandırılması/i,
      /uygulanacak\s+hukuk/i,
      /terms\s+of\s+service/i,
      /governing\s+law/i,
      /limitation\s+of\s+liability/i
    ]
  },
  {
    type: 'privacy_policy',
    titleTr: 'Gizlilik Politikası / KVKK Aydınlatma Metni',
    urlKeywords: [
      /privacy/i,
      /gizlilik/i,
      /kvkk/i,
      /aydinlatma-metni/i,
      /data-protection/i,
      /gdpr/i
    ],
    headingKeywords: [
      /gizlilik\s+(politikası|ilkeleri|bildirimi)/i,
      /privacy\s+policy/i,
      /kişisel\s+verilerin\s+korunması/i,
      /kvkk\s+aydınlatma\s+metni/i,
      /çerez\s+(politikası|aydınlatma)/i
    ],
    textKeywords: [
      /kişisel\s+veriler/i,
      /veri\s+sorumlusu/i,
      /6698\s+sayılı/i,
      /çerezler/i,
      /üçüncü\s+taraflarla\s+paylaşım/i,
      /personal\s+data/i,
      /data\s+controller/i,
      /cookie\s+policy/i
    ]
  },
  {
    type: 'subscription_terms',
    titleTr: 'Abonelik ve Ödeme Şartları',
    urlKeywords: [
      /subscription/i,
      /billing/i,
      /abonelik/i,
      /odeme-kosullari/i,
      /pricing-terms/i
    ],
    headingKeywords: [
      /abonelik\s+(şartları|koşulları|sözleşmesi)/i,
      /subscription\s+(terms|agreement)/i,
      /billing\s+terms/i,
      /ödeme\s+ve\s+iade/i
    ],
    textKeywords: [
      /otomatik\s+yenileme/i,
      /cayma\s+hakkı/i,
      /iptal\s+ve\s+iade/i,
      /fatura\s+dönemi/i,
      /recurring\s+payment/i,
      /auto-renewal/i,
      /cancellation\s+policy/i
    ]
  },
  {
    type: 'user_agreement',
    titleTr: 'Kullanıcı Sözleşmesi',
    urlKeywords: [
      /user-agreement/i,
      /kullanici-sozlesmesi/i,
      /uyelik-sozlesmesi/i,
      /agreement/i
    ],
    headingKeywords: [
      /kullanıcı\s+sözleşmesi/i,
      /user\s+agreement/i,
      /son\s+kullanıcı\s+lisans\s+sözleşmesi/i,
      /eula/i
    ],
    textKeywords: [
      /hesap\s+oluşturma/i,
      /kullanıcı\s+hesabı/i,
      /yetkisiz\s+erişim/i,
      /şifre\s+güvenliği/i,
      /account\s+termination/i
    ]
  }
];

export function detectDocumentType(input: DetectionInput): DocumentDetectionResult {
  const { url, title, headings, sampleText } = input;
  const combinedHeadings = [title, ...headings].join(' ');
  const normalizedSample = sampleText.slice(0, 5000);

  let bestType: DocumentType = 'unknown';
  let bestTitleTr = 'Bilinmeyen / Genel Sayfa';
  let bestConfidence = 0.0;
  let bestReasons: string[] = [];

  for (const rule of RULES) {
    let score = 0;
    const reasons: string[] = [];

    // 1. URL keyword match (max 0.25 weight - never decisive alone)
    const urlMatches = rule.urlKeywords.filter((r) => r.test(url));
    if (urlMatches.length > 0) {
      score += 0.25;
      reasons.push(`URL kalıbı eşleşti (${rule.type})`);
    }

    // 2. Headings & Title match (max 0.40 weight - strong indicator)
    const headingMatches = rule.headingKeywords.filter((r) => r.test(combinedHeadings));
    if (headingMatches.length > 0) {
      score += 0.40;
      reasons.push(`Sayfa başlığı veya H1/H2 başlığı sözleşme terimleri içeriyor`);
    }

    // 3. Body text legal language match (max 0.35 weight)
    const textMatches = rule.textKeywords.filter((r) => r.test(normalizedSample));
    if (textMatches.length >= 2) {
      score += 0.35;
      reasons.push(`${textMatches.length} adet hukuki anahtar kavram gövde metninde bulundu`);
    } else if (textMatches.length === 1) {
      score += 0.18;
      reasons.push(`1 adet hukuki anahtar kavram gövde metninde bulundu`);
    }

    if (score > bestConfidence) {
      bestConfidence = score;
      bestType = rule.type;
      bestTitleTr = rule.titleTr;
      bestReasons = reasons;
    }
  }

  // Minimum text length check: if sampleText has less than 60 characters, reduce confidence
  if (normalizedSample.trim().length < 60) {
    bestConfidence = Math.min(bestConfidence, 0.2);
    bestReasons.push('Sayfa metni bir sözleşme analizi için çok kısa veya boş');
  }

  const confidence = Math.min(1.0, Math.round(bestConfidence * 100) / 100);
  const isLikelyContract = confidence >= 0.45;

  if (!isLikelyContract && bestType === 'unknown') {
    bestReasons.push('Sayfa URL’si, başlıkları ve metninde belirgin sözleşme kalıbı bulunamadı');
  }

  return {
    isLikelyContract,
    detectedType: isLikelyContract ? bestType : 'unknown',
    confidence,
    reasons: bestReasons,
    titleTr: isLikelyContract ? bestTitleTr : 'Sözleşme Olmayan veya Belirsiz Sayfa'
  };
}
