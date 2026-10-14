describe('ŞartMercek — Kapsamlı Demo ve E2E Video Kaydı', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('1. Mutlu Yol (Happy Path): Sayfa Tanıma, Ayarlar İnceleme, Analiz ve Doğrulanmış Kanıt Raporu', () => {
    // 1. Tanıtım ve Başlık Kontrolü
    cy.contains('.logo-title', 'ŞartMercek').should('be.visible');
    cy.contains('.logo-subtitle', 'Türkçe Sözleşme Risk Analizcisi').should('be.visible');
    cy.contains('.domain-pill', 'www.spotify.com').should('be.visible');
    cy.contains('.coverage-pill', 'Tam Metin').should('be.visible');
    cy.contains('.type-badge', 'SUBSCRIPTION TERMS').should('be.visible');
    cy.wait(3000); // İzleyicinin başlığı ve algılanan sayfa kartını görmesi için bekleme

    // 2. Ayarlar Sekmesini Açma ve Bağlantıyı Test Etme
    cy.get('#btn-settings-tab').click();
    cy.contains('.card-title', 'LLM API Yapılandırması').should('be.visible');
    cy.get('#select-provider').should('be.visible');
    cy.get('#input-model').should('have.value', 'gpt-4o-mini');
    cy.wait(2500);

    // Test bağlantısını tetikle ve sonucu bekle
    cy.get('#btn-test-connection').click();
    cy.contains('.alert-success', 'başarılı', { timeout: 8000 }).should('be.visible');
    cy.wait(3000);

    // Tekrar Analiz Sekmesine Dönüş
    cy.get('#btn-analyze-tab').click();
    cy.wait(2000);

    // 3. Hukuki Sorumluluk Reddi (Sabit Disclaimer) Kontrolü
    cy.get('#legal-disclaimer')
      .should('be.visible')
      .and('contain.text', 'Bu araç hukuki tavsiye vermez');
    cy.wait(2000);

    // 4. Kullanıcı Açık Onayı (Consent)
    cy.get('#checkbox-consent').should('not.be.checked');
    cy.wait(1500);
    cy.get('#checkbox-consent').check().should('be.checked');
    cy.wait(2000);

    // 5. Analizi Başlatma
    cy.get('#btn-analyze').should('be.enabled').click();

    // 6. Raporun Oluşması ve Skor Kartının İncelenmesi
    cy.get('#report-section', { timeout: 10000 }).should('be.visible');
    cy.get('#risk-score-display').should('contain.text', '45');
    cy.get('#risk-level-badge').should('contain.text', 'Orta Risk');
    cy.get('#uncertainty-box').should('be.visible');
    cy.wait(3500); // Skor ve özetin net incelenmesi

    // 7. Doğrulanmış Riskli Maddelerin İncelenmesi (Scroll & Hover)
    cy.get('#findings-list .finding-card').should('have.length', 3);

    // Madde 1: Otomatik Yenileme
    cy.contains('.finding-title', 'Otomatik Abonelik Yenilemesi')
      .scrollIntoView()
      .should('be.visible');
    cy.contains('.verbatim-quote', 'Spotify Ücretli Abonelik Hizmeti, siz iptal edene kadar').should('be.visible');
    cy.contains('.verified-check', 'Kaynak Metinden Doğrulanmış Alıntı').should('be.visible');
    cy.wait(3500);

    // Madde 2: Fiyat Artışı
    cy.contains('.finding-title', 'Tek Taraflı Fiyat Artışı Yetkisi')
      .scrollIntoView()
      .should('be.visible');
    cy.contains('.verbatim-quote', 'Ücretler önceden haber verilmeksizin').should('be.visible');
    cy.wait(3500);

    // Madde 3: Fesih / Hesap Kapatma
    cy.contains('.finding-title', 'Sebepsiz ve Bildirimsiz Hesap Kapatma')
      .scrollIntoView()
      .should('be.visible');
    cy.contains('.verbatim-quote', 'Spotify, hizmeti herhangi bir zamanda, herhangi bir nedenle').should('be.visible');
    cy.wait(4000);
  });

  it('2. Dürüst Belirsizlik Anı (Honest Uncertainty Moment): Düşük Güven, Eksik Metin ve Şeffaf Rapor', () => {
    cy.wait(1500);

    // Senaryo 2'ye geçiş yap
    cy.get('#scenario-uncertainty').click();
    cy.wait(2500);

    // Düşük güven ve kısmi metin uyarısını doğrula
    cy.get('#low-confidence-warning', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Bu sayfanın bir sözleşme sayfası olduğundan emin değiliz');

    cy.contains('.coverage-pill', 'Kısmi').should('be.visible');
    cy.wait(3000);

    // Kullanıcı onayı verip analizi başlat
    cy.get('#checkbox-consent').check().should('be.checked');
    cy.wait(1500);
    cy.get('#btn-analyze').click();

    // Raporun dürüst belirsizliği yansıtması (Uydurma iddia üretilmemesi)
    cy.get('#report-section', { timeout: 10000 }).should('be.visible');
    cy.get('#risk-score-display').should('contain.text', '0');
    cy.get('#risk-level-badge').should('contain.text', 'Düşük Risk');

    cy.get('#uncertainty-box')
      .scrollIntoView()
      .should('be.visible')
      .and('contain.text', 'yalnızca %35\'lik bölümü analiz edilmiştir');

    cy.contains('.empty-findings', 'yüksek riskli bir madde bulunamadı').should('be.visible');
    cy.wait(4000); // Sonucun ekranda okunması için bekleme
  });
});
