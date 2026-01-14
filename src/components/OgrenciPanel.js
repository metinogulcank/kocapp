import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faSignOutAlt, 
  faCalendarAlt, 
  faChartPie, 
  faTrophy,
  faBook,
  faClipboardList,
  faBullseye,
  faClock,
  faPlus,
  faCheck,
  faTrash,
  faChevronLeft,
  faChevronRight,
  faChartLine,
  faLightbulb,
  faStickyNote,
  faUser,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import './OgretmenPanel.css';
import OgrenciProgramTab from './OgrenciProgramTab';
import Bildirimler from './Bildirimler';
import Kaynaklar from './Kaynaklar';
import { EXAM_CATEGORY_OPTIONS } from '../constants/examSubjects';
// Ders görselleri
import cografyaImg from '../assets/cografya.png';
import edebiyatImg from '../assets/edebiyat.png';
import dinImg from '../assets/din.png';
import felsefeImg from '../assets/felsefe.png';
import lgsFenImg from '../assets/lgs_fen.png';
import lgsInkilapImg from '../assets/lgs_inkilap.png';
import sosyalImg from '../assets/sosyal.png';
import tarihImg from '../assets/tarih.png';
import tumBiyolojiImg from '../assets/tum_biyoloji.png';
import tumFizikImg from '../assets/tum_fizik.png';
import tumGeometriImg from '../assets/tum_geometri.png';
import tumIngilizceImg from '../assets/tum_ingilizce.png';
import tumKimyaImg from '../assets/tum_kimya.png';
import tumMatematikImg from '../assets/tum_matematik.png';
import tumTurkceImg from '../assets/tum_turkce.png';

const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://kocapp.com' : window.location.origin);
const API_UPDATE_STUDENT = `${API_BASE}/php-backend/api/update_student.php`;
const API_UPLOAD_PHOTO = `${API_BASE}/php-backend/api/upload_teacher_photo.php`;

const resolveIconUrl = (iconUrl) => {
  if (!iconUrl) return null;
  if (/^https?:\/\//i.test(iconUrl)) return iconUrl;
  if (iconUrl.startsWith('/')) return `${API_BASE}${iconUrl}`;
  return `${API_BASE}/${iconUrl}`;
};

const safeFetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "URL:", url, "Raw response:", text);
      return { success: false, message: "Geçersiz JSON yanıtı", raw: text };
    }
  } catch (fetchError) {
    console.error("Fetch error:", fetchError, "URL:", url);
    return { success: false, message: "İstek hatası" };
  }
};

// Alan kodunu (yks_say vb.) okunur etikete çevir
const formatAreaLabel = (area, studentInfo = null) => {
  if (studentInfo && studentInfo.alanName) return studentInfo.alanName;
  if (studentInfo && studentInfo.alan && studentInfo.alan.includes(' - ')) return studentInfo.alan;
  if (!area) return '';
  const allOptions = EXAM_CATEGORY_OPTIONS.flatMap(group => group.options || []);
  const found = allOptions.find(opt => opt.value === area);
  return found ? found.label : area;
};

// Sınav tarihleri (yıllık güncellenebilir)
const EXAM_DATES = {
  lgs: '2025-06-01',
  yks: '2025-06-15',
  kpss_gkgy: '2025-07-20',
  kpss_alan: '2025-07-20',
  kpss_egitim: '2025-07-20'
};

// Motivasyon mesajları
const MOTIVATION_MESSAGES = [
  "Bugün harika bir gün! Başarılar seninle! 🎯",
  "Her adım seni hedefine yaklaştırıyor! 💪",
  "Azmin ve çabanla her şey mümkün! 🌟",
  "Bugün de harika işler yapacaksın! 👏",
  "Başarı yolculuğunda sen çok güçlüsün! 🚀"
];

const getSubjectIcon = (ders, allSubjects = []) => {
  // 1. Önce veritabanından gelen dinamik ikonlara bak
  if (allSubjects && allSubjects.length > 0) {
    // Ders adını normalize et (Boşlukları ve büyük/küçük harfi eşitle)
    const normalizedDers = ders.trim().toLowerCase();
    
    // Tam eşleşme ara
    let found = allSubjects.find(s => s.ders_adi.trim().toLowerCase() === normalizedDers);
    
    // Tam eşleşme yoksa, TYT/AYT gibi önekleri kaldırıp ara
    if (!found) {
      const searchWithoutPrefix = normalizedDers.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
      found = allSubjects.find(s => {
        const sNorm = s.ders_adi.trim().toLowerCase();
        const sWithoutPrefix = sNorm.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
        return sWithoutPrefix === searchWithoutPrefix;
      });
    }

    if (found && found.icon_url) {
      // Eğer icon_url tam URL değilse API_BASE ekle
      if (found.icon_url.startsWith('http')) {
        return found.icon_url;
      } else {
        // Başında slash yoksa ekle
        const path = found.icon_url.startsWith('/') ? found.icon_url : '/' + found.icon_url;
        return `${API_BASE}${path}`;
      }
    }
  }

  // 2. Veritabanında yoksa statik map'ten devam et (Fallback)
  const iconMap = {
    'TYT Matematik': tumMatematikImg,
    'TYT Geometri': tumGeometriImg,
    'TYT Türkçe': tumTurkceImg,
    'TYT Fizik': tumFizikImg,
    'TYT Kimya': tumKimyaImg,
    'TYT Biyoloji': tumBiyolojiImg,
    'TYT Tarih': tarihImg,
    'TYT Coğrafya': cografyaImg,
    'TYT Felsefe': felsefeImg,
    'AYT Matematik': tumMatematikImg,
    'AYT Geometri': tumGeometriImg,
    'AYT Fizik': tumFizikImg,
    'AYT Kimya': tumKimyaImg,
    'AYT Biyoloji': tumBiyolojiImg,
    'AYT Edebiyat': edebiyatImg,
    'AYT Tarih': tarihImg,
    'AYT Coğrafya': cografyaImg,
    'AYT Felsefe': felsefeImg,
    'LGS Matematik': tumMatematikImg,
    'LGS Fen': lgsFenImg,
    'LGS Türkçe': tumTurkceImg,
    'LGS İnkılap': lgsInkilapImg,
    'LGS Din': dinImg,
    'LGS İngilizce': tumIngilizceImg
  };
  return iconMap[ders] || null;
};



const OgrenciPanel = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('ana-sayfa');
  const [student, setStudent] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]); // Tüm derslerin listesi (ikonlar için)
  const [loading, setLoading] = useState(true);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [examCountdown, setExamCountdown] = useState({ days: 0, examName: '' });
  const [etutStats, setEtutStats] = useState({ yapilan: 0, eksikYapildi: 0, yapilmayan: 0, toplam: 0 });
  const [denemeNetleri, setDenemeNetleri] = useState(null);
  const [etutStatsLoading, setEtutStatsLoading] = useState(true);
  const [denemeLoading, setDenemeLoading] = useState(true);

  // Konu İlerlemesi state
  const [selectedDersForIlerleme, setSelectedDersForIlerleme] = useState(null);
  const [ilerlemeExamType, setIlerlemeExamType] = useState('tyt');
  const [konuIlerlemesi, setKonuIlerlemesi] = useState([]);
  const [konuIlerlemesiLoading, setKonuIlerlemesiLoading] = useState(false);
  const [showKaynakEkleModal, setShowKaynakEkleModal] = useState(false);
  const [yeniKaynakAdi, setYeniKaynakAdi] = useState('');

  // Branş Denemeleri state
  const [bransView, setBransView] = useState('entry');
  const [bransExamType, setBransExamType] = useState('tyt');
  const [bransDenemeList, setBransDenemeList] = useState([]);
  const [bransDenemelerLoading, setBransDenemelerLoading] = useState(false);
  const [bransChartsSelectedDers, setBransChartsSelectedDers] = useState(null);
  const [bransDenemeForm, setBransDenemeForm] = useState({
    alan: '',
    ders: '',
    denemeAdi: '',
    denemeTarihi: '',
    soruSayisi: '',
    dogru: '',
    yanlis: '',
    bos: '',
    net: 0
  });
  const [bransKonular, setBransKonular] = useState([]);
  const [bransKonuDetayAcik, setBransKonuDetayAcik] = useState(false);
  const [bransKaydediliyor, setBransKaydediliyor] = useState(false);

  // Genel Denemeler state
  const [genelDenemeFilter, setGenelDenemeFilter] = useState('son-deneme');
  const [genelDenemeView, setGenelDenemeView] = useState(null);
  const [genelDenemeTab, setGenelDenemeTab] = useState('ekle');
  const [genelDenemeSinavTipi, setGenelDenemeSinavTipi] = useState('tyt');
  const [genelDenemeForm, setGenelDenemeForm] = useState({
    denemeAdi: '',
    denemeTarihi: '',
    notlar: '',
    sinavTipi: 'tyt'
  });
  const [genelDenemeDersler, setGenelDenemeDersler] = useState({});
  const [genelDenemeDegerlendirme, setGenelDenemeDegerlendirme] = useState({
    zamanYeterli: null,
    odaklanma: null,
    kaygiDuzeyi: null,
    enZorlayanDers: '',
    kendiniHissediyorsun: null
  });
  const [genelDenemeDegerlendirmeModalAcik, setGenelDenemeDegerlendirmeModalAcik] = useState(false);
  const [genelDenemeKaydediliyor, setGenelDenemeKaydediliyor] = useState(false);
  const [genelDenemeList, setGenelDenemeList] = useState([]);
  const [genelDenemeListLoading, setGenelDenemeListLoading] = useState(false);
  
  // Deneme Grafikleri için state'ler
  const [denemeGrafikTab, setDenemeGrafikTab] = useState('genel'); // 'genel' | 'ders-bazli'
  const [dersBazliGrafikSinavTipi, setDersBazliGrafikSinavTipi] = useState('tyt'); // YKS için TYT/AYT seçimi
  const [dersBazliGrafikFiltre, setDersBazliGrafikFiltre] = useState('net'); // 'net' | 'dogru' | 'yanlis' | 'bos'

  // Öğretmen panelindeki Soru/Süre/Konu Dağılımı & Ders/Konu Bazlı Başarım için state'ler
  const [questionStats, setQuestionStats] = useState({
    todayRequired: 0,
    weekRequired: 0,
    weekPending: 0,
    totalSolved: 0
  });
  const [questionStatsLoading, setQuestionStatsLoading] = useState(false);
  const [activeQuestionTab, setActiveQuestionTab] = useState('konu-dagilimi');
  const [selectedQuestionExamArea, setSelectedQuestionExamArea] = useState(null);
  const [questionDistributionPeriod, setQuestionDistributionPeriod] = useState('gunluk');
  const [questionDistributionStats, setQuestionDistributionStats] = useState({});
  const [questionDistributionLoading, setQuestionDistributionLoading] = useState(false);

  // Süre dağılımı için state
  const [timeDistributionStats, setTimeDistributionStats] = useState({
    daily: {},
    weekly: [],
    weeklyDaily: {}
  });
  const [timeDistributionLoading, setTimeDistributionLoading] = useState(false);
  const [selectedWeeklyPeriod, setSelectedWeeklyPeriod] = useState('current');

  // Konu dağılımı için state
  const [selectedExamArea, setSelectedExamArea] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topicStats, setTopicStats] = useState({});
  const [topicStatsLoading, setTopicStatsLoading] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);

  const [dersBasariStats, setDersBasariStats] = useState({});
  const [dersBasariLoading, setDersBasariLoading] = useState(false);
  const [selectedDersForDetail, setSelectedDersForDetail] = useState(null);
  const [showDersDetailModal, setShowDersDetailModal] = useState(false);
  const [dersDetailTopics, setDersDetailTopics] = useState({});
  const [dersBasariExamType, setDersBasariExamType] = useState('tyt');

  // Profil formu (öğrenci kendi bilgilerini düzenler)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    className: '',
    alan: '',
    profilePhoto: '',
    newPassword: '',
    newPasswordConfirm: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const menuItems = [
    { id: 'ana-sayfa', icon: faHome, label: 'Ana Sayfa' },
    { id: 'plan-program', icon: faBook, label: 'Plan/ Program' },
    { id: 'gunluk-soru', icon: faStickyNote, label: 'Soru/Süre/Konu Dağılımı' },
    { id: 'ders-basari', icon: faTrophy, label: 'Ders/Konu Bazlı Başarım' },
    { id: 'konu-ilerlemesi', icon: faClipboardList, label: 'Kaynak ve Konu İlerlemesi' },
    { id: 'brans-denemeleri', icon: faBullseye, label: 'Branş Denemeleri' },
    { id: 'genel-denemeler', icon: faClock, label: 'Genel Denemeler' },
    { id: 'bildirimler', icon: faBell, label: 'Bildirimlerim' },
    { id: 'profil', icon: faUser, label: 'Profilim' }
  ];

  const [examComponents, setExamComponents] = useState([]);
  const [examComponentsLoading, setExamComponentsLoading] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadNotificationsLoading, setUnreadNotificationsLoading] = useState(false);

  const fetchUnreadNotifications = async () => {
    if (!student?.id) return;
    try {
      setUnreadNotificationsLoading(true);
      const url = `${API_BASE}/php-backend/api/get_notifications.php?userId=${student.id}&role=student`;
      const data = await safeFetchJson(url);
      if (data && data.success && Array.isArray(data.notifications)) {
        const unread = data.notifications.filter(n => n.is_read == 0 || n.is_read === false || n.is_read === 'false');
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    } finally {
      setUnreadNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (student?.id) {
      fetchUnreadNotifications();
    }
  }, [student?.id]);

  // Dinamik ders listesi alma yardımcı fonksiyonu
  const getDersList = (examCompId, fallbackArea) => {
    const selectedComp = examComponents.find(c => c.id === examCompId);
    if (selectedComp && selectedComp.dersler && selectedComp.dersler.length > 0) {
      return selectedComp.dersler
        .map(d => (typeof d === 'string' ? d : (d?.ders_adi || d?.ad || d?.name || '')))
        .filter(Boolean);
    }

    const studentAreaRaw = fallbackArea || student?.alan || '';
    const studentArea = (studentAreaRaw || '').toLowerCase();
    const fallbackDersList = [];
    
    // Eğer examComponents yüklüyse ve içinde dersler varsa, tüm dersleri birleştirip fallback yapabiliriz
    if (examComponents.length > 0) {
      examComponents.forEach(c => {
        if (c.dersler) {
          c.dersler.forEach(d => {
            const dersAdi = typeof d === 'string' ? d : (d?.ders_adi || d?.ad || d?.name || '');
            if (dersAdi && !fallbackDersList.includes(dersAdi)) fallbackDersList.push(dersAdi);
          });
        }
      });
    }

    if (studentArea.startsWith('yks')) {
      if (examCompId === 'tyt') {
        return fallbackDersList.filter(d => d.startsWith('TYT ') || !d.includes('AYT '));
      } else if (examCompId === 'ayt') {
        return fallbackDersList.filter(d => d.startsWith('AYT '));
      }
    }
    return fallbackDersList;
  };

  const getExamSubjectIconUrl = (examCompId, subjectName) => {
    if (!examCompId || !subjectName) return null;
    const comp = examComponents.find(c => c.id === examCompId);
    const found = comp?.dersler?.find(d => {
      const dersAdi = typeof d === 'string' ? d : (d?.ders_adi || d?.ad || d?.name || '');
      return dersAdi === subjectName;
    });
    if (found && typeof found === 'object') return found.icon_url || found.iconUrl || null;
    return null;
  };

  // Öğrencinin sınav bileşenlerini çek
  const fetchExamComponents = async (studentId) => {
    if (!studentId) return;
    setExamComponentsLoading(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_exam_components.php?studentId=${studentId}`);
      if (data.success) {
        setExamComponents(data.components || []);
        
        // Eğer bileşenler varsa, varsayılan olarak ilkini seç
        if (data.components && data.components.length > 0) {
          const firstCompId = data.components[0].id;
          
          // Eğer tek bir bileşen varsa veya henüz seçim yapılmamışsa otomatik seç
          if (data.components.length === 1 || !selectedQuestionExamArea) {
            setSelectedQuestionExamArea(firstCompId);
          }
          if (data.components.length === 1 || !selectedExamArea) {
            setSelectedExamArea(firstCompId);
          }
          if (data.components.length === 1 || !dersBasariExamType || dersBasariExamType === 'tyt') {
            setDersBasariExamType(firstCompId);
          }
          if (data.components.length === 1 || !ilerlemeExamType || ilerlemeExamType === 'tyt') {
            setIlerlemeExamType(firstCompId);
          }
          if (data.components.length === 1 || !bransExamType || bransExamType === 'tyt') {
            setBransExamType(firstCompId);
          }
          if (data.components.length === 1 || !genelDenemeForm.sinavTipi || genelDenemeForm.sinavTipi === 'tyt') {
            setGenelDenemeForm(prev => ({ ...prev, sinavTipi: firstCompId }));
          }
        }
      }
    } catch (error) {
      console.error('Sınav bileşenleri yüklenemedi:', error);
    } finally {
      setExamComponentsLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'ogrenci') {
      navigate('/');
      return;
    }
    // ... (existing code)
    fetchStudentInfo(user.id);
    fetchExamComponents(user.id); // Yeni eklenen
    // ...
  }, []);

  // Sınav alanı değiştiğinde istatistikleri çek
  useEffect(() => {
    if (selectedQuestionExamArea && activeMenu === 'gunluk-soru' && activeQuestionTab === 'soru-dagilimi') {
      fetchQuestionDistributionStatsForStudent();
    }
  }, [selectedQuestionExamArea, activeMenu, activeQuestionTab]);

  // Online durumu için heartbeat
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'ogrenci') return;

    let isMounted = true;

    const setOnline = async () => {
      try {
        await safeFetchJson(`${API_BASE}/php-backend/api/update_student_online_status.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: user.id, onlineStatus: 1 })
        });
      } catch (err) {
        console.error('Online durumu güncellenemedi:', err);
      }
    };

    // Sayfa açıldığında online yap
    setOnline();

    // Her 60 saniyede bir heartbeat
    const intervalId = setInterval(() => {
      if (!isMounted) return;
      setOnline();
    }, 60000);

    // Sayfa kapanırken/sekme değişirken offline yapmaya çalış
    const handleBeforeUnload = () => {
      navigator.sendBeacon &&
        navigator.sendBeacon(
          `${API_BASE}/php-backend/api/update_student_online_status.php`,
          JSON.stringify({ studentId: user.id, onlineStatus: 0 })
        );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Component unmount olduğunda offline yapmayı dene
      safeFetchJson(`${API_BASE}/php-backend/api/update_student_online_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, onlineStatus: 0 })
      }).catch(() => {});
    };
  }, []);

  // Menü veya seçimler değiştiğinde verileri yükle
  useEffect(() => {
    if (!student?.id) return;

    // Soru/Süre/Konu dağılımı ve Ders/Konu başarım verilerini yükle
    if (activeMenu === 'gunluk-soru') {
      fetchQuestionStatsForStudent(student.id);
      if (activeQuestionTab === 'soru-dagilimi' && selectedQuestionExamArea) {
        fetchQuestionDistributionStatsForStudent();
      }
      if (activeQuestionTab === 'sure-dagilimi') {
        fetchTimeDistributionStatsForStudent();
      }
      if (activeQuestionTab === 'konu-dagilimi') {
        fetchAllProgramsForStudent();
      }
    }
    if (activeMenu === 'ders-basari') {
      fetchDersBasariStatsForStudent(student.id);
    }

    if (activeMenu === 'konu-ilerlemesi' && selectedDersForIlerleme) {
      fetchKonuIlerlemesi();
    }
    if (activeMenu === 'brans-denemeleri') {
      fetchBransDenemeleri();
    }
    if (activeMenu === 'genel-denemeler') {
      fetchGenelDenemeler();
      // Öğrencinin alanına göre formu sıfırla
      if (student?.alan) {
        const studentAreaRaw = student.alan;
        const studentArea = (studentAreaRaw || '').toLowerCase();
        const isYks = studentArea.startsWith('yks');
        setGenelDenemeForm({ 
          denemeAdi: '', 
          denemeTarihi: '', 
          notlar: '', 
          sinavTipi: isYks ? 'tyt' : (studentArea || 'lgs')
        });
        setGenelDenemeDersler({});
      }
    }
  }, [activeMenu, activeQuestionTab, selectedQuestionExamArea, selectedExamArea, dersBasariExamType, student, selectedDersForIlerleme]);

  // Genel deneme listesi güncellendiğinde ana sayfadaki son deneme kartını güncelle
  useEffect(() => {
    if (!genelDenemeList || genelDenemeList.length === 0) {
      // Genel deneme yoksa, branş denemelerini kontrol et (fetchDenemeNetleri'ndeki mantık)
      return;
    }

    let sonDeneme = genelDenemeList[0];
    
    // Öğrencinin alanına göre KPSS denemelerini önceliklendir
    if (student?.alan && student.alan.toLowerCase().startsWith('kpss')) {
      const kpssDenemeleri = genelDenemeList.filter(d => 
        d.sinavTipi && d.sinavTipi.toLowerCase().includes('kpss')
      );
      if (kpssDenemeleri.length > 0) {
        sonDeneme = kpssDenemeleri[0];
      }
    }
    
    let toplamNet = 0;
    let tipAdi = '';
    
    if (sonDeneme.dersSonuclari) {
      Object.values(sonDeneme.dersSonuclari).forEach(ders => {
        toplamNet += ders.net || 0;
      });
    }
    
    if (sonDeneme.sinavTipi) {
      const sinavTipi = sonDeneme.sinavTipi.toLowerCase();
      if (sinavTipi.includes('kpss')) {
        tipAdi = 'KPSS';
      } else if (sinavTipi === 'tyt') {
        tipAdi = 'TYT';
      } else if (sinavTipi === 'ayt') {
        tipAdi = 'AYT';
      } else {
        tipAdi = sonDeneme.sinavTipi.toUpperCase();
      }
    } else {
      tipAdi = 'Genel Deneme';
    }
    
    setDenemeNetleri({
      tip: tipAdi,
      net: toplamNet.toFixed(2),
      tarih: sonDeneme.denemeTarihi,
      denemeAdi: sonDeneme.denemeAdi
    });
    setDenemeLoading(false);
  }, [genelDenemeList, student?.alan]);

  // Günlük soru tab değişimlerinde öğretmen paneline benzer davranış
  useEffect(() => {
    if (activeMenu !== 'gunluk-soru') return;

    if (activeQuestionTab === 'soru-dagilimi') {
      setSelectedQuestionExamArea(null);
      setQuestionDistributionPeriod('gunluk');
      setQuestionDistributionStats({});
    }
    if (activeQuestionTab === 'konu-dagilimi') {
      setSelectedExamArea(null);
      setSelectedSubject(null);
      fetchAllProgramsForStudent();
    }
    if (activeQuestionTab === 'sure-dagilimi') {
      fetchTimeDistributionStatsForStudent();
    }
  }, [activeQuestionTab, activeMenu]);

  // Ders seçildiğinde konu istatistiklerini hesapla
  useEffect(() => {
    if (selectedSubject && allPrograms.length > 0) {
      const stats = calculateTopicStatsForStudent(selectedSubject);
      setTopicStats(stats);
    } else if (selectedSubject && allPrograms.length === 0) {
      setTopicStats({});
    }
  }, [selectedSubject, allPrograms]);

  const fetchStudentSubjects = async (studentId) => {
    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_subjects.php?studentId=${studentId}`);
      if (data.success && data.subjects) {
        setAllSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
    }
  };

  const fetchStudentInfo = async (studentId) => {
    try {
      fetchStudentSubjects(studentId);
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_info.php?studentId=${studentId}`);
      if (data.success && data.student) {
        setStudent(data.student);
        
        // Profil formunu doldur
        setProfileForm(prev => ({
          ...prev,
          firstName: data.student.firstName || '',
          lastName: data.student.lastName || '',
          email: data.student.email || '',
          phone: data.student.phone || '',
          className: data.student.className || '',
          alan: data.student.alan || '',
          profilePhoto: data.student.profilePhoto || ''
        }));
        
        // Öğrencinin alanını branş denemesi formuna set et
        if (data.student.alan) {
          setBransDenemeForm(prev => ({ ...prev, alan: data.student.alan }));
        }
        
        // Sınav geri sayımını hesapla
        const alan = data.student.alan;
        const sinavTarihi = data.student.sinavTarihi || EXAM_DATES[alan] || null;
        
        if (sinavTarihi) {
          const today = new Date();
          const examDate = new Date(sinavTarihi);
          const diffTime = examDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let examName = '';
          if (alan?.startsWith('lgs')) examName = 'LGS';
          else if (alan?.startsWith('yks')) examName = 'YKS';
          else if (alan?.startsWith('kpss')) examName = 'KPSS';
          
          setExamCountdown({ days: diffDays > 0 ? diffDays : 0, examName });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Öğrenci bilgileri yüklenemedi:', error);
      setLoading(false);
    }
  };

  // Öğretmen panelindeki fetchQuestionStats fonksiyonunun öğrenci için uyarlanmış hali
  const fetchQuestionStatsForStudent = async (studentId) => {
    setQuestionStatsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Pazar
      
      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (data.success && data.programs) {
        let todayRequired = 0;
        let weekRequired = 0;
        let weekPending = 0;
        let totalSolved = 0;

        const allTimeData = await safeFetchJson(
          `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=2020-01-01&endDate=${todayStr}`
        );
        const allPrograms = allTimeData.success ? allTimeData.programs : [];

        allPrograms.forEach(prog => {
          if (prog.soru_sayisi && (prog.durum === 'yapildi' || prog.durum === 'eksik_yapildi')) {
            totalSolved += parseInt(prog.soru_sayisi) || 0;
          }
        });

        data.programs.forEach(prog => {
          const progDate = prog.tarih;
          const soruSayisi = parseInt(prog.soru_sayisi) || 0;
          
          if (progDate === todayStr) {
            todayRequired += soruSayisi;
          }
          
          weekRequired += soruSayisi;
          
          if (prog.durum === 'yapilmadi') {
            weekPending += soruSayisi;
          }
        });

        setQuestionStats({
          todayRequired,
          weekRequired,
          weekPending,
          totalSolved
        });
      }
    } catch (err) {
      console.error('Öğrenci soru istatistikleri yüklenemedi:', err);
    } finally {
      setQuestionStatsLoading(false);
    }
  };

  // Öğretmen panelindeki soru dağılımı istatistiklerinin öğrenciye uyarlanmış hali
  const fetchQuestionDistributionStatsForStudent = async () => {
    if (!student || !student.id || !selectedQuestionExamArea) return;
    setQuestionDistributionLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate, endDate;
      
      switch (questionDistributionPeriod) {
        case 'gunluk':
          startDate = new Date(today);
          endDate = new Date(today);
          break;
        case 'haftalik': {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
          startDate = weekStart;
          endDate = new Date(today);
          break;
        }
        case 'aylik':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today);
          break;
        case 'tum-zamanlar': {
          const meetingDate = student.meetingDate || student.meeting_date;
          if (meetingDate) {
            const md = new Date(meetingDate);
            if (!isNaN(md.getTime())) {
              startDate = new Date(md);
              startDate.setHours(0, 0, 0, 0);
            } else {
              startDate = new Date(today);
              startDate.setFullYear(today.getFullYear() - 1);
            }
          } else {
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
          }
          endDate = new Date(today);
          break;
        }
        default:
          startDate = new Date(today);
          endDate = new Date(today);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      if (data.success && data.programs) {
        const subjectMap = {};
        const processedPrograms = new Set();
        
        data.programs.forEach(prog => {
          if (prog.durum !== 'yapildi') return;
          if (prog.ders && (prog.program_tipi === 'soru_cozum' || prog.soru_sayisi)) {
            const subject = prog.ders;
            const soruSayisi = parseInt(prog.soru_sayisi) || 0;
            if (soruSayisi === 0) return;

            const programKey = prog.id 
              ? `prog_${prog.id}` 
              : prog.routine_id 
                ? `routine_${prog.routine_id}_${prog.tarih}_${prog.ders}_${soruSayisi}`
                : `${prog.tarih}_${prog.ders}_${prog.baslangic_saati}_${soruSayisi}`;

            if (processedPrograms.has(programKey)) return;
            processedPrograms.add(programKey);

            if (!subjectMap[subject]) {
              subjectMap[subject] = { yapildi: 0 };
            }
            subjectMap[subject].yapildi += soruSayisi;
          }
        });

        setQuestionDistributionStats(subjectMap);
      }
    } catch (err) {
      console.error('Öğrenci soru dağılımı istatistikleri yüklenemedi:', err);
    } finally {
      setQuestionDistributionLoading(false);
    }
  };

  const calculateDurationBetweenTimes = (start, end) => {
    if (!start || !end) return 0;
    const startTime = start.split(':').map(v => parseInt(v, 10));
    const endTime = end.split(':').map(v => parseInt(v, 10));
    if (startTime.length < 2 || endTime.length < 2) return 0;
    if ([startTime[0], startTime[1], endTime[0], endTime[1]].some(v => Number.isNaN(v))) return 0;
    const startTotal = startTime[0] * 60 + (startTime[1] || 0);
    const endTotal = endTime[0] * 60 + (endTime[1] || 0);
    const diff = endTotal - startTotal;
    return diff > 0 ? diff / 60 : 0;
  };

  // Süre dağılımı istatistikleri (öğretmendeki ile aynı, student.id kullanıyor)
  const fetchTimeDistributionStatsForStudent = async () => {
    if (!student || !student.id) return;
    setTimeDistributionLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate;
      const meetingDate = student.meetingDate || student.meeting_date;
      if (meetingDate) {
        const md = new Date(meetingDate);
        if (!isNaN(md.getTime())) {
          startDate = new Date(md);
          startDate.setHours(0, 0, 0, 0);
        } else {
          startDate = new Date(today);
          startDate.setFullYear(today.getFullYear() - 1);
        }
      } else {
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=${startDateStr}&endDate=${endDateStr}`
      );

      if (data.success && data.programs) {
        const currentWeekStart = new Date(today);
        const dayOfWeek = currentWeekStart.getDay();
        const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        currentWeekStart.setDate(diff);
        currentWeekStart.setHours(0, 0, 0, 0);

        const prevWeekStart = new Date(currentWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
        prevWeekEnd.setHours(23, 59, 59, 999);

        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
        currentWeekEnd.setHours(23, 59, 59, 999);

        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);

        const weeklyDailyMap = {
          prev: { 'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0 },
          current: { 'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0 },
          next: { 'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0 }
        };

        const weeklyMap = {};
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

        data.programs.forEach(prog => {
          if (prog.durum !== 'yapildi') return;
          if (prog.baslangic_saati && prog.bitis_saati && prog.tarih) {
            const duration = calculateDurationBetweenTimes(prog.baslangic_saati, prog.bitis_saati);
            if (duration > 0) {
              const date = new Date(prog.tarih);
              if (!isNaN(date.getTime())) {
                const dayName = dayNames[date.getDay()];

                if (date >= prevWeekStart && date <= prevWeekEnd) {
                  if (weeklyDailyMap.prev.hasOwnProperty(dayName)) {
                    weeklyDailyMap.prev[dayName] += duration;
                  }
                } else if (date >= currentWeekStart && date <= currentWeekEnd) {
                  if (weeklyDailyMap.current.hasOwnProperty(dayName)) {
                    weeklyDailyMap.current[dayName] += duration;
                  }
                } else if (date >= nextWeekStart && date <= nextWeekEnd) {
                  if (weeklyDailyMap.next.hasOwnProperty(dayName)) {
                    weeklyDailyMap.next[dayName] += duration;
                  }
                }

                const weekStart = new Date(startDate);
                const daysDiff = Math.floor((date - weekStart) / (1000 * 60 * 60 * 24));
                const weekNumber = Math.floor(daysDiff / 7) + 1;

                if (weekNumber > 0) {
                  if (!weeklyMap[weekNumber]) {
                    weeklyMap[weekNumber] = 0;
                  }
                  weeklyMap[weekNumber] += duration;
                }
              }
            }
          }
        });

        const weeklyArray = Object.entries(weeklyMap)
          .map(([week, totalHours]) => ({
            week: parseInt(week, 10),
            totalHours: Math.round(totalHours * 10) / 10
          }))
          .sort((a, b) => a.week - b.week);

        const weeklyDailyRounded = { prev: {}, current: {}, next: {} };
        Object.keys(weeklyDailyMap).forEach(period => {
          Object.keys(weeklyDailyMap[period]).forEach(day => {
            weeklyDailyRounded[period][day] = Math.round(weeklyDailyMap[period][day] * 10) / 10;
          });
        });

        setTimeDistributionStats({
          daily: {},
          weekly: weeklyArray,
          weeklyDaily: weeklyDailyRounded
        });
      }
    } catch (err) {
      console.error('Öğrenci süre dağılımı istatistikleri yüklenemedi:', err);
    } finally {
      setTimeDistributionLoading(false);
    }
  };

  // Konu istatistiklerini hesapla (öğretmen paneli ile aynı mantık)
  const calculateTopicStatsForStudent = (subject) => {
    if (!subject || !allPrograms.length) return {};

    const subjectPrograms = allPrograms.filter(prog => prog.ders === subject);
    const topicMap = {};

    subjectPrograms.forEach(prog => {
      const topic = prog.konu || 'Belirtilmemiş';
      if (!topicMap[topic]) {
        topicMap[topic] = {
          total: 0,
          yapildi: 0,
          eksik_yapildi: 0,
          yapilmadi: 0,
          dogru: 0,
          yanlis: 0,
          bos: 0
        };
      }

      const soruSayisi = parseInt(prog.soru_sayisi) || 0;
      topicMap[topic].total += soruSayisi;

      if (prog.durum === 'yapildi') {
        topicMap[topic].yapildi += soruSayisi;
      } else if (prog.durum === 'eksik_yapildi') {
        topicMap[topic].eksik_yapildi += soruSayisi;
      } else {
        topicMap[topic].yapilmadi += soruSayisi;
      }

      const d = parseInt(prog.dogru) || 0;
      const y = parseInt(prog.yanlis) || 0;
      const b = parseInt(prog.bos) || 0;

      topicMap[topic].dogru += d;
      topicMap[topic].yanlis += y;
      topicMap[topic].bos += b;
    });

    const statsWithPercentages = {};
    Object.keys(topicMap).forEach(topic => {
      const stats = topicMap[topic];
      const total = stats.total;
      const totalSolved = stats.dogru + stats.yanlis + stats.bos;
      
      statsWithPercentages[topic] = {
        ...stats,
        yapildiPercent: total > 0 ? Math.round((stats.yapildi / total) * 100) : 0,
        eksik_yapildiPercent: total > 0 ? Math.round((stats.eksik_yapildi / total) * 100) : 0,
        yapilmadiPercent: total > 0 ? Math.round((stats.yapilmadi / total) * 100) : 0,
        basariYuzdesi: totalSolved > 0 ? Math.round((stats.dogru / totalSolved) * 100) : 0,
        totalSolved
      };
    });

    return statsWithPercentages;
  };

  // Konu dağılımı için tüm programları çek
  const fetchAllProgramsForStudent = async () => {
    if (!student || !student.id) return;
    setTopicStatsLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=2020-01-01&endDate=${todayStr}`
      );
      if (data.success && data.programs) {
        setAllPrograms(data.programs);
      } else {
        setAllPrograms([]);
      }
    } catch (err) {
      console.error('Öğrenci programları yüklenemedi (konu dağılımı):', err);
      setAllPrograms([]);
    } finally {
      setTopicStatsLoading(false);
    }
  };

  // Profil formu yardımcıları
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !student?.id) return;
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('_id', student.id);
      formData.append('type', 'student');
      const data = await safeFetchJson(API_UPLOAD_PHOTO, { method: 'POST', body: formData });
      if (!data.success || !data.url) throw new Error(data.message || 'Fotoğraf yüklenemedi');
      setProfileForm(prev => ({ ...prev, profilePhoto: data.url }));
      setProfileSuccess('Fotoğraf yüklendi');
    } catch (err) {
      console.error('Profil fotoğrafı yüklenemedi:', err);
      setProfileError(err.message || 'Fotoğraf yüklenemedi');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!student?.id) return;
    setProfileError('');
    setProfileSuccess('');

    if (!profileForm.firstName || !profileForm.lastName || !profileForm.email) {
      setProfileError('Ad, soyad ve e-posta zorunludur');
      return;
    }
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.newPasswordConfirm) {
      setProfileError('Şifreler eşleşmiyor');
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        id: student.id,
        // Öğretmen panelindeki update_student yapısına uyumlu alanlar
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        // Sınıf ve alan sadece öğretmen tarafından değiştirilebilir, bu yüzden mevcut değerleri koru
        className: student.className || '',
        alan: student.alan || '',
        profilePhoto: profileForm.profilePhoto || student.profilePhoto || '',
        meetingDate: student.meetingDate || null
      };
      if (profileForm.newPassword) {
        payload.password = profileForm.newPassword;
      }

      const data = await safeFetchJson(API_UPDATE_STUDENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!data.success) {
        throw new Error(data.message || 'Profil güncellenemedi');
      }
      setProfileSuccess('Profil güncellendi');
      // Lokaldeki öğrenci bilgisini de güncelle
      setStudent(prev => prev ? ({
        ...prev,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        // className ve alanı burada da değiştirmiyoruz
        profilePhoto: profileForm.profilePhoto || prev.profilePhoto
      }) : prev);
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      setProfileError(err.message || 'Profil güncellenemedi');
    } finally {
      setProfileSaving(false);
    }
  };


  // Öğretmen panelindeki ders başarı istatistiklerinin sadeleştirilmiş öğrenci versiyonu
  const fetchDersBasariStatsForStudent = async (studentId) => {
    setDersBasariLoading(true);
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=2020-01-01&endDate=2099-12-31`
      );
      if (data.success && data.programs) {
        // Seçili bileşene göre ders listesini al
        const selectedComp = examComponents.find(c => c.id === dersBasariExamType);
        let studentSubjects = [];
        
        if (selectedComp && selectedComp.dersler) {
          studentSubjects = selectedComp.dersler;
        } else if (examComponents.length > 0) {
          // Eğer seçili bileşen yoksa ama bileşenler varsa, ilkini kullan
          studentSubjects = examComponents[0].dersler || [];
        }

        const stats = {};
        const dersDetailMap = {};

        // Tüm dersleri göster (program verilmiş olsun ya da olmasın)
        studentSubjects.forEach(subject => {
          const subjectPrograms = data.programs.filter(prog => prog.ders === subject && prog.soru_sayisi);
          let totalSoru = 0;
          let yapildiSoru = 0;
          const topicMap = {};

          subjectPrograms.forEach(prog => {
            const soruSayisi = parseInt(prog.soru_sayisi) || 0;
            const konu = prog.konu || 'Belirtilmemiş';

            totalSoru += soruSayisi;
            if (prog.durum === 'yapildi') {
              yapildiSoru += soruSayisi;
            }

            if (!topicMap[konu]) {
              topicMap[konu] = { total: 0, yapildi: 0, dogru: 0, yanlis: 0, bos: 0 };
            }
            topicMap[konu].total += soruSayisi;
            if (prog.durum === 'yapildi') {
              topicMap[konu].yapildi += soruSayisi;
            }
            const d = parseInt(prog.dogru) || 0;
            const y = parseInt(prog.yanlis) || 0;
            const b = parseInt(prog.bos) || 0;
            
            topicMap[konu].dogru += d;
            topicMap[konu].yanlis += y;
            topicMap[konu].bos += b;
          });

          // Konu bazlı başarı yüzdelerini hesapla
          Object.keys(topicMap).forEach(k => {
            const t = topicMap[k];
            const totalSolved = t.dogru + t.yanlis + t.bos;
            t.totalSolved = totalSolved;
            t.basariYuzdesi = totalSolved > 0 ? Math.round((t.dogru / totalSolved) * 100) : 0;
            t.yapildiPercent = t.total > 0 ? Math.round((t.yapildi / t.total) * 100) : 0;
          });

          const subjectTotalSolved = Object.values(topicMap).reduce((acc, val) => acc + (val.dogru + val.yanlis + val.bos), 0);
          const subjectTotalDogru = Object.values(topicMap).reduce((acc, val) => acc + val.dogru, 0);
          const basariYuzdesi = subjectTotalSolved > 0 ? Math.round((subjectTotalDogru / subjectTotalSolved) * 100) : 0;

          const yapildiPercent = totalSoru > 0 ? Math.round((yapildiSoru / totalSoru) * 100) : 0;
          stats[subject] = {
            total: totalSoru,
            yapildi: yapildiSoru,
            yapilmadi: totalSoru - yapildiSoru,
            yapildiPercent,
            basariYuzdesi,
            totalSolved: subjectTotalSolved
          };
          dersDetailMap[subject] = topicMap;
        });

        setDersBasariStats(stats);
        setDersDetailTopics(dersDetailMap);
      } else {
        setDersBasariStats({});
      }
    } catch (err) {
      console.error('Öğrenci ders başarı istatistikleri yüklenemedi:', err);
      setDersBasariStats({});
    } finally {
      setDersBasariLoading(false);
    }
  };

  const fetchEtutStats = async (studentId) => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      if (data.success && data.programs) {
        let yapilan = 0;
        let eksikYapildi = 0;
        let yapilmayan = 0;
        let toplam = 0;
        
        data.programs.forEach(prog => {
          toplam++;
          if (prog.durum === 'yapildi') {
            yapilan++;
          } else if (prog.durum === 'eksik_yapildi') {
            eksikYapildi++;
          } else {
            yapilmayan++;
          }
        });
        
        setEtutStats({ yapilan, eksikYapildi, yapilmayan, toplam });
        updateMotivationMessage(yapilan + eksikYapildi, yapilmayan, toplam);
      }
      setEtutStatsLoading(false);
    } catch (error) {
      console.error('Etüt istatistikleri yüklenemedi:', error);
      setEtutStatsLoading(false);
    }
  };

  const updateMotivationMessage = (yapilan, yapilmayan, toplam) => {
    if (toplam > 0 && yapilmayan === 0) {
      setMotivationMessage("Bu hafta tüm görevlerini yaptın! Harika iş! 🎉");
      return;
    }
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (yapilan > 0 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      setMotivationMessage("Bugün 👏");
      return;
    }
    
    if (toplam > 0 && (yapilan / toplam) >= 0.8) {
      setMotivationMessage("Hafta harika gidiyor! Devam et! 💪");
      return;
    }
    
    setMotivationMessage(MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)]);
  };

  const fetchDenemeNetleri = async (studentId) => {
    try {
      let studentAlan = null;
      try {
        const studentData = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_info.php?studentId=${studentId}`);
        if (studentData.success && studentData.student) {
          studentAlan = studentData.student.alan;
        }
      } catch (err) {
        console.error('Öğrenci bilgisi alınamadı:', err);
      }
      
      const genelData = await safeFetchJson(`${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${studentId}`);
      
      if (genelData.success && genelData.denemeler && genelData.denemeler.length > 0) {
        let sonDeneme = genelData.denemeler[0];
        
        if (studentAlan && studentAlan.startsWith('kpss')) {
          const kpssDenemeleri = genelData.denemeler.filter(d => 
            d.sinavTipi && d.sinavTipi.toLowerCase().includes('kpss')
          );
          if (kpssDenemeleri.length > 0) {
            sonDeneme = kpssDenemeleri[0];
          }
        }
        
        let toplamNet = 0;
        let tipAdi = '';
        
        if (sonDeneme.dersSonuclari) {
          Object.values(sonDeneme.dersSonuclari).forEach(ders => {
            toplamNet += ders.net || 0;
          });
        }
        
        if (sonDeneme.sinavTipi) {
          const sinavTipi = sonDeneme.sinavTipi.toLowerCase();
          if (sinavTipi.includes('kpss')) {
            tipAdi = 'KPSS';
          } else if (sinavTipi === 'tyt') {
            tipAdi = 'TYT';
          } else if (sinavTipi === 'ayt') {
            tipAdi = 'AYT';
          } else {
            tipAdi = sonDeneme.sinavTipi.toUpperCase();
          }
        } else {
          tipAdi = 'Genel Deneme';
        }
        
        setDenemeNetleri({
          tip: tipAdi,
          net: toplamNet.toFixed(2),
          tarih: sonDeneme.denemeTarihi,
          denemeAdi: sonDeneme.denemeAdi
        });
        setDenemeLoading(false);
        return;
      }
      
      const bransData = await safeFetchJson(`${API_BASE}/php-backend/api/get_brans_denemeleri.php?studentId=${studentId}`);
      
      if (bransData.success && bransData.denemeler && bransData.denemeler.length > 0) {
        const sonDeneme = bransData.denemeler[0];
        setDenemeNetleri({
          tip: 'Branş',
          net: sonDeneme.net?.toFixed ? sonDeneme.net.toFixed(2) : sonDeneme.net,
          tarih: sonDeneme.denemeTarihi,
          denemeAdi: sonDeneme.denemeAdi,
          ders: sonDeneme.ders
        });
      }
      
      setDenemeLoading(false);
    } catch (error) {
      console.error('Deneme netleri yüklenemedi:', error);
      setDenemeLoading(false);
    }
  };

  // Konu İlerlemesi - Veri çekme
  const fetchKonuIlerlemesi = async () => {
    const studentIdForPayload = student?.id;
    const dersForPayload = (selectedDersForIlerleme || '').trim();
    if (!studentIdForPayload || !dersForPayload) {
      return;
    }
    setKonuIlerlemesiLoading(true);
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_konu_ilerlemesi.php?studentId=${studentIdForPayload}&ders=${encodeURIComponent(dersForPayload)}`
      );
      
      if (data.success && data.konular && data.konular.length > 0) {
        setKonuIlerlemesi(data.konular);
      } else {
        const defaultKonular = Array.from({ length: 10 }, (_, i) => ({
          id: null,
          konu: `Konu ${i + 1}`,
          sira: i + 1,
          durum: 'Konuya Gelinmedi',
          tarih: null,
          kaynaklar: []
        }));
        setKonuIlerlemesi(defaultKonular);
      }
    } catch (err) {
      console.error('Konu ilerlemesi yüklenemedi:', err);
      const defaultKonular = Array.from({ length: 10 }, (_, i) => ({
        id: null,
        konu: `Konu ${i + 1}`,
        sira: i + 1,
        durum: 'Konuya Gelinmedi',
        tarih: null,
        kaynaklar: []
      }));
      setKonuIlerlemesi(defaultKonular);
    } finally {
      setKonuIlerlemesiLoading(false);
    }
  };

  // Konu İlerlemesi - Veri kaydetme
  const saveKonuIlerlemesi = async (silent = false) => {
    const studentIdForPayload = student?.id;
    const dersForPayload = (selectedDersForIlerleme || '').trim();
    if (!studentIdForPayload || !dersForPayload) {
      return;
    }

    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/save_konu_ilerlemesi.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentIdForPayload,
          ders: dersForPayload,
          konular: konuIlerlemesi
        })
      });
      if (data.success) {
        if (!silent) {
          alert('Konu ilerlemesi kaydedildi!');
        }
      } else {
        alert('Kaydetme hatası: ' + (data.message || 'Bilinmeyen hata'));
      }
    } catch (err) {
      console.error('Konu ilerlemesi kaydetme hatası:', err);
      alert('Kaydetme hatası: ' + err.message);
    }
  };

  // Kaynak ekleme
  const handleKaynakEkle = async () => {
    if (!yeniKaynakAdi.trim()) return;
    const konuIndex = konuIlerlemesi.findIndex(k => !k.kaynaklar || k.kaynaklar.length === 0) || 0;
    const newKonular = [...konuIlerlemesi];
    if (newKonular[konuIndex]) {
      const kaynaklar = Array.isArray(newKonular[konuIndex].kaynaklar) ? [...newKonular[konuIndex].kaynaklar] : [];
      kaynaklar.push({
        id: Date.now(),
        kaynak_adi: yeniKaynakAdi.trim(),
        tamamlandi: false
      });
      newKonular[konuIndex] = { ...newKonular[konuIndex], kaynaklar };
      setKonuIlerlemesi(newKonular);
    }
    setYeniKaynakAdi('');
    setShowKaynakEkleModal(false);
    saveKonuIlerlemesi(true);
  };

  // Kaynak tamamlama durumu değiştir
  const handleKaynakToggle = (konuIndex, kaynakIndex) => {
    const newKonular = [...konuIlerlemesi];
    if (newKonular[konuIndex].kaynaklar && newKonular[konuIndex].kaynaklar[kaynakIndex]) {
      newKonular[konuIndex].kaynaklar[kaynakIndex].tamamlandi = !newKonular[konuIndex].kaynaklar[kaynakIndex].tamamlandi;
      setKonuIlerlemesi(newKonular);
      saveKonuIlerlemesi(true);
    }
  };

  // Kaynak silme
  const handleKaynakSil = (konuIndex, kaynakIndex) => {
    const newKonular = [...konuIlerlemesi];
    if (newKonular[konuIndex].kaynaklar) {
      newKonular[konuIndex].kaynaklar.splice(kaynakIndex, 1);
      setKonuIlerlemesi(newKonular);
      saveKonuIlerlemesi(true);
    }
  };

  const calculateYuzde = (kaynaklar) => {
    if (!kaynaklar || kaynaklar.length === 0) return 0;
    const tamamlanan = kaynaklar.filter(k => k.tamamlandi).length;
    return Math.round((tamamlanan / kaynaklar.length) * 100);
  };

  // Branş denemeleri yardımcıları
  const bransNet = useMemo(() => {
    const d = Number(bransDenemeForm.dogru) || 0;
    const y = Number(bransDenemeForm.yanlis) || 0;
    const net = d - y * 0.25;
    return net.toFixed(2);
  }, [bransDenemeForm.dogru, bransDenemeForm.yanlis]);

  // Öğrencinin alanına göre ders listesini belirle
  const bransDersList = useMemo(() => {
    const selectedComp = examComponents.find(c => c.id === bransExamType);
    if (selectedComp && selectedComp.dersler) {
      return selectedComp.dersler;
    }
    if (examComponents.length > 0) {
      return examComponents[0].dersler || [];
    }
    return [];
  }, [bransExamType, examComponents]);

  const handleBransFormChange = (field, value) => {
    setBransDenemeForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'ders') {
        const meta = findSubjectMetaByName(value);
        if (meta && meta.soru_sayisi !== undefined && meta.soru_sayisi !== null) {
          next.soruSayisi = String(meta.soru_sayisi);
        }
      }
      if (field === 'alan') {
        next.ders = '';
        next.soruSayisi = '';
        next.dogru = '';
        next.yanlis = '';
        next.bos = '';
      }
      return next;
    });
    if (field === 'ders') {
      setBransKonuDetayAcik(false);
      setBransKonular([]);
      fetchBransKonular(value);
    }
  };

  const fetchBransKonular = async (dersName) => {
    if (!student?.id || !dersName) {
      setBransKonular([]);
      return;
    }
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_konu_ilerlemesi.php?studentId=${student.id}&ders=${encodeURIComponent(dersName)}`
      );
      if (data.success && data.konular && data.konular.length > 0) {
        const mapped = data.konular
          .slice()
          .sort((a, b) => (a.sira || 0) - (b.sira || 0))
          .map((k, idx) => ({
            ...k,
            dogru: 0,
            yanlis: 0,
            bos: 0,
            sira: k.sira ?? idx + 1
          }));
        setBransKonular(mapped);
      } else {
        const defaults = Array.from({ length: 10 }, (_, i) => ({
          id: null,
          konu: `Konu ${i + 1}`,
          sira: i + 1,
          dogru: 0,
          yanlis: 0,
          bos: 0
        }));
        setBransKonular(defaults);
      }
    } catch (err) {
      console.error('Branş konuları çekilemedi', err);
      const defaults = Array.from({ length: 10 }, (_, i) => ({
        id: null,
        konu: `Konu ${i + 1}`,
        sira: i + 1,
        dogru: 0,
        yanlis: 0,
        bos: 0
      }));
      setBransKonular(defaults);
    }
  };

  const handleBransKonuInputChange = (index, field, value) => {
    const numeric = Math.max(0, Number(value) || 0);
    const updated = [...bransKonular];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: numeric };
      setBransKonular(updated);
    }
  };

  const handleSaveBransDeneme = async () => {
    if (!student?.id) {
      alert('Öğrenci bilgisi bulunamadı');
      return;
    }
    const area = student.alan || '';
    if (!area) {
      alert('Öğrenci alanı belirtilmemiş');
      return;
    }
    if (!bransDenemeForm.ders || !bransDenemeForm.denemeAdi || !bransDenemeForm.denemeTarihi) {
      alert('Ders, deneme adı ve tarih zorunludur');
      return;
    }
    const soru = Number(bransDenemeForm.soruSayisi) || 0;
    const dogru = Number(bransDenemeForm.dogru) || 0;
    const yanlis = Number(bransDenemeForm.yanlis) || 0;
    const bos = Number(bransDenemeForm.bos) || 0;
    if (soru > 0 && dogru + yanlis + bos > soru) {
      alert(
        `Toplam soru sayısı (Doğru + Yanlış + Boş: ${dogru + yanlis + bos}), ders için tanımlanan soru sayısından (${soru}) büyük olamaz.`
      );
      return;
    }
    const payloadKonular = bransKonular.map((k, idx) => {
      const d = Number(k.dogru) || 0;
      const y = Number(k.yanlis) || 0;
      const b = Number(k.bos) || 0;
      const total = d + y + b;
      const basari = total > 0 ? Math.round((d / total) * 100) : 0;
      return {
        konu: k.konu,
        sira: k.sira ?? idx + 1,
        dogru: d,
        yanlis: y,
        bos: b,
        basariYuzde: basari
      };
    });
    setBransKaydediliyor(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/save_brans_deneme.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          alan: area,
          ders: bransDenemeForm.ders,
          denemeAdi: bransDenemeForm.denemeAdi,
          denemeTarihi: bransDenemeForm.denemeTarihi,
          soruSayisi: Number(bransDenemeForm.soruSayisi) || 0,
          dogru: Number(bransDenemeForm.dogru) || 0,
          yanlis: Number(bransDenemeForm.yanlis) || 0,
          bos: Number(bransDenemeForm.bos) || 0,
          net: Number(bransNet) || 0,
          konular: payloadKonular
        })
      });
      if (data.success) {
        alert('Branş denemesi kaydedildi');
        fetchBransDenemeleri();
        setBransView('charts');
      } else {
        alert(data.message || 'Kayıt başarısız');
      }
    } catch (err) {
      console.error('Branş denemesi kaydetme hatası', err);
      alert('Kayıt sırasında hata oluştu');
    } finally {
      setBransKaydediliyor(false);
    }
  };

  // Branş Denemeleri - Veri çekme
  const fetchBransDenemeleri = async () => {
    if (!student?.id) return;
    setBransDenemelerLoading(true);
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_brans_denemeleri.php?studentId=${student.id}`
      );
      if (data.success && data.denemeler) {
        setBransDenemeList(data.denemeler);
        if (data.denemeler.length > 0 && !bransChartsSelectedDers) {
          setBransChartsSelectedDers(data.denemeler[0].ders);
        }
      } else {
        setBransDenemeList([]);
      }
    } catch (err) {
      console.error('Branş denemeleri yüklenemedi:', err);
      setBransDenemeList([]);
    } finally {
      setBransDenemelerLoading(false);
    }
  };

  const bransBasariColor = (yuzde) => {
    const clamped = Math.max(0, Math.min(100, yuzde || 0));
    const red = Math.round(239 - (clamped / 100) * 139); // 239 -> 100
    const green = Math.round(68 + (clamped / 100) * 113); // 68 -> 181
    return `rgb(${red}, ${green}, 68)`;
  };

  const genelNetColor = (net, maxNet) => {
    const denom = maxNet > 0 ? maxNet : 1;
    const ratio = Math.max(0, Math.min(1, net / denom));
    const red = Math.round(239 - ratio * 139); // 239 -> 100
    const green = Math.round(68 + ratio * 113); // 68 -> 181
    return `rgb(${red}, ${green}, 68)`;
  };

  // Branş denemeleri – ders bazlı ortalamalar
  const bransAggregatedByDers = useMemo(() => {
    const dersMap = {};
    bransDenemeList.forEach((d) => {
      const ders = d.ders || 'Bilinmeyen';
      if (!dersMap[ders]) {
        dersMap[ders] = {
          ders,
          denemeSayisi: 0,
          netToplam: 0,
          dogruToplam: 0,
          yanlisToplam: 0,
          bosToplam: 0,
          konular: {}
        };
      }
      const entry = dersMap[ders];
      entry.denemeSayisi += 1;
      entry.netToplam += Number(d.net) || 0;
      entry.dogruToplam += Number(d.dogru) || 0;
      entry.yanlisToplam += Number(d.yanlis) || 0;
      entry.bosToplam += Number(d.bos) || 0;
      // konu bazlı başarı ortalaması
      if (Array.isArray(d.konular)) {
        d.konular.forEach((k) => {
          const konuKey = k.konu || 'Konu';
          if (!entry.konular[konuKey]) {
            entry.konular[konuKey] = { sum: 0, count: 0 };
          }
          entry.konular[konuKey].sum += Number(k.basariYuzde) || 0;
          entry.konular[konuKey].count += 1;
        });
      }
    });
    return Object.values(dersMap).map((entry) => ({
      ders: entry.ders,
      denemeSayisi: entry.denemeSayisi,
      ortNet: entry.denemeSayisi ? parseFloat((entry.netToplam / entry.denemeSayisi).toFixed(2)) : 0,
      ortDogru: entry.denemeSayisi ? parseFloat((entry.dogruToplam / entry.denemeSayisi).toFixed(2)) : 0,
      ortYanlis: entry.denemeSayisi ? parseFloat((entry.yanlisToplam / entry.denemeSayisi).toFixed(2)) : 0,
      ortBos: entry.denemeSayisi ? parseFloat((entry.bosToplam / entry.denemeSayisi).toFixed(2)) : 0,
      konuAverages: Object.entries(entry.konular).map(([konu, agg]) => ({
        konu,
        ortBasari: agg.count ? Math.round(agg.sum / agg.count) : 0
      }))
    }));
  }, [bransDenemeList]);

  const findSubjectMetaByName = (name) => {
    if (!name || !allSubjects || allSubjects.length === 0) return null;
    const normalizedSearch = name.trim().toLowerCase();
    let found = allSubjects.find(
      (s) => (s.ders_adi || '').trim().toLowerCase() === normalizedSearch
    );
    if (!found) {
      const searchWithoutPrefix = normalizedSearch
        .replace(/^(tyt|ayt|lgs|kpss)\s+/i, '')
        .trim();
      found = allSubjects.find((s) => {
        const normalizedDers = (s.ders_adi || '').trim().toLowerCase();
        const dersWithoutPrefix = normalizedDers
          .replace(/^(tyt|ayt|lgs|kpss)\s+/i, '')
          .trim();
        return dersWithoutPrefix === searchWithoutPrefix;
      });
    }
    return found || null;
  };

  // Genel deneme helper fonksiyonları
  const isGenelDenemeDegerlendirmeTamamlandi = () => {
    return genelDenemeDegerlendirme.zamanYeterli !== null &&
           genelDenemeDegerlendirme.odaklanma !== null &&
           genelDenemeDegerlendirme.kaygiDuzeyi !== null &&
           genelDenemeDegerlendirme.enZorlayanDers !== '' &&
           genelDenemeDegerlendirme.kendiniHissediyorsun !== null;
  };

  const handleSaveGenelDeneme = async () => {
    if (!isGenelDenemeDegerlendirmeTamamlandi()) {
      alert('Lütfen deneme sonrası değerlendirmeyi tamamlayın');
      return;
    }
    if (!student?.id) {
      alert('Öğrenci bilgisi bulunamadı');
      return;
    }
    if (!genelDenemeForm.denemeAdi || !genelDenemeForm.denemeTarihi) {
      alert('Deneme adı ve tarihi zorunludur');
      return;
    }

    for (const [ders, data] of Object.entries(genelDenemeDersler)) {
      let soru = Number(data.soruSayisi);
      if (!Number.isFinite(soru) || soru <= 0) {
        const meta = findSubjectMetaByName(ders);
        if (meta && meta.soru_sayisi !== undefined && meta.soru_sayisi !== null) {
          soru = Number(meta.soru_sayisi) || 0;
        } else {
          soru = 0;
        }
      }
      const dogru = Number(data.dogru) || 0;
      const yanlis = Number(data.yanlis) || 0;
      const bos = Number(data.bos) || 0;
      if (soru > 0 && dogru + yanlis + bos > soru) {
        alert(
          `${ders} dersi için girilen toplam sayı (Doğru + Yanlış + Boş: ${
            dogru + yanlis + bos
          }), soru sayısından (${soru}) büyük olamaz!`
        );
        return;
      }
    }

    setGenelDenemeKaydediliyor(true);
    try {
      const dersSonuclari = Object.entries(genelDenemeDersler).map(([ders, data]) => {
        let soruSayisi = Number(data.soruSayisi);
        if (!Number.isFinite(soruSayisi) || soruSayisi <= 0) {
          const meta = findSubjectMetaByName(ders);
          if (meta && meta.soru_sayisi !== undefined && meta.soru_sayisi !== null) {
            soruSayisi = Number(meta.soru_sayisi) || 0;
          } else {
            soruSayisi = 0;
          }
        }
        return {
          ders,
          soruSayisi,
          dogru: Number(data.dogru) || 0,
          yanlis: Number(data.yanlis) || 0,
          bos: Number(data.bos) || 0,
          net: Number(data.net) || 0
        };
      });

      const data = await safeFetchJson(`${API_BASE}/php-backend/api/save_genel_deneme.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          denemeAdi: genelDenemeForm.denemeAdi,
          denemeTarihi: genelDenemeForm.denemeTarihi,
          notlar: genelDenemeForm.notlar || '',
          sinavTipi: (() => {
            const studentAreaRaw = student?.alan || '';
            const studentArea = (studentAreaRaw || '').toLowerCase();
            const isYks = studentArea.startsWith('yks');
            if (!isYks) {
              return studentArea || 'lgs'; // LGS veya diğer alanlar için alan kodunu kullan
            }
            return genelDenemeForm.sinavTipi || 'tyt';
          })(),
          dersSonuclari,
          degerlendirme: genelDenemeDegerlendirme
        })
      });
      if (data.success) {
        alert('Deneme sonucu kaydedildi');
        setGenelDenemeForm({ denemeAdi: '', denemeTarihi: '', notlar: '', sinavTipi: 'tyt' });
        setGenelDenemeDersler({});
        setGenelDenemeDegerlendirme({
          zamanYeterli: null,
          odaklanma: null,
          kaygiDuzeyi: null,
          enZorlayanDers: '',
          kendiniHissediyorsun: null
        });
        setGenelDenemeView(null);
        fetchGenelDenemeler();
      } else {
        alert('Kayıt sırasında hata oluştu: ' + (data.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Genel deneme kaydetme hatası', error);
      alert('Kayıt sırasında hata oluştu');
    } finally {
      setGenelDenemeKaydediliyor(false);
    }
  };

  // TYT ve AYT ortalamalarını hesapla
  const calculateGenelDenemeOrtalamalari = useMemo(() => {
    console.log('=== ORTALAMA HESAPLAMA BAŞLADI ===');
    console.log('genelDenemeList:', genelDenemeList);
    console.log('genelDenemeList type:', typeof genelDenemeList);
    console.log('genelDenemeList length:', genelDenemeList?.length);
    console.log('genelDenemeFilter:', genelDenemeFilter);
    
    if (!genelDenemeList || genelDenemeList.length === 0) {
      console.log('❌ Deneme listesi boş veya undefined');
      const emptyRes = {};
      examComponents.forEach(c => emptyRes[c.id] = 0);
      return emptyRes;
    }
    
    console.log('✅ Deneme listesi dolu, hesaplama yapılıyor...');

    // Filtreye göre denemeleri al
    let filteredDenemeler = [...genelDenemeList];
    if (genelDenemeFilter === 'son-3') {
      filteredDenemeler = filteredDenemeler.slice(0, 3);
    } else if (genelDenemeFilter === 'son-5') {
      filteredDenemeler = filteredDenemeler.slice(0, 5);
    } else if (genelDenemeFilter === 'son-10') {
      filteredDenemeler = filteredDenemeler.slice(0, 10);
    } else if (genelDenemeFilter === 'tum-denemeler') {
      filteredDenemeler = filteredDenemeler;
    } else {
      filteredDenemeler = filteredDenemeler.slice(0, 1);
    }

    const componentStats = {};
    examComponents.forEach(c => {
      componentStats[c.id] = { totalNet: 0, count: 0 };
    });

    filteredDenemeler.forEach((deneme) => {
      const sinavTipi = deneme.sinavTipi;
      if (!componentStats[sinavTipi]) return;

      const dersSonuclari = deneme.dersSonuclari || {};
      const component = examComponents.find(c => c.id === sinavTipi);
      const componentDersler = component ? (component.dersler || []) : [];

      let toplamNet = 0;
      Object.entries(dersSonuclari).forEach(([ders, data]) => {
        if (componentDersler.includes(ders)) {
          let netValue = 0;
          if (data && data.net !== undefined && data.net !== null) {
            netValue = parseFloat(data.net) || 0;
          }
          toplamNet += netValue;
        }
      });

      componentStats[sinavTipi].totalNet += toplamNet;
      componentStats[sinavTipi].count++;
    });

    const results = {};
    examComponents.forEach(c => {
      const stats = componentStats[c.id];
      results[c.id] = stats.count > 0 ? parseFloat((stats.totalNet / stats.count).toFixed(2)) : 0;
    });

    return results;
  }, [genelDenemeList, genelDenemeFilter, examComponents]);

  // Genel Denemeler - Veri çekme
  const fetchGenelDenemeler = async () => {
    if (!student?.id) {
      console.log('❌ fetchGenelDenemeler: student.id yok, student:', student);
      return;
    }
    console.log('🔄 fetchGenelDenemeler başladı, student.id:', student.id);
    setGenelDenemeListLoading(true);
    try {
      const url = `${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${student.id}`;
      console.log('📡 API URL:', url);
      const data = await safeFetchJson(url);
      console.log('📥 fetchGenelDenemeler response:', data);
      if (data.success && data.denemeler) {
        console.log('✅ fetchGenelDenemeler: Denemeler yüklendi, sayı:', data.denemeler.length);
        if (data.denemeler.length > 0) {
          console.log('📊 İlk deneme örneği:', data.denemeler[0]);
          console.log('📊 İlk deneme dersSonuclari:', data.denemeler[0].dersSonuclari);
        }
        setGenelDenemeList(data.denemeler || []);
        console.log('✅ genelDenemeList state güncellendi, yeni length:', data.denemeler.length);
      } else {
        console.log('❌ fetchGenelDenemeler: Başarısız veya deneme yok, data:', data);
        setGenelDenemeList([]);
      }
    } catch (error) {
      console.error('❌ Genel denemeler yüklenemedi', error);
      setGenelDenemeList([]);
    } finally {
      setGenelDenemeListLoading(false);
      console.log('🏁 fetchGenelDenemeler tamamlandı');
    }
  };

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id && user.role === 'ogrenci') {
      try {
        await safeFetchJson(`${API_BASE}/php-backend/api/update_student_online_status.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: user.id, onlineStatus: 0 })
        });
      } catch (error) {
        console.error('Online durum güncellenemedi:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Pasta grafik için yüzde hesaplama
  const etutTotal = etutStats.toplam || (etutStats.yapilan + etutStats.eksikYapildi + etutStats.yapilmayan);
  const yapilanYuzde = etutTotal > 0 ? (etutStats.yapilan / etutTotal) * 100 : 0;
  const eksikYapildiYuzde = etutTotal > 0 ? (etutStats.eksikYapildi / etutTotal) * 100 : 0;
  const yapilmayanYuzde = etutTotal > 0 ? (etutStats.yapilmayan / etutTotal) * 100 : 0;
  
  // Conic gradient için yüzde değerleri ve dinamik gradient oluşturma
  const yapilanEnd = yapilanYuzde;
  const eksikYapildiStart = yapilanEnd;
  const eksikYapildiEnd = eksikYapildiStart + eksikYapildiYuzde;
  const yapilmayanStart = eksikYapildiEnd;
  
  // Dinamik conic-gradient oluştur
  const getConicGradient = () => {
    const parts = [];
    
    if (yapilanYuzde > 0) {
      parts.push(`#10b981 0% ${yapilanEnd}%`);
    }
    
    if (eksikYapildiYuzde > 0) {
      parts.push(`#f59e0b ${eksikYapildiStart}% ${eksikYapildiEnd}%`);
    }
    
    if (yapilmayanYuzde > 0) {
      parts.push(`#ef4444 ${yapilmayanStart}% 100%`);
    }
    
    // Eğer hiçbir değer yoksa, varsayılan renk göster
    if (parts.length === 0) {
      return '#e5e7eb';
    }
    
    return `conic-gradient(${parts.join(', ')})`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Yükleniyor...</div>
      </div>
    );
  }

  // Ana Sayfa içeriği
  const renderAnaSayfa = () => (
    <div style={{ padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 100px)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Hoş Geldin ve Motivasyon */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 700 }}>
            Hoş Geldin, {student?.firstName || 'Öğrenci'}! 👋
          </h2>
          <p style={{ margin: 0, fontSize: '18px', opacity: 0.95 }}>
            {motivationMessage}
          </p>
        </div>

        {/* Grid Layout: Geri Sayım, Etüt Grafiği, Deneme Netleri */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Sınav Geri Sayım */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '48px', color: '#6a1b9a', marginBottom: '16px' }} />
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>
              {examCountdown.examName ? `${examCountdown.examName} Sınavına` : 'Sınav Geri Sayım'}
            </div>
            <div style={{ fontSize: '56px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
              {examCountdown.days}
            </div>
            <div style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>
              Gün Kaldı
            </div>
          </div>

          {/* Etüt Grafiği (Pasta) */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <FontAwesomeIcon icon={faChartPie} style={{ fontSize: '48px', color: '#10b981', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
              Bu Hafta Etütler
            </div>
            {etutStatsLoading ? (
              <div style={{ color: '#6b7280' }}>Yükleniyor...</div>
            ) : (
              <>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%',
                  background: getConicGradient(),
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111827'
                  }}>
                    {etutTotal}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ color: '#6b7280' }}>Yapılan: {etutStats.yapilan}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                    <span style={{ color: '#6b7280' }}>Eksik Yapıldı: {etutStats.eksikYapildi}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                    <span style={{ color: '#6b7280' }}>Yapılmayan: {etutStats.yapilmayan}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Deneme Netleri */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              Son Deneme Neti
            </div>
            {denemeLoading ? (
              <div style={{ color: '#6b7280' }}>Yükleniyor...</div>
            ) : denemeNetleri ? (
              <>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                  {denemeNetleri.net}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                  {denemeNetleri.tip} {denemeNetleri.ders ? `- ${denemeNetleri.ders}` : ''}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  {denemeNetleri.denemeAdi}
                </div>
              </>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                Henüz deneme sonucu yok
              </div>
            )}
          </div>
        </div>

        {/* Okunmamış Bildirimler */}
        <div style={{ 
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#f0f9ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <FontAwesomeIcon icon={faBell} style={{ fontSize: '20px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                Okunmamış Bildirimler
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Öğretmeninden gelen son bildirimler
              </p>
            </div>
            {unreadNotifications.length > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: 'white', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '14px', 
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}>
                {unreadNotifications.length} Yeni
              </span>
            )}
          </div>
          
          {unreadNotificationsLoading ? (
             <div style={{ color: '#6b7280', textAlign: 'center', padding: '32px' }}>Bildirimler yükleniyor...</div>
          ) : unreadNotifications.length === 0 ? (
             <div style={{ color: '#9ca3af', textAlign: 'center', padding: '32px', fontSize: '15px', background: '#f9fafb', borderRadius: '12px' }}>
               Okunmamış bildiriminiz bulunmuyor.
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {unreadNotifications.map((notification) => (
                <div key={notification.id} style={{ 
                  padding: '20px', 
                  background: '#ffffff', 
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start'
                }} 
                className="dashboard-notification-item"
                onClick={() => setActiveMenu('bildirimler')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#0284c7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
                >
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: '#ef4444', 
                    marginTop: '6px',
                    flexShrink: 0
                  }}></div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                        {notification.title}
                      </h4>
                      <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px' }}>
                        {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', lineHeight: '1.5' }}>
                      {notification.message}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', color: '#9ca3af' }}>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="ogretmen-panel">
      {/* Sol Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">
              <FontAwesomeIcon icon={faBook} />
            </div>
            <span className="logo-text">KoçApp</span>
          </div>
          <div className="user-role">Öğrenci</div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">
            <FontAwesomeIcon icon={faSignOutAlt} />
          </span>
          Çıkış Yap
        </button>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="main-content">
        <div className="content-area">
          {activeMenu === 'ana-sayfa' && renderAnaSayfa()}
          {activeMenu === 'bildirimler' && student && (
             <div style={{ padding: '32px' }}>
                <Bildirimler
                  studentId={student.id}
                  userRole="student"
                  filter="student"
                />
             </div>
          )}
          {activeMenu === 'plan-program' && student && (
            <OgrenciProgramTab student={student} teacherId={null} isStudentPanel={true} />
          )}

          {/* Yeni sekme: Soru/Süre/Konu Dağılımı */}
          {activeMenu === 'gunluk-soru' && student && (
            <div className="gunluk-soru-content">
              {/* Günlük Soru Kartları */}
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faStickyNote} />
                  </div>
                  <div className="card-content">
                    <h3>Bugün Çözülmesi Gereken</h3>
                    <div className="card-number">{questionStatsLoading ? '...' : questionStats.todayRequired}</div>
                    <div className="card-subtitle">Bugün için atanan sorular</div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div className="card-content">
                    <h3>Bu Hafta Çözülmesi Gereken Sorular</h3>
                    <div className="card-number">{questionStatsLoading ? '...' : questionStats.weekRequired}</div>
                    <div className="card-subtitle">Bu hafta toplam atanan</div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <div className="card-content">
                    <h3>Bu Hafta Bekleyen Sorular</h3>
                    <div className="card-number">{questionStatsLoading ? '...' : questionStats.weekPending}</div>
                    <div className="card-subtitle">Çözülmeyi bekliyor</div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faBullseye} />
                  </div>
                  <div className="card-content">
                    <h3>Bugüne Kadar Toplam Çözülen Soru</h3>
                    <div className="card-number">{questionStatsLoading ? '...' : questionStats.totalSolved}</div>
                    <div className="card-subtitle">Toplam çözülen soru sayısı</div>
                  </div>
                </div>
              </div>

              {/* Tab Sistemi */}
              <div className="tabs-section">
                <div className="tabs">
                  <button 
                    className={`tab ${activeQuestionTab === 'konu-dagilimi' ? 'active' : ''}`}
                    onClick={() => setActiveQuestionTab('konu-dagilimi')}
                  >
                    Konu Dağılımı
                  </button>
                  <button 
                    className={`tab ${activeQuestionTab === 'soru-dagilimi' ? 'active' : ''}`}
                    onClick={() => setActiveQuestionTab('soru-dagilimi')}
                  >
                    Soru Dağılımı
                  </button>
                  <button 
                    className={`tab ${activeQuestionTab === 'sure-dagilimi' ? 'active' : ''}`}
                    onClick={() => setActiveQuestionTab('sure-dagilimi')}
                  >
                    Süre Dağılımı
                  </button>
                </div>
              </div>

              {/* Soru Dağılımı Sekmesi */}
              {activeQuestionTab === 'soru-dagilimi' && (
                <div className="dagilim-sekmesi" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                  {!selectedQuestionExamArea ? (
                    // Sınav seçimi
                    <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                      <div style={{marginBottom: 32}}>
                        <h3 style={{fontSize: '24px', fontWeight: 700, marginBottom: 8, color: '#1f2937'}}>
                          Sınav Seçin
                        </h3>
                        <p style={{fontSize: '14px', color: '#6b7280'}}>
                          Analiz yapmak istediğin sınavı seç
                        </p>
                      </div>
                      
                      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                        {examComponentsLoading ? (
                          <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>Yükleniyor...</div>
                        ) : examComponents.length > 0 ? (
                          <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                            <h4 style={{fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                              <span style={{width: 4, height: 24, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', borderRadius: 2}}></span>
                              {student?.alanName || 'Sınav'}
                            </h4>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                              {examComponents.map((comp) => (
                                <button
                                  key={comp.id}
                                  onClick={() => {
                                    setSelectedQuestionExamArea(comp.id);
                                    setQuestionDistributionPeriod('gunluk');
                                    fetchQuestionDistributionStatsForStudent();
                                  }}
                                  style={{
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #f9fafb, #ffffff)',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {comp.ad}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
                            Sınav alanı bulunamadı. Lütfen profilinizden sınav alanınızı kontrol edin.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Zaman periyodu ve ders bazlı dağılım
                    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                      {/* Zaman Periyodu Sekmeleri */}
                      <div style={{display: 'flex', gap: 12, marginBottom: 32, background: 'white', padding: 8, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                        {['gunluk','haftalik','aylik','tum-zamanlar'].map(period => {
                          const labels = {
                            'gunluk': 'Günlük Çözülen Soru Dağılımı',
                            'haftalik': 'Haftalık Çözülen Soru Dağılımı',
                            'aylik': 'Aylık Çözülen Soru Dağılımı',
                            'tum-zamanlar': 'Tüm Zamanlar Çözülen Soru Dağılımı'
                          };
                          return (
                            <button
                              key={period}
                              onClick={() => {
                                setQuestionDistributionPeriod(period);
                                fetchQuestionDistributionStatsForStudent();
                              }}
                              style={{
                                flex: 1,
                                padding: '12px 20px',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: questionDistributionPeriod === period ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                                color: questionDistributionPeriod === period ? 'white' : '#6b7280'
                              }}
                            >
                              {labels[period]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Ders Bazlı Soru Dağılımı */}
                      {questionDistributionLoading ? (
                        <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                          <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                          <div style={{fontSize: '14px', color: '#9ca3af'}}>Veriler hazırlanıyor</div>
                        </div>
                      ) : Object.keys(questionDistributionStats).length === 0 ? (
                        <div style={{background: 'white', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6b7280', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                          <p style={{fontSize: '16px'}}>
                            {questionDistributionPeriod === 'gunluk' && 'Bugün için soru bulunmuyor.'}
                            {questionDistributionPeriod === 'haftalik' && 'Bu hafta için soru bulunmuyor.'}
                            {questionDistributionPeriod === 'aylik' && 'Bu ay için soru bulunmuyor.'}
                            {questionDistributionPeriod === 'tum-zamanlar' && 'Henüz soru bulunmuyor.'}
                          </p>
                        </div>
                      ) : (
                        <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32}}>
                            <button
                              onClick={() => {
                                setSelectedQuestionExamArea(null);
                                setQuestionDistributionPeriod('gunluk');
                                setQuestionDistributionStats({});
                              }}
                              style={{
                                padding: '10px 16px',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#6b7280',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              ← Geri
                            </button>
                            <h3 style={{fontSize: '22px', fontWeight: 700, color: '#1f2937', letterSpacing: '-0.5px'}}>
                              {(() => {
                                const component = examComponents.find(c => c.id === selectedQuestionExamArea);
                                if (component) return `${component.ad} Soru Dağılımı`;
                                
                                // Geriye dönük uyumluluk için eski kontrol
                                if (selectedQuestionExamArea === 'tyt') return 'TYT Soru Dağılımı';
                                if (selectedQuestionExamArea === 'ayt') return 'AYT Soru Dağılımı';
                                return EXAM_CATEGORY_OPTIONS.flatMap(g => g.options).find(o => o.value === selectedQuestionExamArea)?.label || 'Soru Dağılımı';
                              })()}
                            </h3>
                          </div>

                          {/* Ders Bazlı Bar Grafikleri */}
                          <div style={{display: 'flex', gap: 32, minHeight: '450px', padding: '40px 20px', position: 'relative'}}>
                            <div style={{flex: 1, display: 'flex', alignItems: 'flex-end', gap: 24, justifyContent: 'center'}}>
                              {(() => {
                                const component = examComponents.find(c => c.id === selectedQuestionExamArea);
                                const componentSubjects = component ? (component.dersler || []) : [];
                                
                                const filteredStats = Object.entries(questionDistributionStats)
                                  .filter(([subject, stats]) => stats.yapildi > 0 && componentSubjects.includes(subject));
                                
                                if (filteredStats.length === 0) {
                                  return (
                                    <div style={{
                                      width: '100%',
                                      textAlign: 'center',
                                      padding: '80px 20px',
                                      color: '#6b7280',
                                      fontSize: '16px'
                                    }}>
                                      <div style={{fontSize: '48px', marginBottom: 16, opacity: 0.5}}>📊</div>
                                      <div style={{fontWeight: 600, marginBottom: 8}}>Henüz yapılan soru bulunmuyor</div>
                                      <div style={{fontSize: '14px', color: '#9ca3af'}}>Soru çözdükçe burada dağılımı göreceksin.</div>
                                    </div>
                                  );
                                }

                                return filteredStats
                                  .sort((a, b) => b[1].yapildi - a[1].yapildi)
                                  .map(([subject, stats]) => {
                                    const maxValue = Math.max(...filteredStats.map(s => s[1].yapildi || 0), 1);
                                    const maxBarHeight = 300;
                                    const actualBarHeight = maxValue > 0 ? (stats.yapildi / maxValue) * maxBarHeight : 0;
                                    
                                    return (
                                      <div key={subject} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: '120px'}}>
                                        <div style={{fontSize: 14, fontWeight: 600, color: '#111827', textAlign: 'center'}}>
                                          {subject}
                                        </div>
                                        <div style={{position: 'relative', height: maxBarHeight, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                                          <div style={{
                                            width: '40px',
                                            height: `${Math.max(actualBarHeight, 4)}px`,
                                            borderRadius: '0',
                                            background: 'linear-gradient(180deg, #6a1b9a, #8e24aa)',
                                            boxShadow: '0 8px 20px rgba(106,27,154,0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                          }}>
                                            <div style={{
                                              position: 'absolute',
                                              top: 0,
                                              left: '50%',
                                              transform: 'translateX(-50%)',
                                              background: 'white',
                                              borderRadius: 0,
                                              padding: '4px 8px',
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: '#6a1b9a',
                                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                            }}>
                                              {stats.yapildi} soru
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  });
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Konu Dağılımı Sekmesi (öğretmen paneli ile aynı yapı) */}
              {activeQuestionTab === 'konu-dagilimi' && (
                <div className="dagilim-sekmesi" style={{padding: '16px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                  {topicStatsLoading ? (
                    <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                      <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                      <div style={{fontSize: '14px', color: '#9ca3af'}}>Veriler hazırlanıyor</div>
                    </div>
                  ) : !selectedExamArea ? (
                    <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                      <div style={{marginBottom: 32}}>
                        <h3 style={{fontSize: '24px', fontWeight: 700, marginBottom: 8, color: '#1f2937'}}>
                          Sınav Seçin
                        </h3>
                        <p style={{fontSize: '14px', color: '#6b7280'}}>
                          Analiz yapmak istediğin sınavı seç
                        </p>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                        {examComponentsLoading ? (
                          <div style={{color: '#6b7280', fontSize: '14px', padding: '10px'}}>Sınav bileşenleri yükleniyor...</div>
                        ) : examComponents.length > 0 ? (
                          <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                            <h4 style={{fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                              <span style={{width: 4, height: 24, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', borderRadius: 2}}></span>
                              {student?.alanName || 'Sınav'}
                            </h4>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                              {examComponents.map((comp) => (
                                <button
                                  key={comp.id}
                                  onClick={() => {
                                    setSelectedExamArea(comp.id);
                                    setSelectedSubject(null);
                                    setTopicStats({});
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = '#6a1b9a';
                                    e.currentTarget.style.color = '#6a1b9a';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(106, 27, 154, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                  style={{
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #f9fafb, #ffffff)',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                >
                                  {comp.ad}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{color: '#ef4444', fontSize: '14px', padding: '10px'}}>Bu alan için sınav bileşeni tanımlanmamış.</div>
                        )}
                      </div>
                    </div>
                  ) : !selectedSubject ? (
                    <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32}}>
                        <button
                          onClick={() => {
                            setSelectedExamArea(null);
                            setSelectedSubject(null);
                            setTopicStats({});
                          }}
                          style={{
                            padding: '10px 16px',
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#6b7280'
                          }}
                        >
                          ← Geri
                        </button>
                        <div>
                          <h3 style={{fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: 4}}>
                            {examComponents.find(c => c.id === selectedExamArea)?.ad || 'Konu Dağılımı'}
                          </h3>
                          <p style={{fontSize: '14px', color: '#6b7280'}}>Ders seçerek konu analizine başlayın</p>
                        </div>
                      </div>
                      
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16}}>
                        {getDersList(selectedExamArea).map((subject) => {
                          const hasPrograms = allPrograms.some(prog => prog.ders === subject);
                          const iconSrc = resolveIconUrl(getExamSubjectIconUrl(selectedExamArea, subject)) || getSubjectIcon(subject, allSubjects);
                          return (
                            <button
                              key={subject}
                              onClick={() => setSelectedSubject(subject)}
                              disabled={!hasPrograms}
                              style={{
                                padding: '20px',
                                background: hasPrograms ? 'linear-gradient(135deg, #ffffff, #f9fafb)' : '#f9fafb',
                                border: `2px solid ${hasPrograms ? '#8e24aa' : '#e5e7eb'}`,
                                borderRadius: 14,
                                textAlign: 'center',
                                cursor: hasPrograms ? 'pointer' : 'not-allowed',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: hasPrograms ? '#374151' : '#9ca3af',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: hasPrograms ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                opacity: hasPrograms ? 1 : 0.6
                              }}
                            >
                              {(() => {
                                return iconSrc ? (
                                  <img 
                                    src={iconSrc} 
                                    alt="" 
                                    style={{ width: 36, height: 36, objectFit: 'contain', marginBottom: 8 }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : null;
                              })()}
                              {subject}
                              {!hasPrograms && (
                                <div style={{fontSize: '12px', marginTop: 8, color: '#9ca3af', fontWeight: 400}}>
                                  (Program yok)
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Konu listesi ve barlar
                    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0', background: '#fafafa', minHeight: '500px'}}>
                      <div style={{display: 'flex', gap: 20, marginBottom: 8, flexWrap: 'wrap', alignItems: 'flex-end'}}>
                        <button
                          onClick={() => {
                            setSelectedSubject(null);
                            setTopicStats({});
                          }}
                          style={{
                            padding: '10px 16px',
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#6b7280'
                          }}
                        >
                          ← Ders Değiştir
                        </button>
                        <div>
                          <h3 style={{fontSize: '22px', fontWeight: 700, color: '#1f2937', margin: 0}}>
                            {selectedSubject}
                          </h3>
                          <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                            Konu bazlı başarı dağılımı
                          </p>
                        </div>
                      </div>

                      {Object.keys(topicStats || {}).length === 0 ? (
                        <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                          <div style={{fontSize: '18px', marginBottom: 12}}>Veri bulunamadı</div>
                          <div style={{fontSize: '14px', color: '#9ca3af'}}>Bu ders için konu verisi yok.</div>
                        </div>
                      ) : (
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16}}>
                          {Object.entries(topicStats)
                            .sort((a, b) => (b[1].basariYuzdesi || 0) - (a[1].basariYuzdesi || 0))
                            .map(([konu, stats]) => {
                              const topicPercent = stats.basariYuzdesi || 0;
                              const topicColor = topicPercent >= 75 ? '#10b981' : topicPercent >= 50 ? '#f59e0b' : '#ef4444';
                              return (
                                <div key={konu} style={{background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
                                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                                    <h4 style={{fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0}}>{konu}</h4>
                                    <span style={{fontSize: '18px', fontWeight: 700, color: topicColor}}>%{topicPercent}</span>
                                  </div>
                                  <div style={{width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 12}}>
                                    <div style={{width: `${topicPercent}%`, height: '100%', background: topicColor, transition: 'width 0.3s ease'}} />
                                  </div>
                                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280'}}>
                                    <span>Çözülen: <strong style={{color: '#10b981'}}>{stats.totalSolved}</strong></span>
                                    <span>Verilen: <strong style={{color: '#1f2937'}}>{stats.total}</strong></span>
                                  </div>
                                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginTop: 8}}>
                                    <span>Doğru: <strong style={{color: '#065f46'}}>{stats.dogru || 0}</strong></span>
                                    <span>Yanlış: <strong style={{color: '#b91c1c'}}>{stats.yanlis || 0}</strong></span>
                                    <span>Boş: <strong style={{color: '#374151'}}>{stats.bos || 0}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Süre Dağılımı Sekmesi (öğretmen paneli ile aynı yapı) */}
              {activeQuestionTab === 'sure-dagilimi' && (
                <div className="dagilim-sekmesi" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                  {timeDistributionLoading ? (
                    <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                      <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                      <div style={{fontSize: '14px', color: '#9ca3af'}}>Veriler hazırlanıyor</div>
                    </div>
                  ) : (
                    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 20}}>
                        {/* Haftalık Günlük Toplam Etüt Süresi */}
                        <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                          <h3 style={{fontSize: '22px', fontWeight: 700, marginBottom: 24, color: '#1f2937', letterSpacing: '-0.5px'}}>
                            Haftalık Günlük Toplam Etüt Süresi
                          </h3>
                          <div style={{display: 'flex', gap: 8, marginBottom: 24, background: '#f3f4f6', padding: 6, borderRadius: 12}}>
                            {['prev','current','next'].map(period => {
                              const labels = { prev: 'Önceki Hafta', current: 'Bu Hafta', next: 'Sonraki Hafta' };
                              return (
                                <button
                                  key={period}
                                  onClick={() => setSelectedWeeklyPeriod(period)}
                                  style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: selectedWeeklyPeriod === period ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                                    color: selectedWeeklyPeriod === period ? 'white' : '#6b7280'
                                  }}
                                >
                                  {labels[period]}
                                </button>
                              );
                            })}
                          </div>

                          <div style={{display: 'flex', alignItems: 'flex-end', gap: 16, minHeight: '350px', paddingTop: 40, paddingBottom: 20}}>
                            {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => {
                              const currentData = timeDistributionStats.weeklyDaily?.[selectedWeeklyPeriod] || {};
                              const hours = currentData[day] || 0;
                              const allValues = Object.values(currentData);
                              const maxHours = Math.max(...(allValues.length > 0 ? allValues : [1]), 1);
                              const barHeight = maxHours > 0 ? (hours / maxHours) * 280 : 0;
                              
                              return (
                                <div key={day} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
                                  <div style={{fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: 12, minHeight: '24px', display: 'flex', alignItems: 'center'}}>
                                    {hours > 0 ? `${hours.toFixed(1)}s` : '0s'}
                                  </div>
                                  <div 
                                    style={{
                                      width: '100%',
                                      height: `${barHeight}px`,
                                      minHeight: hours > 0 ? '40px' : '0',
                                      background: 'linear-gradient(180deg, #8e24aa, #6a1b9a)',
                                      borderRadius: '8px 8px 0 0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: barHeight > 50 ? '14px' : '12px',
                                      fontWeight: 700,
                                      boxShadow: '0 2px 8px rgba(142, 36, 170, 0.3)',
                                      transition: 'all 0.2s'
                                    }}
                                    title={`${day}: ${hours.toFixed(1)} saat`}
                                  >
                                    {barHeight > 50 && hours > 0 && `${hours.toFixed(1)}s`}
                                  </div>
                                  <div style={{fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'center', padding: '12px 4px 0', lineHeight: '1.4', minHeight: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center'}}>
                                    {day}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Haftalık Toplam Etüt Süresi */}
                        <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                          <h3 style={{fontSize: '22px', fontWeight: 700, marginBottom: 32, color: '#1f2937', letterSpacing: '-0.5px'}}>
                            Haftalık Toplam Etüt Süresi
                          </h3>

                          {timeDistributionStats.weekly.length === 0 ? (
                            <div style={{padding: '60px', textAlign: 'center', color: '#6b7280'}}>
                              <p style={{fontSize: '16px'}}>Henüz haftalık veri bulunmuyor.</p>
                            </div>
                          ) : (
                            <div style={{display: 'flex', alignItems: 'flex-end', gap: 12, minHeight: '350px', paddingTop: 40, paddingBottom: 20, overflowX: 'auto'}}>
                              {timeDistributionStats.weekly.map((weekData) => {
                                const maxHours = Math.max(...timeDistributionStats.weekly.map(w => w.totalHours), 1);
                                const barHeight = maxHours > 0 ? (weekData.totalHours / maxHours) * 280 : 0;
                                
                                return (
                                  <div key={weekData.week} style={{flex: '0 0 auto', width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
                                    <div style={{fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: 12, minHeight: '24px', display: 'flex', alignItems: 'center', textAlign: 'center'}}>
                                      {weekData.totalHours > 0 ? `${weekData.totalHours.toFixed(1)}s` : '0s'}
                                    </div>
                                    <div 
                                      style={{
                                        width: '100%',
                                        height: `${barHeight}px`,
                                        minHeight: weekData.totalHours > 0 ? '40px' : '0',
                                        background: 'linear-gradient(180deg, #10b981, #059669)',
                                        borderRadius: '8px 8px 0 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: barHeight > 50 ? '12px' : '10px',
                                        fontWeight: 700,
                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                        transition: 'all 0.2s'
                                      }}
                                      title={`${weekData.week}. Hafta: ${weekData.totalHours.toFixed(1)} saat`}
                                    >
                                      {barHeight > 50 && weekData.totalHours > 0 && `${weekData.totalHours.toFixed(1)}s`}
                                    </div>
                                    <div style={{fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'center', padding: '12px 4px 0', lineHeight: '1.4', minHeight: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center'}}>
                                      {weekData.week}. Hafta
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profilim */}
          {activeMenu === 'profil' && student && (
            <div style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
              <div style={{maxWidth: '900px', margin: '0 auto'}}>
                <h2 style={{fontSize: 28, fontWeight: 700, margin: '0 0 24px 0', color: '#111827'}}>Profilim</h2>

                <form
                  onSubmit={handleProfileSave}
                  className="profile-update-form"
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}
                >
                  {profileError && (
                    <div style={{padding: 10, borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: 14}}>
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div style={{padding: 10, borderRadius: 8, background: '#ecfdf3', color: '#065f46', fontSize: 14}}>
                      {profileSuccess}
                    </div>
                  )}

                  <div style={{display: 'flex', gap: 24, flexWrap: 'wrap'}}>
                    <div style={{flex: '0 0 160px', textAlign: 'center'}}>
                      <div style={{marginBottom: 12, fontWeight: 600, color: '#374151'}}>Profil Fotoğrafı</div>
                      <div style={{marginBottom: 12}}>
                        {profileForm.profilePhoto ? (
                          <img
                            src={profileForm.profilePhoto}
                            alt="Profil"
                            style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb'}}
                          />
                        ) : (
                          <div style={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 40,
                            fontWeight: 700
                          }}>
                            {(profileForm.firstName || 'O')[0]}
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        style={{fontSize: 12}}
                      />
                    </div>

                    <div style={{flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16}}>
                      <div>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Ad</label>
                        <input
                          name="firstName"
                          value={profileForm.firstName}
                          onChange={handleProfileChange}
                          required
                          style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Soyad</label>
                        <input
                          name="lastName"
                          value={profileForm.lastName}
                          onChange={handleProfileChange}
                          required
                          style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>E-posta</label>
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          required
                          style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Telefon</label>
                        <input
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Sınıf</label>
                        <input
                          name="className"
                          value={profileForm.className}
                          readOnly
                          style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#6b7280'}}
                        />
                        <div style={{fontSize: 11, color: '#9ca3af', marginTop: 4}}>
                          Bu alanı sadece öğretmenin değiştirebilir.
                        </div>
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Alan</label>
                        <input
                          name="alan"
                          value={profileForm.alan}
                          readOnly
                          style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#6b7280'}}
                        />
                        <div style={{fontSize: 11, color: '#9ca3af', marginTop: 4}}>
                          Bu alanı sadece öğretmenin değiştirebilir.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{marginTop: 8, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16}}>
                    <div>
                      <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Yeni Şifre</label>
                      <input
                        type="password"
                        name="newPassword"
                        autoComplete="new-password"
                        value={profileForm.newPassword}
                        onChange={handleProfileChange}
                        placeholder="Değiştirmek istemiyorsan boş bırak"
                        style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db'}}
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        name="newPasswordConfirm"
                        autoComplete="new-password"
                        value={profileForm.newPasswordConfirm}
                        onChange={handleProfileChange}
                        style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db'}}
                      />
                    </div>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 16}}>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 9999,
                        border: 'none',
                        background: profileSaving ? '#9ca3af' : 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
                        color: 'white',
                        fontWeight: 700,
                        cursor: profileSaving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(106,27,154,0.3)'
                      }}
                    >
                      {profileSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Yeni sekme: Ders/Konu Bazlı Başarım */}
          {activeMenu === 'ders-basari' && student && (
            <div className="ders-basari-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
              {dersBasariLoading ? (
                <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                  <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                  <div style={{fontSize: '14px', color: '#9ca3af'}}>Veriler hazırlanıyor</div>
                </div>
              ) : (
                <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32}}>
                    <h2 style={{fontSize: '28px', fontWeight: 700, color: '#1f2937', letterSpacing: '-0.5px', margin: 0}}>
                      Ders/Konu Bazlı Başarım
                    </h2>

                    {/* Dinamik Sınav Bileşenleri Sekmeleri */}
                    {examComponents.length > 1 && (
                      <div style={{display: 'flex', gap: 8, background: 'white', padding: 4, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                        {examComponents.map((comp) => (
                          <button 
                            key={comp.id}
                            onClick={() => setDersBasariExamType(comp.id)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: 8,
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: dersBasariExamType === comp.id ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                              color: dersBasariExamType === comp.id ? 'white' : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (dersBasariExamType !== comp.id) {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.color = '#374151';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (dersBasariExamType !== comp.id) {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            {comp.ad}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {Object.keys(dersBasariStats).length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '80px 20px',
                      color: '#6b7280',
                      fontSize: '16px'
                    }}>
                      <div style={{fontSize: '48px', marginBottom: 16, opacity: 0.5}}>📚</div>
                      <div style={{fontWeight: 600, marginBottom: 8}}>Henüz ders verisi bulunmuyor</div>
                      <div style={{fontSize: '14px', color: '#9ca3af'}}>Program oluştukça burada görünecek</div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 24
                    }}>
                      {Object.entries(dersBasariStats).map(([ders, stats]) => {
                        const iconSrc = getSubjectIcon(ders, allSubjects);
                        const yapildiPercent = stats.yapildiPercent;
                        const hasProgram = stats.total > 0;
                        const progressColor = hasProgram 
                          ? (yapildiPercent >= 75 ? '#10b981' : yapildiPercent >= 50 ? '#f59e0b' : '#ef4444')
                          : '#9ca3af';

                        return (
                          <div
                            key={ders}
                            style={{
                              background: 'white',
                              borderRadius: 16,
                              padding: 24,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                            }}
                          >
                            {/* Ders Görseli ve Adı */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                              marginBottom: 20
                            }}>
                              {iconSrc && (
                                <img
                                  src={iconSrc}
                                  alt={ders}
                                  style={{
                                    width: 56,
                                    height: 56,
                                    objectFit: 'contain',
                                    borderRadius: 8
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div style={{flex: 1}}>
                                <h3 style={{
                                  fontSize: '18px',
                                  fontWeight: 700,
                                  color: '#1f2937',
                                  margin: 0,
                                  lineHeight: 1.3
                                }}>
                                  {ders}
                                </h3>
                              </div>
                            </div>

                            {/* Yapıldı/Yapılmadı Yüzdesi */}
                            <div style={{marginBottom: 20}}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                              }}>
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#6b7280'
                                }}>
                                  Başarı Oranı
                                </span>
                                <span style={{
                                  fontSize: '20px',
                                  fontWeight: 700,
                                  color: progressColor
                                }}>
                                  {hasProgram ? `%${yapildiPercent}` : '-'}
                                </span>
                              </div>
                              <div style={{
                                width: '100%',
                                height: 8,
                                background: '#e5e7eb',
                                borderRadius: 4,
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${yapildiPercent}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${progressColor}, ${progressColor}dd)`,
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 8,
                                fontSize: '12px',
                                color: '#9ca3af'
                              }}>
                                {hasProgram ? (
                                  <>
                                    <span>Yapıldı: {stats.yapildi}</span>
                                    <span>Toplam: {stats.total}</span>
                                  </>
                                ) : (
                                  <span style={{fontStyle: 'italic', width: '100%', textAlign: 'center'}}>
                                    Henüz program verilmemiş
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Detaylar Butonu */}
                            <button
                              onClick={() => {
                                setSelectedDersForDetail(ders);
                                setShowDersDetailModal(true);
                              }}
                              disabled={!hasProgram}
                              style={{
                                width: '100%',
                                padding: '12px 20px',
                                background: hasProgram 
                                  ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)'
                                  : '#e5e7eb',
                                color: hasProgram ? 'white' : '#9ca3af',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: hasProgram ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                opacity: hasProgram ? 1 : 0.6
                              }}
                              onMouseEnter={(e) => {
                                if (hasProgram) {
                                  e.target.style.background = 'linear-gradient(135deg, #8e24aa, #ab47bc)';
                                  e.target.style.transform = 'scale(1.02)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasProgram) {
                                  e.target.style.background = 'linear-gradient(135deg, #6a1b9a, #8e24aa)';
                                  e.target.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {hasProgram ? 'Detaylar' : 'Program Yok'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Ders Detay Modal */}
              {showDersDetailModal && selectedDersForDetail && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: 20
                  }}
                  onClick={() => {
                    setShowDersDetailModal(false);
                    setSelectedDersForDetail(null);
                  }}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: 16,
                      width: '90%',
                      maxWidth: '800px',
                      maxHeight: '90vh',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}>
                      <div>
                        <h3 style={{margin: 0, fontSize: 20, fontWeight: 700, color: '#111827'}}>
                          {selectedDersForDetail} - Konu Detayları
                        </h3>
                        <p style={{margin: 0, marginTop: 4, fontSize: 13, color: '#6b7280'}}>
                          Bu derse ait programlanan konuların performans dağılımı
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowDersDetailModal(false);
                          setSelectedDersForDetail(null);
                        }}
                        style={{
                          border: 'none',
                          background: '#f3f4f6',
                          borderRadius: 9999,
                          padding: '8px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        Kapat
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div style={{
                      padding: '32px',
                      overflowY: 'auto',
                      flex: 1
                    }}>
                      {dersDetailTopics[selectedDersForDetail] && Object.keys(dersDetailTopics[selectedDersForDetail]).length > 0 ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16
                        }}>
                          {Object.entries(dersDetailTopics[selectedDersForDetail])
                            .sort((a, b) => (b[1].basariYuzdesi || 0) - (a[1].basariYuzdesi || 0))
                            .map(([konu, topicStats]) => {
                              const topicPercent = topicStats.basariYuzdesi || 0;
                              const topicColor = topicPercent >= 75 ? '#10b981' : topicPercent >= 50 ? '#f59e0b' : '#ef4444';
                              
                              return (
                                <div
                                  key={konu}
                                  style={{
                                    background: '#f9fafb',
                                    borderRadius: 12,
                                    padding: 20,
                                    border: '1px solid #e5e7eb'
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 12
                                  }}>
                                    <h4 style={{
                                      fontSize: '16px',
                                      fontWeight: 700,
                                      color: '#1f2937',
                                      margin: 0
                                    }}>
                                      {konu}
                                    </h4>
                                    <span style={{
                                      fontSize: '18px',
                                      fontWeight: 700,
                                      color: topicColor
                                    }}>
                                      %{topicPercent}
                                    </span>
                                  </div>

                                  <div style={{
                                    width: '100%',
                                    height: 6,
                                    background: '#e5e7eb',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    marginBottom: 12
                                  }}>
                                    <div style={{
                                      width: `${topicPercent}%`,
                                      height: '100%',
                                      background: topicColor,
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>

                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '14px',
                                    color: '#6b7280'
                                  }}>
                                    <span>Çözülen: <strong style={{color: '#10b981'}}>{topicStats.totalSolved || 0}</strong></span>
                                    <span>Verilen: <strong style={{color: '#1f2937'}}>{topicStats.total}</strong></span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    marginTop: 8
                                  }}>
                                    <span>Doğru: <strong style={{color: '#065f46'}}>{topicStats.dogru || 0}</strong></span>
                                    <span>Yanlış: <strong style={{color: '#b91c1c'}}>{topicStats.yanlis || 0}</strong></span>
                                    <span>Boş: <strong style={{color: '#374151'}}>{topicStats.bos || 0}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '60px 20px',
                          color: '#6b7280',
                          fontSize: '15px'
                        }}>
                          <div style={{fontSize: '40px', marginBottom: 12, opacity: 0.5}}>📚</div>
                          <div style={{fontWeight: 600, marginBottom: 4}}>Henüz konu detayı bulunmuyor</div>
                          <div style={{fontSize: '13px', color: '#9ca3af'}}>Bu ders için program oluşturdukça burada konu bazlı dağılımı göreceksin.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeMenu === 'konu-ilerlemesi' && (
            <div className="kaynak-konu-ilerlemesi-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
              <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32}}>
                  <h2 style={{fontSize: '28px', fontWeight: 700, color: '#1f2937', letterSpacing: '-0.5px', margin: 0}}>
                    Konu İlerlemesi
                  </h2>
                  
                  {/* Dinamik Sınav Bileşenleri Sekmeleri */}
                  {examComponents.length > 1 && (
                    <div style={{display: 'flex', gap: 8, background: 'white', padding: 4, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                      {examComponents.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => {
                            setIlerlemeExamType(comp.id);
                            setSelectedDersForIlerleme(null);
                            setKonuIlerlemesi([]);
                          }}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 8,
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: ilerlemeExamType === comp.id ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                            color: ilerlemeExamType === comp.id ? 'white' : '#6b7280'
                          }}
                          onMouseEnter={(e) => {
                            if (ilerlemeExamType !== comp.id) {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#374151';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (ilerlemeExamType !== comp.id) {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#6b7280';
                            }
                          }}
                        >
                          {comp.ad}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!selectedDersForIlerleme ? (
                  <div>
                    <h3 style={{fontSize: '18px', fontWeight: 600, marginBottom: 20, color: '#374151'}}>
                      Ders Seçiniz
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 16
                    }}>
                      {student && (() => {
                        const selectedComp = examComponents.find(c => c.id === ilerlemeExamType);
                        let studentSubjects = [];
                        
                        if (selectedComp && selectedComp.dersler) {
                          studentSubjects = selectedComp.dersler;
                        } else if (examComponents.length > 0) {
                          studentSubjects = examComponents[0].dersler || [];
                        }
                        
                        return studentSubjects.map((ders) => {
                          const iconSrc = getSubjectIcon(ders, allSubjects);
                          return (
                            <div
                              key={ders}
                              onClick={() => setSelectedDersForIlerleme(ders)}
                              style={{
                                background: 'white',
                                borderRadius: 12,
                                padding: 20,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                border: '2px solid transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                e.currentTarget.style.borderColor = '#6a1b9a';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = 'transparent';
                              }}
                            >
                              {iconSrc && (
                                <img
                                  src={iconSrc}
                                  alt={ders}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    objectFit: 'contain',
                                    borderRadius: 8
                                  }}
                                />
                              )}
                              <span style={{fontSize: '16px', fontWeight: 600, color: '#1f2937'}}>
                                {ders}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                        <button
                          onClick={() => {
                            setSelectedDersForIlerleme(null);
                            setKonuIlerlemesi([]);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <FontAwesomeIcon icon={faChevronLeft} />
                          Geri
                        </button>
                        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                          {getSubjectIcon(selectedDersForIlerleme, allSubjects) && (
                            <img
                              src={getSubjectIcon(selectedDersForIlerleme, allSubjects)}
                              alt={selectedDersForIlerleme}
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: 'contain',
                                borderRadius: 8
                              }}
                            />
                          )}
                          <h3 style={{fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: 0}}>
                            {selectedDersForIlerleme}
                          </h3>
                        </div>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        {/* Öğrenci kaynak ekleyemez ve sıralamayı değiştiremez */}
                        <button
                          onClick={() => saveKonuIlerlemesi(false)}
                          style={{
                            padding: '10px 16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>

                    {konuIlerlemesiLoading ? (
                      <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                        <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                      </div>
                    ) : (
                      <div style={{
                        background: 'white',
                        borderRadius: 12,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {/* Tablo Başlıkları */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 150px 200px 1fr 100px',
                          gap: 16,
                          padding: '16px 20px',
                          background: '#f9fafb',
                          borderBottom: '2px solid #e5e7eb',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <div>Konu</div>
                          <div>Tarih</div>
                          <div>Durum</div>
                          <div>Kaynaklar</div>
                          <div>Yüzde</div>
                        </div>

                        {/* Tablo Satırları */}
                        {konuIlerlemesi.map((konu, index) => {
                          const yuzde = calculateYuzde(konu.kaynaklar);
                          const yuzdeColor = yuzde === 100 ? '#10b981' : yuzde >= 50 ? '#f59e0b' : '#ef4444';
                          return (
                            <div
                              key={konu.id || index}
                              style={{
                              display: 'grid',
                                gridTemplateColumns: '1fr 150px 200px 1fr 100px',
                                gap: 16,
                                padding: '16px 20px',
                                borderBottom: index < konuIlerlemesi.length - 1 ? '1px solid #e5e7eb' : 'none',
                                alignItems: 'center',
                                background: 'white'
                              }}
                            >
                              {/* Konu */}
                              <div style={{fontSize: '15px', fontWeight: 600, color: '#1f2937'}}>
                                  {konu.konu}
                                </div>

                              {/* Tarih */}
                                <div style={{fontSize: '14px', color: '#6b7280'}}>
                                {konu.tarih || '-'}
                                </div>

                              {/* Durum */}
                              <div>
                                <select
                                  value={konu.durum}
                                  onChange={(e) => {
                                    const newKonular = [...konuIlerlemesi];
                                    newKonular[index].durum = e.target.value;
                                    newKonular[index].tarih = new Date().toISOString().split('T')[0];
                                    setKonuIlerlemesi(newKonular);
                                    setTimeout(() => {
                                      saveKonuIlerlemesi(true);
                                    }, 50);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    fontSize: '14px',
                                    background: 'white',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="Konuya Gelinmedi">Konuya Gelinmedi</option>
                                  <option value="Daha Sonra Yapılacak">Daha Sonra Yapılacak</option>
                                  <option value="Konuyu Anlamadım">Konuyu Anlamadım</option>
                                  <option value="Çalıştım">Çalıştım</option>
                                </select>
                              </div>

                              {/* Kaynaklar */}
                              <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                                {konu.kaynaklar && konu.kaynaklar.length > 0 ? (
                                  <>
                                    {konu.kaynaklar.map((kaynak, kaynakIndex) => (
                                      <div
                                        key={kaynak.id || `kaynak-${kaynakIndex}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          padding: '4px 8px',
                                          background: kaynak.tamamlandi ? '#d1fae5' : '#f3f4f6',
                                          borderRadius: 6,
                                          fontSize: '12px'
                                        }}
                                      >
                                        <button 
                                          onClick={() => handleKaynakToggle(index, kaynakIndex)}
                                          style={{
                                            width: 18,
                                            height: 18,
                                          border: `2px solid ${kaynak.tamamlandi ? '#10b981' : '#9ca3af'}`,
                                            borderRadius: 4,
                                          background: kaynak.tamamlandi ? '#10b981' : 'white',
                                            cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0
                                          }}
                                        >
                                          {kaynak.tamamlandi && (
                                            <FontAwesomeIcon icon={faCheck} style={{color: 'white', fontSize: '10px'}} />
                                          )}
                                        </button>
                                        <span style={{color: '#374151'}}>{kaynak.kaynak_adi}</span>
                                        {/* Öğrenci kaynak silemez */}
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <div style={{color: '#9ca3af', fontSize: '12px'}}>
                                    Henüz kaynak eklenmedi
                                  </div>
                                )}
                              </div>

                              {/* Yüzde */}
                              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                <div style={{
                                  width: '100%',
                                  height: 8,
                                  background: '#e5e7eb',
                                  borderRadius: 4,
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${yuzde}%`,
                                    height: '100%',
                                    background: yuzdeColor,
                                    transition: 'width 0.3s'
                                  }} />
                                        </div>
                                        <span style={{
                                          fontSize: '14px',
                                  fontWeight: 600,
                                  color: yuzdeColor,
                                  minWidth: '40px',
                                  textAlign: 'right'
                                }}>
                                  {yuzde}%
                                        </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {/* Öğrenci kaynak ekleyemez, bu yüzden modal yok */}
              </div>
            </div>
          )}
          {activeMenu === 'brans-denemeleri' && (
            <div className="brans-denemeleri-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
              <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20}}>
                  <div>
                    <h2 style={{fontSize: 28, fontWeight: 700, margin: 0, color: '#111827'}}>Branş Denemeleri</h2>
                    <p style={{margin: '6px 0 0', color: '#6b7280'}}>
                      {student?.alanName || 'Sınav'} için branş denemesi sonucu ekle, konu bazlı başarıyı takip et.
                    </p>
                  </div>
                  <div style={{display: 'flex', gap: 12}}>
                                        <button
                      onClick={() => setBransView('entry')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: bransView === 'entry' ? '#6a1b9a' : 'white',
                        color: bransView === 'entry' ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      Branş Denemesi Sonucu Ekle
                    </button>
                    <button 
                      onClick={() => {
                        setBransView('charts');
                        fetchBransDenemeleri();
                                          }}
                                          style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: bransView === 'charts' ? '#6a1b9a' : 'white',
                        color: bransView === 'charts' ? 'white' : '#374151',
                                            cursor: 'pointer',
                        fontWeight: 700
                                          }}
                                        >
                      Branş Denemesi Grafikleri
                                        </button>
                                      </div>
                                  </div>

                {bransView === 'entry' ? (
                  <div style={{background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20}}>
                      {examComponents.length > 1 && (
                        <div>
                          <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Sınav Tipi</label>
                          <select
                            value={bransExamType}
                            onChange={(e) => {
                              setBransExamType(e.target.value);
                              setBransDenemeForm((prev) => ({ ...prev, ders: '' }));
                              setBransKonular([]);
                              setBransKonuDetayAcik(false);
                            }}
                            style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: 'white'}}
                          >
                            {examComponents.map(comp => (
                              <option key={comp.id} value={comp.id}>{comp.ad}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Ders Seçimi</label>
                        <select
                          value={bransDenemeForm.ders}
                          onChange={(e) => handleBransFormChange('ders', e.target.value)}
                          style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: 'white'}}
                        >
                          <option value="">Ders seçin</option>
                          {bransDersList.map((ders) => (
                            <option key={ders} value={ders}>{ders}</option>
                          ))}
                        </select>
                              </div>
                      <div>
                        <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Deneme Tarihi</label>
                        <input
                          type="date"
                          value={bransDenemeForm.denemeTarihi}
                          onChange={(e) => handleBransFormChange('denemeTarihi', e.target.value)}
                          style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                        />
                                </div>
                      <div>
                        <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Deneme Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Matematik Branş Denemesi 3"
                          value={bransDenemeForm.denemeAdi}
                          onChange={(e) => handleBransFormChange('denemeAdi', e.target.value)}
                          style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                        />
                              </div>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 16}}>
                      {['soruSayisi','dogru','yanlis','bos'].map((field) => {
                        const labels = { soruSayisi: 'Soru Sayısı', dogru: 'Doğru', yanlis: 'Yanlış', bos: 'Boş' };
                        return (
                          <div key={field} style={{background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12}}>
                            <div style={{fontWeight: 700, color: '#111827', marginBottom: 6}}>{labels[field]}</div>
                            <input
                              type="number"
                              min="0"
                              value={bransDenemeForm[field]}
                              onChange={(e) => handleBransFormChange(field, e.target.value)}
                              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                            />
                            </div>
                          );
                        })}
                      <div style={{background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start'}}>
                        <div style={{fontWeight: 700, color: '#065f46', marginBottom: 6}}>Net</div>
                        <div style={{fontSize: 24, fontWeight: 800, color: '#065f46'}}>{bransNet}</div>
                        <div style={{fontSize: 12, color: '#065f46'}}>Net = Doğru - (Yanlış x 0.25)</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const next = !bransKonuDetayAcik;
                        setBransKonuDetayAcik(next);
                        if (next && bransKonular.length === 0 && bransDenemeForm.ders) {
                          fetchBransKonular(bransDenemeForm.ders);
                        }
                      }}
                      disabled={!bransDenemeForm.ders}
                      style={{
                        marginBottom: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: bransKonuDetayAcik ? '#eef2ff' : 'white',
                        color: '#111827',
                        cursor: bransDenemeForm.ders ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Yanlış / Boş Konuları Gir
                    </button>

                    {bransKonuDetayAcik && (
                      <div style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, maxHeight: 420, overflow: 'auto', marginBottom: 16}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr repeat(3,120px) 100px', gap: 12, padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontWeight: 700, color: '#374151'}}>
                          <div>Konu</div>
                          <div>Doğru</div>
                          <div>Yanlış</div>
                          <div>Boş</div>
                          <div style={{textAlign: 'right'}}>Başarı %</div>
                        </div>
                        {bransKonular.length === 0 && (
                          <div style={{padding: 20, textAlign: 'center', color: '#6b7280'}}>Önce ders seçin.</div>
                        )}
                        {bransKonular.map((k, idx) => {
                          const d = Number(k.dogru) || 0;
                          const y = Number(k.yanlis) || 0;
                          const b = Number(k.bos) || 0;
                          const total = d + y + b;
                          const basari = total > 0 ? Math.round((d / total) * 100) : 0;
                          return (
                            <div key={`${k.konu}-${idx}`} style={{display: 'grid', gridTemplateColumns: '1fr repeat(3,120px) 100px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6'}}>
                              <div style={{fontWeight: 600, color: '#111827'}}>{k.konu}</div>
                              {['dogru','yanlis','bos'].map((field) => (
                                <input
                                  key={field}
                                  type="number"
                                  min="0"
                                  value={k[field]}
                                  onChange={(e) => handleBransKonuInputChange(idx, field, e.target.value)}
                                  placeholder={field === 'dogru' ? 'Doğru' : field === 'yanlis' ? 'Yanlış' : 'Boş'}
                                  style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                                />
                              ))}
                              <div style={{fontWeight: 700, color: basari >= 60 ? '#16a34a' : '#dc2626', textAlign: 'right'}}>%{basari}</div>
                            </div>
                          );
                        })}
                  </div>
                )}

                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12}}>
                      <button
                        onClick={handleSaveBransDeneme}
                        disabled={bransKaydediliyor}
                        style={{
                          padding: '12px 18px',
                          borderRadius: 10,
                          border: 'none',
                          background: bransKaydediliyor ? '#9ca3af' : '#6a1b9a',
                          color: 'white',
                          fontWeight: 700,
                          cursor: bransKaydediliyor ? 'not-allowed' : 'pointer',
                          minWidth: 140
                        }}
                      >
                        {bransKaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                    {bransDenemelerLoading ? (
                      <div style={{padding: 40, textAlign: 'center'}}>Yükleniyor...</div>
                    ) : bransAggregatedByDers.length === 0 ? (
                      <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Henüz kayıtlı branş denemesi yok.</div>
                    ) : (
                      <div style={{display: 'grid', gap: 16}}>
                        {bransAggregatedByDers.map((agg) => (
                          <div key={agg.ders} style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: 'white'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12}}>
                              <div>
                                <div style={{fontSize: 18, fontWeight: 800, color: '#111827'}}>{agg.ders}</div>
                                <div style={{color: '#6b7280', fontSize: 13}}>Deneme Sayısı: {agg.denemeSayisi}</div>
                              </div>
                              <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center'}}>
                                <div style={{background: '#ecfdf3', color: '#065f46', padding: '8px 10px', borderRadius: 10, fontWeight: 700}}>Ort Net: {agg.ortNet}</div>
                                <div style={{color: '#10b981', fontWeight: 700}}>Ort D:{agg.ortDogru}</div>
                                <div style={{color: '#f59e0b', fontWeight: 700}}>Ort Y:{agg.ortYanlis}</div>
                                <div style={{color: '#6b7280', fontWeight: 700}}>Ort B:{agg.ortBos}</div>
                              </div>
                            </div>
                            {agg.konuAverages && agg.konuAverages.length > 0 && (
                              <div style={{background: 'white', padding: '12px 0', borderRadius: 8}}>
                                <div style={{display: 'flex', gap: 4, alignItems: 'flex-end', minHeight: 220, padding: '12px 0 32px 0'}}>
                                  {agg.konuAverages.map((k, idx) => {
                                    const basariYuzde = Math.round(k.ortBasari || 0);
                                    const barHeight = Math.max((basariYuzde / 100) * 200, 3);
                                    const barColor = bransBasariColor(basariYuzde);
                                    return (
                                      <div key={`${agg.ders}-${k.konu}-${idx}`} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0}}>
                                        <div style={{position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 200}}>
                                          <div 
                                            style={{
                                              width: '100%',
                                              minWidth: 18,
                                              maxWidth: 32,
                                              height: `${barHeight}px`,
                                              background: barColor,
                                              borderRadius: '4px 4px 0 0',
                                              position: 'relative',
                                              transition: 'height 0.3s ease'
                                            }}
                                            title={`${k.konu}: %${basariYuzde}`}
                                          >
                  <div style={{
                                              position: 'absolute',
                                              top: -18,
                                              left: '50%',
                                              transform: 'translateX(-50%)',
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: '#111827',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {basariYuzde}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: '#111827',
                                          textAlign: 'center',
                                          writingMode: 'vertical-rl',
                                          textOrientation: 'mixed',
                                          transform: 'rotate(180deg)',
                                          height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                                          wordBreak: 'break-word',
                                          lineHeight: 1.1,
                                          maxWidth: 40
                                        }}>
                                          {k.konu}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeMenu === 'genel-denemeler' && (
            <div className="genel-denemeler-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
              <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                <h2 style={{fontSize: 32, fontWeight: 700, margin: '0 0 32px 0', color: '#111827'}}>Genel Denemeler</h2>

                {/* Filtre */}
                <div style={{marginBottom: 24, display: 'flex', justifyContent: 'flex-end'}}>
                  <select
                    value={genelDenemeFilter || 'son-deneme'}
                    onChange={(e) => setGenelDenemeFilter(e.target.value)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: '1px solid #d1d5db',
                      background: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                      minWidth: 180
                    }}
                  >
                    <option value="son-deneme">Son Deneme</option>
                    <option value="son-3">Son 3 Deneme</option>
                    <option value="son-5">Son 5 Deneme</option>
                    <option value="son-10">Son 10 Deneme</option>
                    <option value="tum-denemeler">Tüm Denemeler</option>
                  </select>
                </div>

                {/* Ortalama Kartları - Dinamik */}
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, 
                  gap: 24, 
                  marginBottom: 32
                }}>
                  {examComponents.map((comp) => (
                    <div key={comp.id} style={{
                      background: 'white',
                      borderRadius: 16,
                      padding: 32,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 16}}>
                        {comp.ad} Deneme Ortalaması
                      </div>
                      <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>
                        {calculateGenelDenemeOrtalamalari[comp.id] || 0}
                      </div>
                      <div style={{fontSize: 20, fontWeight: 600, color: '#6b7280', marginTop: 8}}>Net</div>
                    </div>
                  ))}
                </div>

                {/* Alt Butonlar */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20}}>
                  {/* Deneme Sonucu Ekle */}
                  <button
                    onClick={() => setGenelDenemeView('ekle')}
                    style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #6a1b9a 100%)',
                      borderRadius: 16,
                      padding: '40px 24px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                      boxShadow: '0 4px 12px rgba(106, 27, 154, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(106, 27, 154, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(106, 27, 154, 0.3)';
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{fontSize: 48, color: 'white'}} />
                    <div style={{fontSize: 18, fontWeight: 700, color: 'white', textAlign: 'center'}}>Deneme Sonucu Ekle</div>
                  </button>

                  {/* Deneme Grafikleri */}
                  <button 
                    onClick={() => {
                      setGenelDenemeView('grafikler');
                      fetchGenelDenemeler();
                    }}
                        style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #6a1b9a 100%)',
                      borderRadius: 16,
                      padding: '40px 24px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                      boxShadow: '0 4px 12px rgba(106, 27, 154, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(106, 27, 154, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(106, 27, 154, 0.3)';
                    }}
                  >
                    <FontAwesomeIcon icon={faChartLine} style={{fontSize: 48, color: 'white'}} />
                    <div style={{fontSize: 18, fontWeight: 700, color: 'white', textAlign: 'center'}}>Deneme Grafikleri</div>
                  </button>

                  {/* Kaygı - Odak - Zaman - Enerji - Duygu Analizleri */}
                        <button
                    onClick={() => setGenelDenemeView('analizler')}
                          style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #6a1b9a 100%)',
                      borderRadius: 16,
                      padding: '40px 24px',
                            border: 'none',
                            cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                      boxShadow: '0 4px 12px rgba(106, 27, 154, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(106, 27, 154, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(106, 27, 154, 0.3)';
                    }}
                  >
                    <FontAwesomeIcon icon={faLightbulb} style={{fontSize: 48, color: 'white'}} />
                    <div style={{fontSize: 18, fontWeight: 700, color: 'white', textAlign: 'center'}}>Kaygı - Odak - Zaman - Enerji - Duygu Analizleri</div>
                        </button>
                </div>

                {/* View İçerikleri */}
                {genelDenemeView === 'ekle' && (
                  <div style={{marginTop: 32, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                      <h3 style={{fontSize: 24, fontWeight: 700, color: '#111827', margin: 0}}>Deneme Sonucu Ekle</h3>
                        <button
                        onClick={() => {
                          setGenelDenemeView(null);
                          setGenelDenemeForm({ denemeAdi: '', denemeTarihi: '', notlar: '', sinavTipi: 'tyt' });
                          setGenelDenemeDersler({});
                          setGenelDenemeDegerlendirme({
                            zamanYeterli: null,
                            odaklanma: null,
                            kaygiDuzeyi: null,
                            enZorlayanDers: '',
                            kendiniHissediyorsun: null
                          });
                        }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                          border: '1px solid #d1d5db',
                          background: 'white',
                          color: '#374151',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                        Kapat
                        </button>
                      </div>
                    {(() => {
                      const currentSinavTipi = genelDenemeForm.sinavTipi || (examComponents[0]?.id || 'tyt');
                      const selectedComp = examComponents.find(c => c.id === currentSinavTipi);
                      
                      const filteredDersList = (() => {
                        if (selectedComp && selectedComp.dersler && selectedComp.dersler.length > 0) {
                          return selectedComp.dersler;
                        }
                        // Fallback
                        const studentAreaRaw = student?.alan || '';
                        const studentArea = (studentAreaRaw || '').toLowerCase();
                        const isYks = studentArea.startsWith('yks');
                        const fallbackDersList = getDersList(selectedQuestionExamArea);
                        if (isYks) {
                          return currentSinavTipi === 'tyt' 
                            ? fallbackDersList.filter(d => d.startsWith('TYT '))
                            : fallbackDersList.filter(d => d.startsWith('AYT '));
                        }
                        return fallbackDersList;
                      })();
                      
                      return (
                        <>
                          {/* Deneme Bilgileri */}
                          <div style={{display: 'grid', gridTemplateColumns: examComponents.length > 1 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 24}}>
                            {examComponents.length > 1 && (
                              <div>
                                <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Sınav Tipi</label>
                                <select
                                  value={genelDenemeForm.sinavTipi || (examComponents[0]?.id)}
                                  onChange={(e) => {
                                    setGenelDenemeForm(prev => ({ ...prev, sinavTipi: e.target.value }));
                                    setGenelDenemeDersler({});
                                  }}
                                  style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                                >
                                  {examComponents.map(comp => (
                                    <option key={comp.id} value={comp.id}>{comp.ad}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div>
                              <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Deneme Adı</label>
                              <input
                                type="text"
                                placeholder="Örn: TYT Denemesi #1"
                                value={genelDenemeForm.denemeAdi}
                                onChange={(e) => setGenelDenemeForm(prev => ({ ...prev, denemeAdi: e.target.value }))}
                                style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                              />
                  </div>
                            <div>
                              <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Deneme Tarihi</label>
                              <input
                                type="date"
                                value={genelDenemeForm.denemeTarihi}
                                onChange={(e) => setGenelDenemeForm(prev => ({ ...prev, denemeTarihi: e.target.value }))}
                                style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                              />
              </div>
            </div>

                          {/* Ders Sonuçları */}
                          <div style={{marginBottom: 24}}>
                            <h4 style={{fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16}}>Ders Sonuçları</h4>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16}}>
                              {filteredDersList.map((ders) => {
                                const dersData = genelDenemeDersler[ders] || { soruSayisi: '', dogru: '', yanlis: '', bos: '', net: 0 };
                                const net = dersData.dogru && dersData.yanlis !== '' 
                                  ? (Number(dersData.dogru) - (Number(dersData.yanlis) * 0.25)).toFixed(2)
                                  : '0.00';
                                
                                return (
                                  <div key={ders} style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f9fafb'}}>
                                    <div style={{fontWeight: 700, color: '#111827', marginBottom: 12}}>{ders}</div>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8}}>
                                      <div>
                                        <label style={{fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4}}>Soru</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={dersData.soruSayisi}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setGenelDenemeDersler(prev => ({
                                              ...prev,
                                              [ders]: { ...prev[ders], soruSayisi: val }
                                            }));
                                          }}
                                          style={{width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14}}
                                        />
                  </div>
                                      <div>
                                        <label style={{fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4}}>Doğru</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={dersData.dogru}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const yanlis = genelDenemeDersler[ders]?.yanlis || 0;
                                            const net = val && yanlis !== '' ? (Number(val) - (Number(yanlis) * 0.25)).toFixed(2) : '0.00';
                                            setGenelDenemeDersler(prev => ({
                                              ...prev,
                                              [ders]: { ...prev[ders], dogru: val, net: parseFloat(net) }
                                            }));
                                          }}
                                          style={{width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14}}
                                        />
                  </div>
                                      <div>
                                        <label style={{fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4}}>Yanlış</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={dersData.yanlis}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const dogru = genelDenemeDersler[ders]?.dogru || 0;
                                            const net = dogru && val !== '' ? (Number(dogru) - (Number(val) * 0.25)).toFixed(2) : '0.00';
                                            setGenelDenemeDersler(prev => ({
                                              ...prev,
                                              [ders]: { ...prev[ders], yanlis: val, net: parseFloat(net) }
                                            }));
                                          }}
                                          style={{width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14}}
                                        />
                                      </div>
                                      <div>
                                        <label style={{fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4}}>Boş</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={dersData.bos}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setGenelDenemeDersler(prev => ({
                                              ...prev,
                                              [ders]: { ...prev[ders], bos: val }
                                            }));
                                          }}
                                          style={{width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14}}
                                        />
                                      </div>
                                    </div>
                                    <div style={{marginTop: 8, padding: '8px', background: '#ecfdf3', borderRadius: 8, textAlign: 'center'}}>
                                      <span style={{fontSize: 12, color: '#065f46', fontWeight: 600}}>Net: </span>
                                      <span style={{fontSize: 16, fontWeight: 700, color: '#065f46'}}>{net}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Deneme Notları */}
                          <div style={{marginBottom: 24}}>
                            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Deneme Notları</label>
                            <textarea
                              value={genelDenemeForm.notlar}
                              onChange={(e) => setGenelDenemeForm(prev => ({ ...prev, notlar: e.target.value }))}
                              placeholder="Deneme hakkında notlarınızı buraya yazabilirsiniz..."
                              rows={4}
                              style={{width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'inherit'}}
                            />
                          </div>

                          {/* Değerlendirme Butonu ve Kaydet */}
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
                            <button
                              onClick={() => setGenelDenemeDegerlendirmeModalAcik(true)}
                              style={{
                                padding: '12px 20px',
                                borderRadius: 10,
                                border: '1px solid #6a1b9a',
                    background: 'white',
                                color: '#6a1b9a',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 14
                              }}
                            >
                              Deneme Sonrası Değerlendirme
                              {isGenelDenemeDegerlendirmeTamamlandi() && (
                                <span style={{marginLeft: 8, color: '#10b981'}}>✓</span>
                              )}
                            </button>
                            <button
                              onClick={handleSaveGenelDeneme}
                              disabled={genelDenemeKaydediliyor || !isGenelDenemeDegerlendirmeTamamlandi()}
                              style={{
                                padding: '12px 24px',
                                borderRadius: 10,
                                border: 'none',
                                background: genelDenemeKaydediliyor || !isGenelDenemeDegerlendirmeTamamlandi() ? '#9ca3af' : '#6a1b9a',
                                color: 'white',
                                fontWeight: 700,
                                cursor: genelDenemeKaydediliyor || !isGenelDenemeDegerlendirmeTamamlandi() ? 'not-allowed' : 'pointer',
                                fontSize: 14
                              }}
                            >
                              {genelDenemeKaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                          </div>
                        </>
                      );
                    })()}

                    {/* Değerlendirme Modal */}
                    {genelDenemeDegerlendirmeModalAcik && (
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10000
                        }}
                        onClick={() => setGenelDenemeDegerlendirmeModalAcik(false)}
                      >
                        <div
                          style={{
                            background: 'white',
                            borderRadius: 16,
                            padding: 32,
                            maxWidth: 600,
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                            <h3 style={{fontSize: 24, fontWeight: 700, color: '#111827', margin: 0}}>Deneme Sonrası Değerlendirme</h3>
                            <button
                              onClick={() => setGenelDenemeDegerlendirmeModalAcik(false)}
                              style={{
                                padding: '8px',
                                borderRadius: 8,
                                border: 'none',
                                background: 'transparent',
                                color: '#6b7280',
                                cursor: 'pointer',
                                fontSize: 20
                              }}
                            >
                              ×
                            </button>
                          </div>
                          
                          <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                            {/* Soru 1: Zaman Yeterli mi */}
                        <div>
                              <label style={{display: 'block', marginBottom: 12, fontWeight: 600, color: '#111827', fontSize: 16}}>
                                1. Denemede zaman yeterli oldu mu?
                              </label>
                              <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
                                <span style={{fontSize: 12, color: '#6b7280'}}>1 - Hiç yeterli olmadı</span>
                                <div style={{display: 'flex', gap: 12}}>
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <label key={val} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                      <input
                                        type="radio"
                                        name="zamanYeterli"
                                        value={val}
                                        checked={genelDenemeDegerlendirme.zamanYeterli === val}
                                        onChange={() => setGenelDenemeDegerlendirme(prev => ({ ...prev, zamanYeterli: val }))}
                                        style={{marginRight: 4}}
                                      />
                                      <span style={{fontSize: 14, fontWeight: 600}}>{val}</span>
                                    </label>
                                  ))}
                          </div>
                                <span style={{fontSize: 12, color: '#6b7280'}}>5 - Fazla bile kaldı</span>
                          </div>
                        </div>

                            {/* Soru 2: Odaklanma */}
                            <div>
                              <label style={{display: 'block', marginBottom: 12, fontWeight: 600, color: '#111827', fontSize: 16}}>
                                2. Odaklanmakta zorlandın mı?
                              </label>
                              <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
                                <span style={{fontSize: 12, color: '#6b7280'}}>1 - Hiç odaklanamadım</span>
                                <div style={{display: 'flex', gap: 12}}>
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <label key={val} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                      <input
                                        type="radio"
                                        name="odaklanma"
                                        value={val}
                                        checked={genelDenemeDegerlendirme.odaklanma === val}
                                        onChange={() => setGenelDenemeDegerlendirme(prev => ({ ...prev, odaklanma: val }))}
                                        style={{marginRight: 4}}
                                      />
                                      <span style={{fontSize: 14, fontWeight: 600}}>{val}</span>
                                    </label>
                                  ))}
                        </div>
                                <span style={{fontSize: 12, color: '#6b7280'}}>5 - Çok iyi odaklandım</span>
                      </div>
                            </div>

                            {/* Soru 3: Kaygı Düzeyi */}
                            <div>
                              <label style={{display: 'block', marginBottom: 12, fontWeight: 600, color: '#111827', fontSize: 16}}>
                                3. Kaygı Düzeyini nasıl değerlendiriyorsun?
                              </label>
                              <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
                                <span style={{fontSize: 12, color: '#6b7280'}}>1 - Kaygılı değilim</span>
                                <div style={{display: 'flex', gap: 12}}>
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <label key={val} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                      <input
                                        type="radio"
                                        name="kaygiDuzeyi"
                                        value={val}
                                        checked={genelDenemeDegerlendirme.kaygiDuzeyi === val}
                                        onChange={() => setGenelDenemeDegerlendirme(prev => ({ ...prev, kaygiDuzeyi: val }))}
                                        style={{marginRight: 4}}
                                      />
                                      <span style={{fontSize: 14, fontWeight: 600}}>{val}</span>
                                    </label>
                    ))}
                  </div>
                                <span style={{fontSize: 12, color: '#6b7280'}}>5 - Çok kaygılıyım</span>
                              </div>
                            </div>

                            {/* Soru 4: En Zorlayan Ders */}
                            <div>
                              <label style={{display: 'block', marginBottom: 12, fontWeight: 600, color: '#111827', fontSize: 16}}>
                                4. Bu denemede seni en çok zorlayan kısım neydi?
                              </label>
                              <select
                                value={genelDenemeDegerlendirme.enZorlayanDers}
                                onChange={(e) => setGenelDenemeDegerlendirme(prev => ({ ...prev, enZorlayanDers: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  border: '1px solid #d1d5db',
                                  fontSize: 14
                                }}
                              >
                                <option value="">Ders seçin</option>
                                {(() => {
                                  const currentSinavTipi = genelDenemeForm.sinavTipi || (examComponents[0]?.id || 'tyt');
                                  const selectedComp = examComponents.find(c => c.id === currentSinavTipi);
                                  
                                  const currentDersList = (() => {
                                    if (selectedComp && selectedComp.dersler && selectedComp.dersler.length > 0) {
                                      return selectedComp.dersler;
                                    }
                                    // Fallback
                                    const studentAreaRaw = student?.alan || '';
                                    const studentArea = (studentAreaRaw || '').toLowerCase();
                                    const isYks = studentArea.startsWith('yks');
                                    const fallbackDersList = getDersList(selectedExamArea);
                                    if (isYks) {
                                      return currentSinavTipi === 'tyt' 
                                        ? fallbackDersList.filter(d => d.startsWith('TYT '))
                                        : fallbackDersList.filter(d => d.startsWith('AYT '));
                                    }
                                    return fallbackDersList;
                                  })();

                                  return currentDersList.map((ders) => (
                                    <option key={ders} value={ders}>{ders}</option>
                                  ));
                                })()}
                              </select>
                            </div>

                            {/* Soru 5: Kendini Nasıl Hissediyorsun */}
                            <div>
                              <label style={{display: 'block', marginBottom: 12, fontWeight: 600, color: '#111827', fontSize: 16}}>
                                5. Denemeden sonra kendini nasıl hissediyorsun?
                              </label>
                              <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
                                <span style={{fontSize: 12, color: '#6b7280'}}>1 - Çok kötü</span>
                                <div style={{display: 'flex', gap: 12}}>
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <label key={val} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                      <input
                                        type="radio"
                                        name="kendiniHissediyorsun"
                                        value={val}
                                        checked={genelDenemeDegerlendirme.kendiniHissediyorsun === val}
                                        onChange={() => setGenelDenemeDegerlendirme(prev => ({ ...prev, kendiniHissediyorsun: val }))}
                                        style={{marginRight: 4}}
                                      />
                                      <span style={{fontSize: 14, fontWeight: 600}}>{val}</span>
                                    </label>
                                  ))}
                                </div>
                                <span style={{fontSize: 12, color: '#6b7280'}}>5 - Çok iyi</span>
                              </div>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8}}>
                              <button
                                onClick={() => setGenelDenemeDegerlendirmeModalAcik(false)}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 10,
                                  border: '1px solid #d1d5db',
                                  background: 'white',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Kapat
                              </button>
                              <button
                                onClick={() => {
                                  if (isGenelDenemeDegerlendirmeTamamlandi()) {
                                    setGenelDenemeDegerlendirmeModalAcik(false);
                                  } else {
                                    alert('Lütfen tüm soruları cevaplayın');
                                  }
                                }}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: '#6a1b9a',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontWeight: 700
                                }}
                              >
                                Tamamla
                              </button>
                            </div>
                          </div>
              </div>
            </div>
          )}
                  </div>
                )}

                {genelDenemeView === 'grafikler' && (
                  <div style={{marginTop: 32, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                      <h3 style={{fontSize: 24, fontWeight: 700, color: '#111827', margin: 0}}>Deneme Grafikleri</h3>
                      <button
                        onClick={() => {
                          setGenelDenemeView(null);
                          fetchGenelDenemeler();
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          background: 'white',
                          color: '#374151',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Kapat
                      </button>
                  </div>
                  
                  {/* Tab Butonları */}
                  <div style={{display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #e5e7eb'}}>
                    <button
                      onClick={() => setDenemeGrafikTab('genel')}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px 8px 0 0',
                        border: 'none',
                        borderBottom: denemeGrafikTab === 'genel' ? '3px solid #6a1b9a' : '3px solid transparent',
                        background: 'transparent',
                        color: denemeGrafikTab === 'genel' ? '#6a1b9a' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: denemeGrafikTab === 'genel' ? 700 : 500,
                        fontSize: 16,
                        transition: 'all 0.2s'
                      }}
                    >
                      Genel Deneme Grafiği
                    </button>
                    <button
                      onClick={() => setDenemeGrafikTab('ders-bazli')}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px 8px 0 0',
                        border: 'none',
                        borderBottom: denemeGrafikTab === 'ders-bazli' ? '3px solid #6a1b9a' : '3px solid transparent',
                        background: 'transparent',
                        color: denemeGrafikTab === 'ders-bazli' ? '#6a1b9a' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: denemeGrafikTab === 'ders-bazli' ? 700 : 500,
                        fontSize: 16,
                        transition: 'all 0.2s'
                      }}
                    >
                      Ders Bazlı Deneme Grafiği
                    </button>
                  </div>
                  
                  {/* Tab İçerikleri */}
                  {denemeGrafikTab === 'genel' && (
                    <>
                      {genelDenemeListLoading ? (
                      <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Yükleniyor...</div>
                    ) : genelDenemeList.length === 0 ? (
                      <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Henüz kayıtlı deneme yok.</div>
                    ) : (() => {
                      // Filtreye göre denemeleri al
                      let filteredDenemeler = [...genelDenemeList];
                      if (genelDenemeFilter === 'son-3') {
                        filteredDenemeler = filteredDenemeler.slice(0, 3);
                      } else if (genelDenemeFilter === 'son-5') {
                        filteredDenemeler = filteredDenemeler.slice(0, 5);
                      } else if (genelDenemeFilter === 'son-10') {
                        filteredDenemeler = filteredDenemeler.slice(0, 10);
                      } else if (genelDenemeFilter === 'tum-denemeler') {
                        // Tüm denemeler - filtreleme yapma
                        filteredDenemeler = filteredDenemeler;
                      } else {
                        // son-deneme (varsayılan)
                        filteredDenemeler = filteredDenemeler.slice(0, 1);
                      }
                      
                      return (
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20}}>
                          {filteredDenemeler.map((deneme) => {
                          const toplamNet = Object.values(deneme.dersSonuclari || {}).reduce((sum, d) => sum + (Number(d.net) || 0), 0);
                          return (
                            <div key={deneme.id} style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#f9fafb',display:'flex',flexDirection:'column',gap:10}}>
                              <div style={{marginBottom: 16}}>
                                <div style={{fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4}}>{deneme.denemeAdi}</div>
                                <div style={{fontSize: 14, color: '#6b7280'}}>{deneme.denemeTarihi}</div>
                                <div style={{marginTop: 8, fontSize: 16, fontWeight: 700, color: '#6a1b9a'}}>Toplam Net: {toplamNet.toFixed(2)}</div>
                              </div>
                              <div style={{height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 10,paddingBottom: 20}}>
                                {Object.entries(deneme.dersSonuclari || {}).map(([ders, data]) => {
                                  const net = Number(data.net) || 0;
                                  const maxNet = Math.max(...Object.values(deneme.dersSonuclari || {}).map(d => Number(d.net) || 0), 1);
                                  const height = maxNet > 0 ? (net / maxNet) * 180 : 0;
                                  const barColor = genelNetColor(net, maxNet);
                                  return (
                                    <div key={ders} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
                                      <div
                                        style={{
                                          width: '100%',
                                          height: `${Math.max(height, 3)}px`,
                                          background: barColor,
                                          borderRadius: '4px 4px 0 0',
                                          position: 'relative',
                                          display: 'flex',
                                          alignItems: 'flex-end',
                                          justifyContent: 'center',
                                          paddingBottom: 4
                                        }}
                                        title={`${ders}: ${net.toFixed(2)}`}
                                      >
                                        <div style={{
                                          width: '100%',
                                          display: 'flex',
                                          alignItems: 'flex-end',
                                          justifyContent: 'center',
                                          height: '100%',
                                          pointerEvents: 'none',
                                          marginTop: 10,
                                        }}>
                                          <span style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#fff',
                                            background: 'rgba(0,0,0,0.22)',
                                            borderRadius: 4,
                                            padding: '1px 6px',
                                            marginBottom: 2,
                                            letterSpacing: 0.05,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                                          }}>
                                            {net.toFixed(1)}
                                          </span>
                                        </div>
                                      </div>
                                      <div style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#111827',
                                        textAlign: 'center',
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'mixed',
                                        transform: 'rotate(180deg)',
                                        height: 40,
                          display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '12px 0'
                        }}>
                                        {ders.split(' ').pop()}
                            </div>
                            </div>
                                  );
                                })}
                          </div>
                        </div>
                      );
                          })}
                        </div>
                      );
                    })()}
                    </>
                  )}
                  
                  {denemeGrafikTab === 'ders-bazli' && (
                    <>
                      {(() => {
                        const studentAreaRaw = student?.alan || '';
                        const currentSinavTipi = dersBazliGrafikSinavTipi || (examComponents[0]?.id || 'tyt');
                        const selectedComp = examComponents.find(c => c.id === currentSinavTipi);
                        
                        const dersList = (() => {
                          if (selectedComp && selectedComp.dersler && selectedComp.dersler.length > 0) {
                            return selectedComp.dersler;
                          }
                          // Fallback
                          const studentArea = (studentAreaRaw || '').toLowerCase();
                          const isYks = studentArea.startsWith('yks');
                          const fallbackDersList = getDersList(dersBasariExamType);
                          if (isYks) {
                            return currentSinavTipi === 'tyt' 
                              ? fallbackDersList.filter(d => d.startsWith('TYT '))
                              : fallbackDersList.filter(d => d.startsWith('AYT '));
                          }
                          return fallbackDersList;
                        })();
                        
                        // Filtreye göre denemeleri al
                        let filteredDenemeler = [...genelDenemeList];
                        if (genelDenemeFilter === 'son-3') {
                          filteredDenemeler = filteredDenemeler.slice(0, 3);
                        } else if (genelDenemeFilter === 'son-5') {
                          filteredDenemeler = filteredDenemeler.slice(0, 5);
                        } else if (genelDenemeFilter === 'son-10') {
                          filteredDenemeler = filteredDenemeler.slice(0, 10);
                        } else if (genelDenemeFilter === 'tum-denemeler') {
                          filteredDenemeler = filteredDenemeler;
                        } else {
                          filteredDenemeler = filteredDenemeler.slice(0, 1);
                        }
                        
                        if (genelDenemeListLoading) {
                          return <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Yükleniyor...</div>;
                        }
                        
                        if (genelDenemeList.length === 0) {
                          return <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Henüz kayıtlı deneme yok.</div>;
                        }
                        
                        return (
                          <div>
                            {/* Sınav Bileşeni Seçimi */}
                            {examComponents.length > 1 && (
                              <div style={{marginBottom: 24, display: 'flex', gap: 12}}>
                                {examComponents.map(comp => (
                                  <button
                                    key={comp.id}
                                    onClick={() => setDersBazliGrafikSinavTipi(comp.id)}
                                    style={{
                                      padding: '10px 20px',
                                      borderRadius: 8,
                                      border: '1px solid #d1d5db',
                                      background: currentSinavTipi === comp.id ? '#6a1b9a' : 'white',
                                      color: currentSinavTipi === comp.id ? 'white' : '#374151',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    {comp.ad}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Filtre Butonları */}
                            <div style={{marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                              <button
                                onClick={() => setDersBazliGrafikFiltre('net')}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 8,
                                  border: '1px solid #3b82f6',
                                  background: dersBazliGrafikFiltre === 'net' ? '#3b82f6' : 'white',
                                  color: dersBazliGrafikFiltre === 'net' ? 'white' : '#3b82f6',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Toplam Net
                              </button>
                              <button
                                onClick={() => setDersBazliGrafikFiltre('dogru')}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 8,
                                  border: '1px solid #10b981',
                                  background: dersBazliGrafikFiltre === 'dogru' ? '#10b981' : 'white',
                                  color: dersBazliGrafikFiltre === 'dogru' ? 'white' : '#10b981',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Doğru
                              </button>
                              <button
                                onClick={() => setDersBazliGrafikFiltre('yanlis')}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 8,
                                  border: '1px solid #ef4444',
                                  background: dersBazliGrafikFiltre === 'yanlis' ? '#ef4444' : 'white',
                                  color: dersBazliGrafikFiltre === 'yanlis' ? 'white' : '#ef4444',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Yanlış
                              </button>
                              <button
                                onClick={() => setDersBazliGrafikFiltre('bos')}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 8,
                                  border: '1px solid #6b7280',
                                  background: dersBazliGrafikFiltre === 'bos' ? '#6b7280' : 'white',
                                  color: dersBazliGrafikFiltre === 'bos' ? 'white' : '#6b7280',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Boş
                              </button>
                            </div>
                            
                            {/* Ders Bazlı Grafikler */}
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 24}}>
                              {dersList.map((ders) => {
                                // Bu ders için tüm denemelerden veri topla
                                let chartColor = '#3b82f6';
                                if (dersBazliGrafikFiltre === 'net') {
                                  chartColor = '#3b82f6';
                                } else if (dersBazliGrafikFiltre === 'dogru') {
                                  chartColor = '#10b981';
                                } else if (dersBazliGrafikFiltre === 'yanlis') {
                                  chartColor = '#ef4444';
                                } else if (dersBazliGrafikFiltre === 'bos') {
                                  chartColor = '#6b7280';
                                }
                                
                                const dersVerileri = filteredDenemeler.map(deneme => {
                                  const dersData = deneme.dersSonuclari?.[ders];
                                  if (!dersData) return null;
                                  
                                  let value = 0;
                                  
                                  if (dersBazliGrafikFiltre === 'net') {
                                    value = Number(dersData.net) || 0;
                                  } else if (dersBazliGrafikFiltre === 'dogru') {
                                    value = Number(dersData.dogru) || 0;
                                  } else if (dersBazliGrafikFiltre === 'yanlis') {
                                    value = Number(dersData.yanlis) || 0;
                                  } else if (dersBazliGrafikFiltre === 'bos') {
                                    value = Number(dersData.bos) || 0;
                                  }
                                  
                                  return {
                                    denemeAdi: deneme.denemeAdi,
                                    tarih: deneme.denemeTarihi,
                                    value: value
                                  };
                                }).filter(Boolean);
                                
                                if (dersVerileri.length === 0) return null;
                                
                                const rawMaxValue = Math.max(...dersVerileri.map(d => d.value), 0);
                                // maxValue'yu yukarı yuvarla (en yakın 5'in katına veya %10 ekle)
                                const maxValue = rawMaxValue > 0 ? Math.ceil(rawMaxValue * 1.1 / 5) * 5 : 5;
                                const chartHeight = 180;
                                
                                return (
                                  <div key={ders} style={{
                                    background: 'white',
                                    borderRadius: 16,
                                    padding: 24,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <h4 style={{fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20}}>
                                      {ders}
                                    </h4>
                                    
                                    <div style={{background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
                                      <div style={{position: 'relative', height: chartHeight}}>
                                        {/* Y ekseni */}
                                        <div style={{
                                          position: 'absolute',
                                          left: 0,
                                          top: 0,
                                          bottom: 0,
                                          width: 30,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'space-between',
                                          paddingRight: 8
                                        }}>
                                          {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((val, idx) => (
                                            <div key={idx} style={{fontSize: 11, color: '#6b7280', textAlign: 'right'}}>
                                              {Math.round(val)}
                                            </div>
                                          ))}
                                        </div>
                                        
                                        {/* Grafik alanı */}
                                        <div style={{
                                          marginLeft: 40,
                                          position: 'relative',
                                          height: chartHeight,
                                          borderLeft: '1px solid #e5e7eb',
                                          borderBottom: '1px solid #e5e7eb'
                                        }}>
                                          {/* Grid çizgileri */}
                                          {[1, 2, 3, 4].map(val => (
                                            <div
                                              key={val}
                                              style={{
                                                position: 'absolute',
                                                left: 0,
                                                right: 0,
                                                bottom: `${(val / 4) * 100}%`,
                                                borderTop: '1px dashed #e5e7eb'
                                              }}
                                            />
                                          ))}
                                          
                                          {/* Çubuklar */}
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            height: '100%',
                                            padding: '0 20px',
                                            gap: 12,
                                            justifyContent: 'center',
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0
                                          }}>
                                            {dersVerileri.map((data, index) => {
                                              const heightPx = chartHeight * (data.value / maxValue);
                                              return (
                                                <div
                                                  key={index}
                                                  style={{
                                                    flex: 1,
                                                    minWidth: 36,
                                                    maxWidth: 46,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    height: '100%'
                                                  }}
                                                >
                                                  {/* Değer - Çubukların üstünde */}
                                                  {data.value > 0 && (
                                                    <div style={{
                                                      marginBottom: 4,
                                                      fontSize: 12,
                                                      fontWeight: 700,
                                                      color: '#111827',
                                                      minHeight: '16px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {data.value}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Çubuk */}
                                                  <div style={{
                                                    width: '100%',
                                                    background: chartColor,
                                                    borderRadius: '4px 4px 0 0',
                                                    height: `${heightPx}px`,
                                                    minHeight: data.value > 0 ? 5 : 0,
                                                    position: 'relative',
                                                    alignSelf: 'flex-end'
                                                  }}>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                        
                                        {/* Deneme adları - Grafik alanının dışında */}
                                        <div style={{
                                          marginLeft: 40,
                                          marginTop: 12,
                                          display: 'flex',
                                          padding: '0 20px',
                                          gap: 12,
                                          justifyContent: 'center'
                                        }}>
                                          {dersVerileri.map((data, index) => (
                                            <div
                                              key={index}
                                              style={{
                                                flex: 1,
                                                minWidth: 36,
                                                maxWidth: dersVerileri.length > 5 ? 20 : 80,
                                                fontSize: 11,
                                                color: '#6b7280',
                                                textAlign: 'center',
                                                writingMode: dersVerileri.length > 5 ? 'vertical-rl' : 'horizontal-tb',
                                                transform: dersVerileri.length > 5 ? 'rotate(180deg)' : 'none',
                                                wordBreak: 'break-word'
                                              }}
                                            >
                                              {data.denemeAdi.length > 15 ? data.denemeAdi.substring(0, 12) + '...' : data.denemeAdi}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                  </div>
                )}

                {genelDenemeView === 'analizler' && (
                  <div style={{marginTop: 32, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                      <h3 style={{fontSize: 24, fontWeight: 700, color: '#111827', margin: 0}}>Kaygı - Odak - Zaman - Enerji - Duygu Analizleri</h3>
                      <button
                        onClick={() => setGenelDenemeView(null)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          background: 'white',
                          color: '#374151',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Kapat
                      </button>
                    </div>
                    {(() => {
                      // Değerlendirme verilerini filtrele
                      const denemelerWithDegerlendirme = genelDenemeList.filter(d => d.degerlendirme);
                      
                      if (denemelerWithDegerlendirme.length === 0) {
                        return (
                          <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>
                            Henüz değerlendirme verisi bulunmuyor.
                          </div>
                        );
                      }

                      // Filtreye göre denemeleri al
                      let filteredDenemeler = [...denemelerWithDegerlendirme];
                      if (genelDenemeFilter === 'son-3') {
                        filteredDenemeler = filteredDenemeler.slice(0, 3);
                      } else if (genelDenemeFilter === 'son-5') {
                        filteredDenemeler = filteredDenemeler.slice(0, 5);
                      } else if (genelDenemeFilter === 'son-10') {
                        filteredDenemeler = filteredDenemeler.slice(0, 10);
                      } else if (genelDenemeFilter === 'tum-denemeler') {
                        // Tüm denemeler - filtreleme yapma
                        filteredDenemeler = filteredDenemeler;
                      } else {
                        // son-deneme (varsayılan)
                        filteredDenemeler = filteredDenemeler.slice(0, 1);
                      }

                      const maxValue = 5; // 1-5 arası değerler
                      const chartHeight = 180;

                      return (
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 24}}>
                          {filteredDenemeler.map((deneme, index) => {
                            const zamanYeterli = deneme.degerlendirme?.zamanYeterli || 0;
                            const odaklanma = deneme.degerlendirme?.odaklanma || 0;
                            const kaygiDuzeyi = deneme.degerlendirme?.kaygiDuzeyi || 0;
                            const kendiniHissediyorsun = deneme.degerlendirme?.kendiniHissediyorsun || 0;
                            const enZorlayanDers = deneme.degerlendirme?.enZorlayanDers || '';

                            const metrics = [
                              { label: 'Kaygı', value: kaygiDuzeyi, color: '#ef4444' },
                              { label: 'Odak', value: odaklanma, color: '#10b981' },
                              { label: 'Zaman', value: zamanYeterli, color: '#3b82f6' },
                              { label: 'Enerji', value: kendiniHissediyorsun, color: '#f59e0b' }
                            ];

                            return (
                              <div key={deneme.id || index} style={{
                                background: 'white',
                                borderRadius: 16,
                                padding: 24,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb'
                              }}>
                                {/* Deneme Başlığı */}
                                <div style={{marginBottom: 20}}>
                                  <h4 style={{fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4}}>
                                    {deneme.denemeAdi}
                                  </h4>
                                  <div style={{fontSize: 14, color: '#6b7280'}}>
                                    {deneme.denemeTarihi}
                                  </div>
                                </div>

                                {/* Grafik */}
                                <div style={{background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16}}>
                                  <div style={{position: 'relative', height: chartHeight}}>
                                    {/* Y ekseni etiketleri */}
                                    <div style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: 30,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      paddingRight: 8
                                    }}>
                                      {[5, 4, 3, 2, 1, 0].map(val => (
                                        <div key={val} style={{fontSize: 11, color: '#6b7280', textAlign: 'right'}}>{val}</div>
                                      ))}
                                    </div>

                                    {/* Grafik alanı */}
                                    <div style={{
                                      marginLeft: 40,
                                      position: 'relative',
                                      height: chartHeight,
                                      borderLeft: '1px solid #e5e7eb',
                                      borderBottom: '1px solid #e5e7eb'
                                    }}>
                                      {/* Grid çizgileri */}
                                      {[1, 2, 3, 4, 5].map(val => (
                                        <div
                                          key={val}
                                          style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            bottom: `${(val / maxValue) * 100}%`,
                                            borderTop: '1px dashed #e5e7eb'
                                          }}
                                        />
                                      ))}

                                      {/* Metrik çubukları yan yana */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        height: '100%',
                                        padding: '0 30px',
                                        gap: 30,
                                        justifyContent: 'center',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0
                                      }}>
                                        {metrics.map((metric, metricIndex) => {
                                          const heightPx = chartHeight * (metric.value / maxValue);
                                          return (
                                            <div
                                              key={metricIndex}
                                              style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                maxWidth: 100,
                                                justifyContent: 'flex-end',
                                                height: '100%'
                                              }}
                                            >
                                              {/* Değer - Çubukların üstünde */}
                                              {metric.value > 0 && (
                                                <div style={{
                                                  marginBottom: 4,
                                                  fontSize: 14,
                                                  fontWeight: 700,
                                                  color: '#111827',
                                                  minHeight: '16px',
                                                  display: 'flex',
                                                  alignItems: 'center'
                                                }}>
                                                  {metric.value}
                                                </div>
                                              )}

                                              {/* Çubuk */}
                                              <div style={{
                                                width: '100%',
                                                background: metric.color,
                                                borderRadius: '4px 4px 0 0',
                                                height: `${heightPx}px`,
                                                minHeight: metric.value > 0 ? 4 : 0,
                                                position: 'relative',
                                                alignSelf: 'flex-end'
                                              }}>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    
                                    {/* Metrik etiketleri - Grafik alanının dışında */}
                                    <div style={{
                                      marginLeft: 40,
                                      marginTop: 12,
                                      display: 'flex',
                                      padding: '0 30px',
                                      gap: 30,
                                      justifyContent: 'center'
                                    }}>
                                      {metrics.map((metric, metricIndex) => (
                                        <div
                                          key={metricIndex}
                                          style={{
                                            flex: 1,
                                            maxWidth: 100,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#374151',
                                            textAlign: 'center'
                                          }}
                                        >
                                          {metric.label}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Zorlanan Ders */}
                                {enZorlayanDers && (
                                  <div style={{
                                    padding: 12,
                                    background: '#fef3c7',
                                    borderRadius: 8,
                                    border: '1px solid #fcd34d'
                                  }}>
                                    <div style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: '#92400e',
                                      marginBottom: 4
                                    }}>
                                      En Zorlanılan Ders:
                                    </div>
                                    <div style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: '#78350f'
                                    }}>
                                      {enZorlayanDers}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OgrenciPanel;
