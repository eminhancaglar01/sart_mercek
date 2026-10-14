import React, { useState, useEffect } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '../../shared/types/settings';

export default function Options() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
        if (res && res.success && res.data) {
          setSettings(res.data);
        }
      });
    }
  }, []);

  const handleSave = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'SAVE_SETTINGS', settings }, (res) => {
        if (res && res.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      });
    }
  };

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'TEST_CONNECTION', settings }, (res) => {
        setTesting(false);
        if (res && res.success) {
          setTestResult({ success: true, message: res.data?.messageTr || 'Bağlantı başarılı!' });
        } else {
          setTestResult({
            success: false,
            message: res?.error || 'Bağlantı başarısız. Bilgileri kontrol edin.'
          });
        }
      });
    } else {
      setTimeout(() => {
        setTesting(false);
        setTestResult({ success: true, message: 'Önizleme ortamı: Test başarılı.' });
      }, 500);
    }
  };

  const handleClear = () => {
    setSettings((prev) => ({ ...prev, apiKey: '' }));
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'CLEAR_API_KEY' }, () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      });
    }
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <div className="header-icon">🔍</div>
        <div>
          <h1>ŞartMercek — Yapılandırma ve Güvenlik Ayarları</h1>
          <p className="subtitle">Kendi LLM API anahtarınızı yapılandırın ve bağlantıyı doğrulayın</p>
        </div>
      </header>

      <main className="options-body">
        {saveSuccess && (
          <div className="alert alert-success">
            ✅ Ayarlar başarıyla yerel depolama alanına kaydedildi.
          </div>
        )}

        {testResult && (
          <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
            {testResult.success ? '✅ ' : '❌ '} {testResult.message}
          </div>
        )}

        <div className="options-card">
          <h2>1. API Sağlayıcı Ayarları</h2>
          <p className="field-desc">
            OpenAI veya OpenAI API biçimini destekleyen herhangi bir yerel ya da bulut sağlayıcı (Groq, OpenRouter,
            Ollama, vLLM) kullanabilirsiniz.
          </p>

          <div className="form-group">
            <label htmlFor="opt-provider">Sağlayıcı Türü</label>
            <select
              id="opt-provider"
              className="form-control"
              value={settings.provider}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
            >
              <option value="openai">OpenAI (Resmî API)</option>
              <option value="custom">Özel OpenAI-Uyumlu Gateway</option>
              <option value="mock">Mock LLM Sağlayıcısı (Sadece Test / Geliştirme)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="opt-base-url">API Base URL</label>
            <input
              id="opt-base-url"
              type="text"
              className="form-control"
              value={settings.baseUrl}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
            />
            <small className="help-text">Örnek: https://api.openai.com/v1 veya http://localhost:11434/v1</small>
          </div>

          <div className="form-group">
            <label htmlFor="opt-model">Model Adı</label>
            <input
              id="opt-model"
              type="text"
              className="form-control"
              value={settings.model}
              placeholder="gpt-4o-mini"
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            />
            <small className="help-text">Önerilen: gpt-4o-mini, gpt-4o, llama-3.1-70b, deepseek-chat</small>
          </div>

          <div className="form-group">
            <label htmlFor="opt-api-key">API Anahtarı</label>
            <div className="input-with-button">
              <input
                id="opt-api-key"
                type={showKey ? 'text' : 'password'}
                className="form-control"
                value={settings.apiKey}
                placeholder="sk-..."
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Gizle' : 'Göster'}
              </button>
            </div>
          </div>

          <div className="actions-row">
            <button
              id="opt-test-btn"
              className="btn-secondary"
              disabled={testing}
              onClick={handleTest}
            >
              {testing ? 'Bağlantı Test Ediliyor...' : '🔌 Bağlantıyı Test Et'}
            </button>
            <button
              id="opt-save-btn"
              className="btn-primary"
              onClick={handleSave}
            >
              💾 Ayarları Kaydet
            </button>
          </div>

          {settings.apiKey && (
            <div className="delete-key-section">
              <button
                id="opt-clear-btn"
                className="btn-danger"
                onClick={handleClear}
              >
                🗑️ API Anahtarını Cihazdan Tamamen Sil
              </button>
            </div>
          )}
        </div>

        <div className="options-card info-card">
          <h2>2. Güvenlik ve Gizlilik Mimarisi</h2>
          <ul className="info-list">
            <li>
              🔒 <strong>Cihazda Güvenli Saklama:</strong> API anahtarınız asla harici bir sunucuya iletilmez,
              yalnızca tarayıcınızın yerel <code>chrome.storage.local</code> depolama alanında tutulur.
            </li>
            <li>
              🛡️ <strong>İzole Arka Plan Çağrıları:</strong> Tüm LLM API istekleri, web sayfalarının ve içerik
              komut dosyalarının erişemeyeceği güvenilir Arka Plan Servis Çalışanı (Service Worker) katmanından yapılır.
            </li>
            <li>
              🛑 <strong>Asgari İzin Prensibi:</strong> Uzantı gereksiz hiçbir host izni talep etmez; yalnızca aktif
              sekmedeki sözleşme metnini kullanıcı "Metni Analiz Et" butonuna tıkladığında inceler.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
