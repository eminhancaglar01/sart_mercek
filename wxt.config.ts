import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ŞartMercek — Türkçe Sözleşme Risk Analizcisi',
    description: 'Kullanım koşulları, gizlilik politikaları ve abonelik sözleşmelerini kanıta dayalı analiz eden Chrome uzantısı.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    action: {
      default_title: 'ŞartMercek — Sözleşme Risk Analizcisi'
    }
  }
});
