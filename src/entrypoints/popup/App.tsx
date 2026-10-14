import React, { useState, useEffect } from 'react';
import { ExtractedDocument } from '../../shared/types/contract';
import { AnalysisReport } from '../../shared/types/analysis';
import { UserSettings, DEFAULT_SETTINGS } from '../../shared/types/settings';
import { RISK_CATEGORIES, SEVERITY_LEVELS } from '../../shared/constants/categories';

export default function App() {
  const [tab, setTab] = useState<'analyze' | 'settings'>('analyze');
  const [documentData, setDocumentData] = useState<ExtractedDocument | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load settings and extract active tab document
  useEffect(() => {
    loadSettings();
    extractActivePage();
  }, []);

  const loadSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
        if (res && res.success && res.data) {
          setSettings(res.data);
          if (res.data.externalConsentAcknowledged) {
            setConsentGiven(true);
          }
        }
      });
    }
  };

  const extractActivePage = () => {
    setLoadingDoc(true);
    setError(null);

    // If running in browser extension context
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) {
          setLoadingDoc(false);
          return;
        }

        chrome.tabs.sendMessage(
          activeTab.id,
          { action: 'EXTRACT_DOCUMENT' },
          (response) => {
            setLoadingDoc(false);
            if (chrome.runtime.lastError) {
              // Could be a restricted chrome:// page or not injected yet
              return;
            }
            if (response && response.success && response.data) {
              setDocumentData(response.data);
            }
          }
        );
      });
    } else if (typeof window !== 'undefined' && (window as any).__SHART_MERCEK_TEST_DOC__) {
      setDocumentData((window as any).__SHART_MERCEK_TEST_DOC__);
      setLoadingDoc(false);
    } else {
      // Standalone preview fallback: default sample document
      setLoadingDoc(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!documentData) {
      setError('Analiz edilecek bir sözleşme metni bulunamadı. Lütfen bir sözleşme sayfası açın.');
      return;
    }

    if (!consentGiven) {
      setError('Lütfen sözleşme metninin seçtiğiniz API sağlayıcısına gönderilmesine izin vermek için onay kutusunu işaretleyin.');
      return;
    }

    if (settings.provider !== 'mock' && !settings.apiKey && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      setError('API anahtarı bulunamadı. Lütfen "Ayarlar" sekmesinden OpenAI uyumlu bir API anahtarı ekleyin.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setReport(null);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          action: 'START_ANALYSIS',
          document: documentData
        },
        (res) => {
          setAnalyzing(false);
          if (res && res.success && res.data) {
            setReport(res.data);
          } else {
            setError(res?.error || 'Analiz sırasında bilinmeyen bir hata oluştu.');
          }
        }
      );
    } else {
      // Standalone / Cypress test environment: run REAL pipeline using MockLLMProvider and report-generator
      try {
        const { MockLLMProvider } = await import('../../core/llm/mock-provider');
        const { generateAnalysisReport } = await import('../../core/reporting/report-generator');

        const customOutputGen = (window as any).__SHART_MERCEK_MOCK_LLM_OUTPUT__;
        const provider = new MockLLMProvider(customOutputGen);

        const llmResponse = await provider.analyze({
          document: documentData,
          settings: { ...settings, provider: 'mock' }
        });

        const generatedReport = generateAnalysisReport(documentData, llmResponse);
        setReport(generatedReport);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Analiz sırasında hata oluştu.');
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleSaveSettings = () => {
    const updatedSettings = {
      ...settings,
      externalConsentAcknowledged: consentGiven
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          action: 'SAVE_SETTINGS',
          settings: updatedSettings
        },
        (res) => {
          if (res && res.success) {
            setSaveMessage('Ayarlar başarıyla kaydedildi.');
            setTimeout(() => setSaveMessage(null), 3000);
          }
        }
      );
    }
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          action: 'TEST_CONNECTION',
          settings
        },
        (res) => {
          setTestingConnection(false);
          if (res && res.success) {
            setTestResult({ success: true, message: res.data?.messageTr || 'Bağlantı başarılı!' });
          } else {
            setTestResult({
              success: false,
              message: res?.error || 'Bağlantı başarısız oldu. API anahtarını ve Base URL adresini kontrol edin.'
            });
          }
        }
      );
    } else {
      setTimeout(() => {
        setTestingConnection(false);
        setTestResult({ success: true, message: 'Önizleme ortamında bağlantı simüle edildi.' });
      }, 500);
    }
  };

  const handleClearApiKey = () => {
    setSettings((prev) => ({ ...prev, apiKey: '' }));
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'CLEAR_API_KEY' }, () => {
        setSaveMessage('API anahtarı cihazınızdan silindi.');
        setTimeout(() => setSaveMessage(null), 3000);
      });
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score > 75) return 'score-critical';
    if (score > 50) return 'score-high';
    if (score > 20) return 'score-moderate';
    return 'score-low';
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <span className="badge badge-critical" id="risk-level-badge">🚨 Kritik Risk</span>;
      case 'high':
        return <span className="badge badge-high" id="risk-level-badge">⚠️ Yüksek Risk</span>;
      case 'moderate':
        return <span className="badge badge-medium" id="risk-level-badge">⚡ Orta Risk</span>;
      default:
        return <span className="badge badge-low" id="risk-level-badge">✅ Düşük Risk</span>;
    }
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="logo-section">
          <div className="logo-icon">🔍</div>
          <div>
            <h1 className="logo-title">ŞartMercek</h1>
            <p className="logo-subtitle">Türkçe Sözleşme Risk Analizcisi</p>
          </div>
        </div>
        <div className="tabs-nav">
          <button
            id="btn-analyze-tab"
            className={`tab-btn ${tab === 'analyze' ? 'active' : ''}`}
            onClick={() => setTab('analyze')}
          >
            Analiz
          </button>
          <button
            id="btn-settings-tab"
            className={`tab-btn ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            Ayarlar
          </button>
        </div>
      </header>

      {/* Main Tab View */}
      {tab === 'analyze' && (
        <main className="tab-content">
          {/* Active Document Status Card */}
          <section className="card doc-status-card">
            <div className="card-header-flex">
              <span className="domain-pill" title="Kaynak Alan Adı">
                🌐 {documentData?.domain || 'Sayfa algılanıyor...'}
              </span>
              {documentData && (
                <span className={`coverage-pill ${documentData.coverage === 'full' ? 'pill-full' : 'pill-partial'}`}>
                  {documentData.coverage === 'full' ? 'Tam Metin' : `%${documentData.coveragePercentage} Kısmi`}
                </span>
              )}
            </div>

            {loadingDoc ? (
              <div className="loading-spinner">Sayfa sözleşme içeriği taranıyor...</div>
            ) : documentData ? (
              <div className="doc-details">
                <div className="doc-title" title={documentData.pageTitle}>
                  {documentData.pageTitle || 'İsimsiz Sayfa'}
                </div>
                <div className="doc-meta-row">
                  <span className="type-badge">
                    📄 {documentData.detectedType.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="char-count">
                    {documentData.totalLength.toLocaleString('tr-TR')} karakter
                  </span>
                </div>

                {/* Low confidence warning */}
                {documentData.detectionConfidence < 0.45 && (
                  <div className="alert alert-warning" id="low-confidence-warning">
                    ⚠️ <strong>Dikkat:</strong> Bu sayfanın bir sözleşme sayfası olduğundan emin değiliz (Güven: %
                    {Math.round(documentData.detectionConfidence * 100)}). Yine de analiz edebilirsiniz.
                  </div>
                )}

                {/* Truncation warning if page is too long */}
                {documentData.isTruncated && (
                  <div className="alert alert-info">
                    ℹ️ {documentData.truncationReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>Aktif sekmede sözleşme metni tespit edilemedi.</p>
                <button className="btn-secondary btn-sm" onClick={extractActivePage}>
                  Sayfayı Yeniden Tara
                </button>
              </div>
            )}

            {/* API Missing warning */}
            {settings.provider !== 'mock' && !settings.apiKey && (
              <div className="alert alert-error" id="api-missing-alert">
                <span>🔑 <strong>API Anahtarı Eksik:</strong> Analiz yapabilmek için lütfen geçerli bir anahtar girin.</span>
                <button className="btn-link" onClick={() => setTab('settings')}>
                  Ayarlara Git →
                </button>
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="consent-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="checkbox-consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <span>
                  Sözleşme metninin analiz amacıyla seçilen LLM sağlayıcısına (
                  <strong>{settings.provider === 'mock' ? 'Mock Test' : settings.model}</strong>)
                  gönderilmesini onaylıyorum.
                </span>
              </label>
            </div>

            {/* Action Button */}
            <button
              id="btn-analyze"
              className="btn-primary btn-block"
              disabled={analyzing || loadingDoc || !documentData}
              onClick={handleStartAnalysis}
            >
              {analyzing ? (
                <span className="spinner-text">⏳ Kanıta Dayalı Analiz Yapılıyor...</span>
              ) : (
                '🔍 Metni Analiz Et'
              )}
            </button>
          </section>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error" id="error-banner">
              ⚠️ {error}
            </div>
          )}

          {/* Report View */}
          {report && (
            <section className="report-container" id="report-section">
              {/* Security Prompt Injection Banner */}
              {report.security.promptInjectionDetected && (
                <div className="alert alert-security" id="security-alert-box">
                  <div className="security-title">🛡️ GÜVENLİK UYARISI: Prompt Injection Tespit Edildi</div>
                  <p>{report.security.noteTr}</p>
                </div>
              )}

              {/* Score & Summary Card */}
              <div className="card score-card">
                <div className="score-header">
                  <div>
                    <span className="score-label">Deterministik Risk Skoru</span>
                    <div className="score-value-row">
                      <span className={`score-number ${getScoreColorClass(report.overall.score)}`} id="risk-score-display">
                        {report.overall.score}
                      </span>
                      <span className="score-max">/ 100</span>
                    </div>
                  </div>
                  <div className="score-badge-col">
                    {getLevelBadge(report.overall.level)}
                    <span className="model-tag">Model: {report.metadata.model}</span>
                  </div>
                </div>

                <div className="score-summary">
                  <strong>Özet:</strong> {report.overall.summaryTr}
                </div>

                <div className="score-uncertainty" id="uncertainty-box">
                  <strong>Kapsam & Belirsizlik:</strong> {report.overall.uncertaintyTr}
                </div>
              </div>

              {/* Findings Section */}
              <div className="findings-section" id="findings-list">
                <div className="section-title-row">
                  <h3 className="section-title">
                    Doğrulanmış Riskli Maddeler ({report.findings.length})
                  </h3>
                  {report.rejectedFindings.length > 0 && (
                    <span className="rejected-badge" title="Kaynak metinde birebir bulunamayan iddialar elendi">
                      ❌ {report.rejectedFindings.length} geçersiz/uydurma alıntı elendi
                    </span>
                  )}
                </div>

                {report.findings.length === 0 ? (
                  <div className="empty-findings">
                    ✅ Kaynak metinden doğrulanmış yüksek riskli bir madde bulunamadı.
                  </div>
                ) : (
                  report.findings.map((f, idx) => {
                    const categoryInfo = RISK_CATEGORIES[f.category];
                    const severityInfo = SEVERITY_LEVELS[f.severity];
                    return (
                      <article key={f.id || idx} className="finding-card">
                        <div className="finding-header">
                          <span className={`badge ${severityInfo?.badgeClass || 'badge-medium'}`}>
                            {severityInfo?.labelTr || f.severity}
                          </span>
                          <span className="category-title">
                            {categoryInfo?.titleTr || f.category}
                          </span>
                        </div>

                        <h4 className="finding-title">{f.titleTr}</h4>

                        {/* Verified Quote */}
                        <div className="quote-box">
                          <div className="quote-header">
                            <span className="verified-check">✓ Kaynak Metinden Doğrulanmış Alıntı</span>
                          </div>
                          <blockquote className="verbatim-quote">
                            "{f.quote}"
                          </blockquote>
                        </div>

                        {/* Plain Turkish Explanation */}
                        <div className="finding-detail-item">
                          <span className="detail-label">💡 Günlük Türkçeyle Anlamı:</span>
                          <p className="detail-text">{f.explanationTr}</p>
                        </div>

                        {/* User Impact */}
                        <div className="finding-detail-item">
                          <span className="detail-label">⚠️ Kullanıcı Açısından Olası Etki:</span>
                          <p className="detail-text">{f.impactTr}</p>
                        </div>

                        {/* Recommendation */}
                        <div className="finding-detail-item">
                          <span className="detail-label">🔍 Dikkat Edilmesi Gereken Husus:</span>
                          <p className="detail-text">{f.recommendationTr}</p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </main>
      )}

      {/* Settings Tab View */}
      {tab === 'settings' && (
        <main className="tab-content settings-content">
          <div className="card">
            <h2 className="card-title">LLM API Yapılandırması</h2>
            <p className="settings-desc">
              Analizler doğrudan sizin belirlediğiniz OpenAI uyumlu sağlayıcı üzerinden yürütülür.
              API anahtarınız yalnızca cihazınızda güvenli yerel depolama alanında saklanır.
            </p>

            {saveMessage && <div className="alert alert-success">{saveMessage}</div>}

            <div className="form-group">
              <label htmlFor="select-provider">Sağlayıcı Türü</label>
              <select
                id="select-provider"
                className="form-control"
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
              >
                <option value="openai">OpenAI (Resmî)</option>
                <option value="custom">Özel OpenAI-Uyumlu (Groq, OpenRouter, vLLM, vb.)</option>
                <option value="mock">Mock Provider (Sadece Test)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="input-base-url">API Base URL</label>
              <input
                id="input-base-url"
                type="text"
                className="form-control"
                value={settings.baseUrl}
                placeholder="https://api.openai.com/v1"
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-model">Model Adı</label>
              <input
                id="input-model"
                type="text"
                className="form-control"
                value={settings.model}
                placeholder="gpt-4o-mini"
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-api-key">API Anahtarı</label>
              <div className="input-group">
                <input
                  id="input-api-key"
                  type={showKey ? 'text' : 'password'}
                  className="form-control"
                  value={settings.apiKey}
                  placeholder="sk-..."
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                />
                <button
                  type="button"
                  className="btn-secondary btn-icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Gizle' : 'Göster'}
                </button>
              </div>
              <small className="help-text">
                Anahtarınız asla sunucuya, Git'e veya içerik komut dosyalarına gönderilmez.
              </small>
            </div>

            <div className="btn-row">
              <button
                id="btn-test-connection"
                className="btn-secondary"
                disabled={testingConnection}
                onClick={handleTestConnection}
              >
                {testingConnection ? 'Test Ediliyor...' : '🔌 Bağlantıyı Test Et'}
              </button>
              <button
                id="btn-save-settings"
                className="btn-primary"
                onClick={handleSaveSettings}
              >
                💾 Ayarları Kaydet
              </button>
            </div>

            {testResult && (
              <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
                {testResult.success ? '✅ ' : '❌ '} {testResult.message}
              </div>
            )}

            {settings.apiKey && (
              <div className="danger-zone">
                <button
                  id="btn-clear-key"
                  className="btn-danger btn-sm"
                  onClick={handleClearApiKey}
                >
                  🗑️ API Anahtarını Cihazdan Sil
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Mandatory Fixed Legal Disclaimer at Bottom */}
      <footer className="popup-footer" id="legal-disclaimer">
        <p className="disclaimer-text">
          ⚖️ <strong>Hukuki Tavsiye Değildir:</strong> Bu araç hukuki tavsiye vermez. Analiz otomatik olarak
          hazırlanır, hata veya eksik içerebilir. Önemli kararlar için sözleşmenin tamamını inceleyin ve gerektiğinde
          bir hukuk uzmanına danışın.
        </p>
      </footer>
    </div>
  );
}
