import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './entrypoints/popup/App';
import { ExtractedDocument } from './shared/types/contract';

const HAPPY_PATH_TEXT = `Spotify Ücretli Abonelik Hizmeti, siz iptal edene kadar her fatura döneminde otomatik olarak yenilenir. Ücretler önceden haber verilmeksizin veya tarafınıza makul bir süre önce e-posta yoluyla bildirilecek şekilde Spotify tarafından tek taraflı olarak değiştirilebilir. Dijital içeriğin teslimine onay vermeniz durumunda yasal 14 günlük cayma hakkınızdan feragat etmiş sayılırsınız. Spotify, hizmeti herhangi bir zamanda, herhangi bir nedenle ve önceden bildirimde bulunmaksızın derhal askıya alma veya sonlandırma hakkını saklı tutar.`;

const UNCERTAINTY_TEXT = `Sitemizde ayakkabı ve giyim modelleri satılmaktadır. Bize ulaşmak için e-posta gönderiniz. Kargo ücreti alıcıya aittir.`;

const happyPathDoc: ExtractedDocument = {
  id: 'doc-spotify-happy',
  sourceUrl: 'https://www.spotify.com/tr/legal/end-user-agreement/',
  domain: 'www.spotify.com',
  pageTitle: 'Spotify Kullanıcı Sözleşmesi ve Abonelik Şartları',
  detectedType: 'subscription_terms',
  detectionConfidence: 0.92,
  detectionReasons: ['URL kalıbı eşleşti', 'Sayfa başlığı sözleşme terimleri içeriyor', 'Hukuki kavramlar bulundu'],
  rawText: HAPPY_PATH_TEXT,
  normalizedText: HAPPY_PATH_TEXT,
  contentHash: '8f4a13e2d67c91b0920485a3bc765e91a0129bc4f7832ef137d5c31046bb21e9',
  capturedAt: new Date().toISOString(),
  coverage: 'full',
  coveragePercentage: 100,
  totalLength: HAPPY_PATH_TEXT.length,
  analyzedLength: HAPPY_PATH_TEXT.length,
  isTruncated: false
};

const uncertaintyDoc: ExtractedDocument = {
  id: 'doc-uncertain',
  sourceUrl: 'https://ornek-magaza.com/hakkimizda',
  domain: 'ornek-magaza.com',
  pageTitle: 'Hakkımızda ve Alışveriş Rehberi',
  detectedType: 'unknown',
  detectionConfidence: 0.25,
  detectionReasons: ['Sayfa metni bir sözleşme analizi için çok kısa veya belirgin hukuki kalıp içermiyor'],
  rawText: UNCERTAINTY_TEXT,
  normalizedText: UNCERTAINTY_TEXT,
  contentHash: '1a2b3c4d5e6f',
  capturedAt: new Date().toISOString(),
  coverage: 'partial',
  coveragePercentage: 35,
  totalLength: UNCERTAINTY_TEXT.length,
  analyzedLength: UNCERTAINTY_TEXT.length,
  isTruncated: true,
  truncationReason: 'Sayfa içeriği eksik veya sözleşme niteliğinde değil; analize yalnızca mevcut kısa metin dahil edildi.'
};

const happyPathLlmOutput = JSON.stringify({
  schemaVersion: '1.0',
  overall: {
    suggestedScore: 65,
    summaryTr: 'Otomatik yenileme, tek taraflı fiyat artışı ve sebepsiz fesih riskleri tespit edildi.',
    uncertaintyTr: 'Bu puan doğrulanmış 3 maddeye dayalı deterministik bir değerlendirmedir.'
  },
  findings: [
    {
      id: 'f-1',
      category: 'auto_renewal_cancellation',
      severity: 'high',
      titleTr: 'Otomatik Abonelik Yenilemesi',
      quote: 'Spotify Ücretli Abonelik Hizmeti, siz iptal edene kadar her fatura döneminde otomatik olarak yenilenir.',
      explanationTr: 'Aboneliğinizi bizzat iptal etmediğiniz sürece kartınızdan düzenli ödeme çekilmeye devam eder.',
      impactTr: 'Hizmeti kullanmasanız dahi haberiniz olmadan ücret kesilebilir.',
      recommendationTr: 'Fatura yenilenme tarihini takviminize kaydedin.',
      confidence: 0.95
    },
    {
      id: 'f-2',
      category: 'fee_changes_extra_costs',
      severity: 'high',
      titleTr: 'Tek Taraflı Fiyat Artışı Yetkisi',
      quote: 'Ücretler önceden haber verilmeksizin veya tarafınıza makul bir süre önce e-posta yoluyla bildirilecek şekilde Spotify tarafından tek taraflı olarak değiştirilebilir.',
      explanationTr: 'Platform, abonelik ücretini kendi kararıyla artırabilir.',
      impactTr: 'Abonelik maliyetiniz önceden planlananın üzerine çıkabilir.',
      recommendationTr: 'E-posta bildirimlerini ve banka hesap hareketlerini takip edin.',
      confidence: 0.92
    },
    {
      id: 'f-3',
      category: 'account_suspension_termination',
      severity: 'high',
      titleTr: 'Sebepsiz ve Bildirimsiz Hesap Kapatma',
      quote: 'Spotify, hizmeti herhangi bir zamanda, herhangi bir nedenle ve önceden bildirimde bulunmaksızın derhal askıya alma veya sonlandırma hakkını saklı tutar.',
      explanationTr: 'Şirket gerekçe belirtmeden üyeliğinizi sonlandırabilir.',
      impactTr: 'Oluşturduğunuz listelere ve içeriklere erişiminizi anında kaybedebilirsiniz.',
      recommendationTr: 'Önemli verilerinizi yedekli tutun.',
      confidence: 0.94
    }
  ]
});

const uncertaintyLlmOutput = JSON.stringify({
  schemaVersion: '1.0',
  overall: {
    suggestedScore: 10,
    summaryTr: 'Metin yetersiz olduğundan kesin bir hukuki risk saptanamamıştır.',
    uncertaintyTr: 'DİKKAT: Sayfa sözleşme niteliğinde değildir ve metin eksiktir. Kesin sonuç üretilememiştir.'
  },
  findings: []
});

// Setup Initial Scenario
function setScenario(type: 'happy' | 'uncertainty') {
  const viewer = document.getElementById('simulated-webpage');
  const btnHappy = document.getElementById('scenario-happy-path');
  const btnUncertain = document.getElementById('scenario-uncertainty');

  if (type === 'happy') {
    (window as any).__SHART_MERCEK_TEST_DOC__ = happyPathDoc;
    (window as any).__SHART_MERCEK_MOCK_LLM_OUTPUT__ = () => happyPathLlmOutput;
    btnHappy?.classList.add('active');
    btnUncertain?.classList.remove('active');

    if (viewer) {
      viewer.innerHTML = `
        <h3>📄 Spotify — Resmî Kullanıcı Sözleşmesi Kesiti</h3>
        <p style="margin-bottom: 8px;"><strong>Kaynak URL:</strong> ${happyPathDoc.sourceUrl}</p>
        <p style="color: #cbd5e1; font-style: italic; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
          "${HAPPY_PATH_TEXT}"
        </p>
      `;
    }
  } else {
    (window as any).__SHART_MERCEK_TEST_DOC__ = uncertaintyDoc;
    (window as any).__SHART_MERCEK_MOCK_LLM_OUTPUT__ = () => uncertaintyLlmOutput;
    btnUncertain?.classList.add('active');
    btnHappy?.classList.remove('active');

    if (viewer) {
      viewer.innerHTML = `
        <h3>⚠️ Belirsiz / Eksik Sayfa Örneği</h3>
        <p style="margin-bottom: 8px;"><strong>Kaynak URL:</strong> ${uncertaintyDoc.sourceUrl}</p>
        <p style="color: #cbd5e1; font-style: italic; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
          "${UNCERTAINTY_TEXT}"
        </p>
      `;
    }
  }

  // Mount/Remount App
  const rootEl = document.getElementById('popup-root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(<App key={type} />);
  }
}

document.getElementById('scenario-happy-path')?.addEventListener('click', () => setScenario('happy'));
document.getElementById('scenario-uncertainty')?.addEventListener('click', () => setScenario('uncertainty'));

// Initialize with Happy Path
setScenario('happy');
