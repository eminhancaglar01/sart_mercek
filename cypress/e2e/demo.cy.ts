describe('ŞartMercek — Demo ve E2E Testleri', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('1. Mutlu Yol (Happy Path): Sözleşme Tespiti, Onay, Analiz ve Doğrulanmış Alıntı Raporu', () => {
    // 1. Check Header & Domain Pill
    cy.contains('.logo-title', 'ŞartMercek').should('be.visible');
    cy.contains('.domain-pill', 'www.spotify.com').should('be.visible');
    cy.contains('.coverage-pill', 'Tam Metin').should('be.visible');
    cy.contains('.type-badge', 'SUBSCRIPTION TERMS').should('be.visible');

    // 2. Fixed Legal Disclaimer Check
    cy.get('#legal-disclaimer')
      .should('be.visible')
      .and('contain.text', 'Bu araç hukuki tavsiye vermez');

    // 3. User Consent Interaction
    cy.get('#checkbox-consent').should('not.be.checked');
    cy.get('#checkbox-consent').check().should('be.checked');

    // 4. Trigger Analysis
    cy.get('#btn-analyze').should('be.enabled').click();

    // 5. Verify Report View & Score
    cy.get('#report-section', { timeout: 10000 }).should('be.visible');
    cy.get('#risk-score-display').should('contain.text', '45');
    cy.get('#risk-level-badge').should('contain.text', 'Orta Risk');

    // 6. Verify Findings with Verified Verbatim Quotes
    cy.get('#findings-list .finding-card').should('have.length', 3);

    cy.contains('.finding-title', 'Otomatik Abonelik Yenilemesi').should('be.visible');
    cy.contains('.verbatim-quote', 'Spotify Ücretli Abonelik Hizmeti, siz iptal edene kadar').should('be.visible');
    cy.contains('.verified-check', 'Kaynak Metinden Doğrulanmış Alıntı').should('be.visible');

    cy.contains('.finding-title', 'Tek Taraflı Fiyat Artışı Yetkisi').should('be.visible');
    cy.contains('.verbatim-quote', 'Ücretler önceden haber verilmeksizin').should('be.visible');

    cy.contains('.finding-title', 'Sebepsiz ve Bildirimsiz Hesap Kapatma').should('be.visible');
    cy.contains('.verbatim-quote', 'Spotify, hizmeti herhangi bir zamanda, herhangi bir nedenle').should('be.visible');

    cy.wait(2000); // Visual clarity pause for video recording
  });

  it('2. Dürüst Belirsizlik Anı (Honest Uncertainty Moment): Düşük Güven, Eksik Metin ve Şeffaf Rapor', () => {
    // Switch to Uncertainty Scenario
    cy.get('#scenario-uncertainty').click();

    // Verify low confidence alert is shown immediately
    cy.get('#low-confidence-warning', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Bu sayfanın bir sözleşme sayfası olduğundan emin değiliz');

    cy.contains('.coverage-pill', 'Kısmi').should('be.visible');

    // Consent and trigger analysis
    cy.get('#checkbox-consent').check().should('be.checked');
    cy.get('#btn-analyze').click();

    // Verify report reflects honest uncertainty without hallucinating false risks
    cy.get('#report-section', { timeout: 10000 }).should('be.visible');
    cy.get('#risk-score-display').should('contain.text', '0');
    cy.get('#risk-level-badge').should('contain.text', 'Düşük Risk');

    cy.get('#uncertainty-box')
      .should('be.visible')
      .and('contain.text', 'yalnızca %35\'lik bölümü analiz edilmiştir');

    cy.contains('.empty-findings', 'yüksek riskli bir madde bulunamadı').should('be.visible');

    cy.wait(2000); // Visual clarity pause for video recording
  });
});
