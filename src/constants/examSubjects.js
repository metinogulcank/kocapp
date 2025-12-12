export const EXAM_CATEGORY_OPTIONS = [
  {
    label: 'YKS',
    options: [
      { value: 'yks_say', label: 'YKS Sayısal' },
      { value: 'yks_ea', label: 'YKS Eşit Ağırlık' },
      { value: 'yks_soz', label: 'YKS Sözel' }
    ]
  },
  {
    label: 'LGS',
    options: [{ value: 'lgs', label: 'LGS' }]
  },
  {
    label: 'KPSS',
    options: [
      { value: 'kpss_gkgy', label: 'Genel Kültür - Genel Yetenek' },
      { value: 'kpss_egitim', label: 'Eğitim Bilimleri' },
      { value: 'kpss_alan', label: 'Alan Bilgisi' }
    ]
  }
];

const TYT_DERSLERI = [
  'TYT Türkçe',
  'TYT Matematik',
  'TYT Geometri',
  'TYT Fizik',
  'TYT Kimya',
  'TYT Biyoloji',
  'TYT Tarih',
  'TYT Coğrafya',
  'TYT Felsefe',
  'TYT Din Kültürü ve Ahlak Bilgisi'
];

// AYT dersleri (alan bazlı)
const AYT_SAY_DERSLERI = [
  'AYT Matematik',
  'AYT Geometri',
  'AYT Fizik',
  'AYT Kimya',
  'AYT Biyoloji'
];

const AYT_EA_DERSLERI = [
  'AYT Matematik',
  'AYT Geometri',
  'AYT Türk Dili ve Edebiyatı',
  'AYT Tarih-1',
  'AYT Coğrafya-1'
];

const AYT_SOZ_DERSLERI = [
  'AYT Türk Dili ve Edebiyatı',
  'AYT Tarih-1',
  'AYT Coğrafya-1',
  'AYT Tarih-2',
  'AYT Coğrafya-2',
  'AYT Felsefe Grubu',
  'AYT Psikoloji',
  'AYT Sosyoloji',
  'AYT Mantık',
  'AYT Din Kültürü ve Ahlak Bilgisi'
];

export const EXAM_SUBJECTS_BY_AREA = {
  // YKS Sayısal: TYT + AYT Sayısal dersleri
  yks_say: [...TYT_DERSLERI, ...AYT_SAY_DERSLERI],
  // YKS Eşit Ağırlık: TYT + AYT EA dersleri
  yks_ea: [...TYT_DERSLERI, ...AYT_EA_DERSLERI],
  // YKS Sözel: TYT + AYT Sözel dersleri
  yks_soz: [...TYT_DERSLERI, ...AYT_SOZ_DERSLERI],
  // Geriye dönük uyumluluk için eski değerler (deprecated)
  yks_tyt: TYT_DERSLERI,
  lgs: [
    'Türkçe',
    'Matematik',
    'Fen Bilimleri',
    'T.C. İnkılap Tarihi ve Atatürkçülük',
    'Din Kültürü ve Ahlak Bilgisi',
    'İngilizce'
  ],
  kpss_gkgy: ['Türkçe', 'Matematik', 'Tarih', 'Coğrafya', 'Vatandaşlık'],
  kpss_egitim: [
    'Gelişim Psikolojisi',
    'Öğrenme Psikolojisi',
    'Rehberlik ve Psikolojik Danışma',
    'Öğretim İlke ve Yöntemleri',
    'Ölçme ve Değerlendirme'
  ],
  kpss_alan: ['Alan Bilgisi']
};

export const EXAM_AREA_LABELS = EXAM_CATEGORY_OPTIONS.reduce((acc, group) => {
  group.options.forEach((opt) => {
    acc[opt.value] = opt.label;
  });
  return acc;
}, {});

