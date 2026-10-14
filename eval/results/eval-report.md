# ŞartMercek — Mini Eval Raporu

**Durum:** `NOT RUN`  
**Tarih:** 2026-10-14T17:41:30.870Z  
**Veri Kümesi:** 5 Gerçek Resmî Türkçe Sözleşme / Gizlilik Politikası  

> [!NOTE]  
> Canlı LLM değerlendirmesi ortam değişkeninde `OPENAI_API_KEY` bulunmadığı için güvenli şekilde çalıştırılmamıştır. ŞartMercek prensipleri gereğince gerçek bir sağlayıcı çalıştırılmadan uydurma başarı yüzdesi, precision veya F1 hesaplanmamaktadır.

## İncelenen 5 Gerçek Hizmet ve Kaynak Snapshot Bilgileri

| Kaynak | Belge Türü | Resmî URL | Erişim Tarihi | SHA-256 İçerik Özeti |
|---|---|---|---|---|
| **Spotify** | subscription_terms | [Spotify](https://www.spotify.com/tr/legal/end-user-agreement/) | 2026-03-10 | `8f4a13e2d67c91b0...` |
| **Discord** | terms_of_service | [Discord](https://discord.com/terms) | 2026-02-15 | `3c7b91d4e08215fa...` |
| **Notion** | terms_of_service | [Notion](https://www.notion.so/help/terms-and-conditions) | 2026-01-20 | `5a1f049281e0485c...` |
| **Trendyol** | user_agreement | [Trendyol](https://www.trendyol.com/uyelik-sozlesmesi) | 2026-03-01 | `9b184205c7482910...` |
| **Getir** | terms_of_service | [Getir](https://getir.com/kullanim-kosullari/) | 2026-02-28 | `4e710293848129e0...` |

## Ground-Truth Referans Doğruluk Durumu
- Toplam İnsan Referans Madde Sayısı: **13**
- Kaynak Metinlerde Doğrulanan Alıntılar: **13**
- Bütünlük Oranı: **%100**

## Canlı Değerlendirmeyi Çalıştırma Talimatı
Gerçek OpenAI veya OpenAI uyumlu sağlayıcı ile eval çalıştırmak için:
```powershell
$env:OPENAI_API_KEY = "sk-..."
$env:OPENAI_MODEL = "gpt-4o-mini" # Opsiyonel
npm run eval
```
