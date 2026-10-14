export type ErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'QUOTE_VERIFICATION_FAILED'
  | 'INSUFFICIENT_DOCUMENT'
  | 'EXTERNAL_CONSENT_REQUIRED'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessageTr: string;
  public readonly details?: unknown;

  constructor(code: ErrorCode, userMessageTr: string, details?: unknown) {
    super(userMessageTr);
    this.name = 'AppError';
    this.code = code;
    this.userMessageTr = userMessageTr;
    this.details = details;
  }
}

export const ERROR_MESSAGES_TR: Record<ErrorCode, string> = {
  MISSING_API_KEY: 'LLM API anahtarı yapılandırılmamış. Lütfen Ayarlar sayfasından geçerli bir API anahtarı girin.',
  INVALID_API_KEY: 'Girilen API anahtarı geçersiz veya yetkilendirme reddedildi. Lütfen sağlayıcı ayarlarınızı kontrol edin.',
  NETWORK_ERROR: 'API sağlayıcısına bağlanırken ağ hatası oluştu. İnternet bağlantınızı ve Base URL adresini kontrol edin.',
  TIMEOUT_ERROR: 'İstek zaman aşımına uğradı. Model belirlenen sürede yanıt vermedi.',
  RATE_LIMIT_ERROR: 'Sağlayıcı kota aşımı veya hız sınırlaması (Rate Limit) bildirdi. Lütfen bir süre sonra tekrar deneyin.',
  SCHEMA_VALIDATION_ERROR: 'Model çıktısı beklenen yapısal şemaya (JSON) uymuyor. Güvenlik gereği yanıt rapora dönüştürülmedi.',
  QUOTE_VERIFICATION_FAILED: 'Model tarafından üretilen iddiaların kaynak metinde doğrudan alıntısı bulunamadı (sahte/değiştirilmiş alıntı reddedildi).',
  INSUFFICIENT_DOCUMENT: 'Mevcut sayfada analiz için yeterli sözleşme metni tespit edilemedi veya sayfa içeriği boş.',
  EXTERNAL_CONSENT_REQUIRED: 'Metnin harici bir yapay zekâ servisine gönderilmesi için kullanıcı onayı gereklidir.',
  UNKNOWN_ERROR: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
};
