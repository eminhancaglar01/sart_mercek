export const RISK_CATEGORIES = {
  auto_renewal_cancellation: {
    id: 'auto_renewal_cancellation',
    titleTr: 'Otomatik Yenileme ve Abonelik İptali',
    descriptionTr: 'Aboneliğin otomatik uzatılması, cayma hakkı sınırlamaları veya zorlaştırılmış iptal prosedürleri.',
    defaultSeverity: 'high'
  },
  fee_changes_extra_costs: {
    id: 'fee_changes_extra_costs',
    titleTr: 'Ücret Değişiklikleri ve Ek Masraflar',
    descriptionTr: 'Hizmet bedelinin tek taraflı artırılması, gizli ücretler veya iade edilmeyen ödemeler.',
    defaultSeverity: 'high'
  },
  data_collection_sharing: {
    id: 'data_collection_sharing',
    titleTr: 'Kişisel Verilerin Toplanması ve Paylaşılması',
    descriptionTr: 'Aşırı veri toplama, kullanıcı alışkanlıklarının izlenmesi veya reklam hedeflemesi.',
    defaultSeverity: 'medium'
  },
  third_party_transfer: {
    id: 'third_party_transfer',
    titleTr: 'Verilerin Üçüncü Taraflara Aktarılması',
    descriptionTr: 'Kişisel bilgilerin iş ortaklarına, bağlı şirketlere veya yurt dışına denetimsiz aktarımı.',
    defaultSeverity: 'medium'
  },
  content_licensing_ip: {
    id: 'content_licensing_ip',
    titleTr: 'İçerik Lisanslama ve Fikri Haklar',
    descriptionTr: 'Kullanıcının ürettiği içerik üzerinde platformun süresiz, geri alınamaz ve ücretsiz kullanım hakları talep etmesi.',
    defaultSeverity: 'high'
  },
  account_suspension_termination: {
    id: 'account_suspension_termination',
    titleTr: 'Hesabın Askıya Alınması veya Kapatılması',
    descriptionTr: 'Bildirim yapılmaksızın, keyfi gerekçelerle hesabın durdurulması veya silinmesi.',
    defaultSeverity: 'high'
  },
  unilateral_change: {
    id: 'unilateral_change',
    titleTr: 'Tek Taraflı Sözleşme Değişikliği',
    descriptionTr: 'Platformun sözleşme şartlarını kullanıcıya önceden bildirmeden tek taraflı değiştirme hakkı saklı tutması.',
    defaultSeverity: 'high'
  },
  liability_limitation: {
    id: 'liability_limitation',
    titleTr: 'Sorumluluğun Sınırlandırılması',
    descriptionTr: 'Hizmet kesintileri, veri kayıpları veya zararlarda şirketin sorumluluktan tamamen muaf tutulması.',
    defaultSeverity: 'medium'
  },
  dispute_resolution_jurisdiction: {
    id: 'dispute_resolution_jurisdiction',
    titleTr: 'Uyuşmazlık Çözümü ve Yetkili Hukuk',
    descriptionTr: 'Kullanıcının yerel mahkemelere başvurma hakkını engelleyen yabancı hukuk veya tahkim dayatmaları.',
    defaultSeverity: 'medium'
  },
  other_user_rights: {
    id: 'other_user_rights',
    titleTr: 'Kullanıcı Haklarını Etkileyen Diğer Maddeler',
    descriptionTr: 'Yukarıdaki kategorilere girmeyen ancak tüketici haklarını zedeleyen sair hükümler.',
    defaultSeverity: 'low'
  }
} as const;

export type RiskCategoryId = keyof typeof RISK_CATEGORIES;

export const SEVERITY_LEVELS = {
  low: {
    id: 'low',
    labelTr: 'Düşük',
    badgeClass: 'badge-low',
    weight: 3
  },
  medium: {
    id: 'medium',
    labelTr: 'Orta',
    badgeClass: 'badge-medium',
    weight: 8
  },
  high: {
    id: 'high',
    labelTr: 'Yüksek',
    badgeClass: 'badge-high',
    weight: 15
  },
  critical: {
    id: 'critical',
    labelTr: 'Kritik',
    badgeClass: 'badge-critical',
    weight: 25
  }
} as const;

export type SeverityLevel = keyof typeof SEVERITY_LEVELS;

export const RISK_SCORE_THRESHOLDS = {
  low: { max: 20, labelTr: 'Düşük Risk', level: 'low' },
  moderate: { max: 50, labelTr: 'Orta Risk', level: 'moderate' },
  high: { max: 75, labelTr: 'Yüksek Risk', level: 'high' },
  critical: { max: 100, labelTr: 'Kritik Risk', level: 'critical' }
} as const;

export type OverallRiskLevel = 'low' | 'moderate' | 'high' | 'critical';
