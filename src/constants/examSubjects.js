export const EXAM_CATEGORY_OPTIONS = [
  {
    label: 'YKS',
    options: [
      { value: 'yks_tyt', label: 'TYT' },
      { value: 'yks_say', label: 'Sayısal (SAY)' },
      { value: 'yks_ea', label: 'Eşit Ağırlık (EA)' },
      { value: 'yks_soz', label: 'Sözel (SÖZ)' }
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

export const EXAM_SUBJECTS_BY_AREA = {
  yks_tyt: [
    'Türkçe',
    'Matematik',
    'Geometri',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Tarih',
    'Coğrafya',
    'Felsefe',
    'Din Kültürü ve Ahlak Bilgisi'
  ],
  yks_say: ['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji'],
  yks_ea: ['Matematik', 'Geometri', 'Türk Dili ve Edebiyatı', 'Tarih-1', 'Coğrafya-1'],
  yks_soz: [
    'Türk Dili ve Edebiyatı',
    'Tarih-1',
    'Coğrafya-1',
    'Tarih-2',
    'Coğrafya-2',
    'Felsefe Grubu',
    'Psikoloji',
    'Sosyoloji',
    'Mantık',
    'Din Kültürü ve Ahlak Bilgisi'
  ],
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

