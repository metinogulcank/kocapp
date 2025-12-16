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
  faChartLine,
  faLightbulb,
  faStickyNote,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import './OgretmenPanel.css';
import OgrenciProgramTab from './OgrenciProgramTab';
import Kaynaklar from './Kaynaklar';
import { EXAM_CATEGORY_OPTIONS, EXAM_SUBJECTS_BY_AREA } from '../constants/examSubjects';
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

const API_BASE = process.env.REACT_APP_API_URL || 'https://vedatdaglarmuhendislik.com.tr';
const API_UPDATE_STUDENT = `${API_BASE}/php-backend/api/update_student.php`;
const API_UPLOAD_PHOTO = `${API_BASE}/php-backend/api/upload_teacher_photo.php`;

// Alan kodunu (yks_say vb.) okunur etikete çevir
const formatAreaLabel = (area) => {
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

const getSubjectIcon = (ders) => {
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
  const [loading, setLoading] = useState(true);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [examCountdown, setExamCountdown] = useState({ days: 0, examName: '' });
  const [etutStats, setEtutStats] = useState({ yapilan: 0, yapilmayan: 0, toplam: 0 });
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
    { id: 'profil', icon: faUser, label: 'Profilim' }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'ogrenci') {
      navigate('/');
      return;
    }
    // Öğrencinin alanını branş denemesi formuna set et
    if (student?.alan && !bransDenemeForm.alan) {
      setBransDenemeForm(prev => ({ ...prev, alan: student.alan }));
    }

    fetchStudentInfo(user.id);
    fetchEtutStats(user.id);
    fetchDenemeNetleri(user.id);
  }, []);

  // Online durumu için heartbeat
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'ogrenci') return;

    let isMounted = true;

    const setOnline = async () => {
      try {
        await fetch(`${API_BASE}/php-backend/api/update_student_online_status.php`, {
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
      fetch(`${API_BASE}/php-backend/api/update_student_online_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, onlineStatus: 0 })
      }).catch(() => {});
    };
  }, []);

  // Menü değiştiğinde verileri yükle
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
  }, [activeMenu, student, selectedDersForIlerleme]);

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

  const fetchStudentInfo = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/php-backend/api/get_student_info.php?studentId=${studentId}`);
      const data = await response.json();
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

      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        let todayRequired = 0;
        let weekRequired = 0;
        let weekPending = 0;
        let totalSolved = 0;

        const allTimeResponse = await fetch(
          `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=2020-01-01&endDate=${todayStr}`
        );
        const allTimeData = await allTimeResponse.json();
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

      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();
      
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

      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();

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
          yapilmadi: 0
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
    });

    const statsWithPercentages = {};
    Object.keys(topicMap).forEach(topic => {
      const stats = topicMap[topic];
      const total = stats.total;
      statsWithPercentages[topic] = {
        ...stats,
        yapildiPercent: total > 0 ? Math.round((stats.yapildi / total) * 100) : 0,
        eksik_yapildiPercent: total > 0 ? Math.round((stats.eksik_yapildi / total) * 100) : 0,
        yapilmadiPercent: total > 0 ? Math.round((stats.yapilmadi / total) * 100) : 0
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
      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=2020-01-01&endDate=${todayStr}`
      );
      const data = await response.json();
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
      const res = await fetch(API_UPLOAD_PHOTO, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || 'Fotoğraf yüklenemedi');
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

      const res = await fetch(API_UPDATE_STUDENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
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
      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=2020-01-01&endDate=2099-12-31`
      );
      const data = await response.json();
      if (data.success && data.programs) {
        // Öğrencinin alanına göre ders listesini al (öğretmen paneli ile birebir)
        const studentArea = student.alan || 'yks_say';
        let studentSubjects = EXAM_SUBJECTS_BY_AREA[studentArea] || [];

        // YKS öğrencileri için TYT/AYT filtrelemesi
        if (studentArea.startsWith('yks_')) {
          if (dersBasariExamType === 'tyt') {
            studentSubjects = studentSubjects.filter(s => s.startsWith('TYT '));
          } else if (dersBasariExamType === 'ayt') {
            studentSubjects = studentSubjects.filter(s => s.startsWith('AYT '));
          }
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
              topicMap[konu] = { total: 0, yapildi: 0 };
            }
            topicMap[konu].total += soruSayisi;
            if (prog.durum === 'yapildi') {
              topicMap[konu].yapildi += soruSayisi;
            }
          });

          const yapildiPercent = totalSoru > 0 ? Math.round((yapildiSoru / totalSoru) * 100) : 0;
          stats[subject] = {
            total: totalSoru,
            yapildi: yapildiSoru,
            yapilmadi: totalSoru - yapildiSoru,
            yapildiPercent
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

      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        let yapilan = 0;
        let yapilmayan = 0;
        let toplam = 0;
        
        data.programs.forEach(prog => {
          toplam++;
          if (prog.durum === 'yapildi') {
            yapilan++;
          } else {
            yapilmayan++;
          }
        });
        
        setEtutStats({ yapilan, yapilmayan, toplam });
        updateMotivationMessage(yapilan, yapilmayan, toplam);
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
        const studentResponse = await fetch(`${API_BASE}/php-backend/api/get_student_info.php?studentId=${studentId}`);
        const studentData = await studentResponse.json();
        if (studentData.success && studentData.student) {
          studentAlan = studentData.student.alan;
        }
      } catch (err) {
        console.error('Öğrenci bilgisi alınamadı:', err);
      }
      
      const genelResponse = await fetch(`${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${studentId}`);
      const genelData = await genelResponse.json();
      
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
      
      const bransResponse = await fetch(`${API_BASE}/php-backend/api/get_brans_denemeleri.php?studentId=${studentId}`);
      const bransData = await bransResponse.json();
      
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
      const response = await fetch(
        `${API_BASE}/php-backend/api/get_konu_ilerlemesi.php?studentId=${studentIdForPayload}&ders=${encodeURIComponent(dersForPayload)}`
      );
      const data = await response.json();
      
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
      const response = await fetch(`${API_BASE}/php-backend/api/save_konu_ilerlemesi.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentIdForPayload,
          ders: dersForPayload,
          konular: konuIlerlemesi
        })
      });

      const data = await response.json();
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
  const bransAreaRaw = student?.alan || '';
  const bransArea = (bransAreaRaw || '').toLowerCase();
  const bransIsYks = bransArea.startsWith('yks');
  const bransDersListRaw = EXAM_SUBJECTS_BY_AREA[bransArea] || [];
  const bransDersList = bransIsYks 
    ? (bransExamType === 'tyt' 
        ? bransDersListRaw.filter(d => d.startsWith('TYT '))
        : bransDersListRaw.filter(d => d.startsWith('AYT ')))
    : bransDersListRaw;

  const handleBransFormChange = (field, value) => {
    setBransDenemeForm((prev) => ({
      ...prev,
      [field]: value
    }));
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
      const response = await fetch(
        `${API_BASE}/php-backend/api/get_konu_ilerlemesi.php?studentId=${student.id}&ders=${encodeURIComponent(dersName)}`
      );
      const data = await response.json();
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
      const response = await fetch(`${API_BASE}/php-backend/api/save_brans_deneme.php`, {
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
      const data = await response.json();
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
      const response = await fetch(
        `${API_BASE}/php-backend/api/get_brans_denemeleri.php?studentId=${student.id}`
      );
      const data = await response.json();
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
    
    setGenelDenemeKaydediliyor(true);
    try {
      const dersSonuclari = Object.entries(genelDenemeDersler).map(([ders, data]) => ({
        ders,
        soruSayisi: Number(data.soruSayisi) || 0,
        dogru: Number(data.dogru) || 0,
        yanlis: Number(data.yanlis) || 0,
        bos: Number(data.bos) || 0,
        net: Number(data.net) || 0
      }));

      const response = await fetch(`${API_BASE}/php-backend/api/save_genel_deneme.php`, {
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
      const data = await response.json();
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
      return { tytOrtalama: 0, aytOrtalama: 0 };
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
    } else {
      // son-deneme
      filteredDenemeler = filteredDenemeler.slice(0, 1);
    }

    console.log('Filtrelenmiş denemeler:', filteredDenemeler);

    // TYT ve AYT netlerini topla
    let tytToplamNet = 0;
    let tytSayisi = 0;
    let aytToplamNet = 0;
    let aytSayisi = 0;

    filteredDenemeler.forEach((deneme) => {
      const sinavTipi = deneme.sinavTipi || 'tyt';
      const dersSonuclari = deneme.dersSonuclari || {};
      
      console.log(`Deneme: ${deneme.denemeAdi}, sinavTipi: ${sinavTipi}, dersSonuclari:`, dersSonuclari);
      
      let toplamNet = 0;
      // Bir deneme TYT ise, o denemenin tüm derslerini topla (çünkü zaten TYT denemesi)
      // Aynı şekilde AYT denemesi için de tüm derslerini topla
      Object.entries(dersSonuclari).forEach(([ders, data]) => {
        // net değerini güvenli bir şekilde parse et
        let netValue = 0;
        if (data && data.net !== undefined && data.net !== null) {
          netValue = parseFloat(data.net) || 0;
        }
        
        // sinavTipi'ne göre filtrele: TYT denemesi için TYT dersleri, AYT denemesi için AYT dersleri
        if (sinavTipi === 'tyt' && ders.startsWith('TYT ')) {
          toplamNet += netValue;
          console.log(`  TYT Ders: ${ders}, net: ${netValue}, toplamNet: ${toplamNet}`);
        } else if (sinavTipi === 'ayt' && ders.startsWith('AYT ')) {
          toplamNet += netValue;
          console.log(`  AYT Ders: ${ders}, net: ${netValue}, toplamNet: ${toplamNet}`);
        } else {
          console.log(`  Atlandı: ${ders} (sinavTipi: ${sinavTipi}, ders TYT/AYT ile başlamıyor veya data:`, data);
        }
      });

      // sinavTipi'ne göre say, toplamNet > 0 kontrolünü kaldır (0 net olsa bile sayılmalı)
      if (sinavTipi === 'tyt') {
        tytToplamNet += toplamNet;
        tytSayisi++;
        console.log(`TYT Deneme: ${deneme.denemeAdi}, toplamNet: ${toplamNet}, tytToplamNet: ${tytToplamNet}, tytSayisi: ${tytSayisi}`);
      } else if (sinavTipi === 'ayt') {
        aytToplamNet += toplamNet;
        aytSayisi++;
        console.log(`AYT Deneme: ${deneme.denemeAdi}, toplamNet: ${toplamNet}, aytToplamNet: ${aytToplamNet}, aytSayisi: ${aytSayisi}`);
      } else {
        console.log(`Bilinmeyen sinavTipi: ${sinavTipi} için deneme: ${deneme.denemeAdi}`);
      }
    });

    const tytOrtalama = tytSayisi > 0 ? parseFloat((tytToplamNet / tytSayisi).toFixed(2)) : 0;
    const aytOrtalama = aytSayisi > 0 ? parseFloat((aytToplamNet / aytSayisi).toFixed(2)) : 0;

    console.log(`Ortalama Hesaplama Sonuç: tytToplamNet=${tytToplamNet}, tytSayisi=${tytSayisi}, tytOrtalama=${tytOrtalama}, aytToplamNet=${aytToplamNet}, aytSayisi=${aytSayisi}, aytOrtalama=${aytOrtalama}`);

    return { tytOrtalama, aytOrtalama };
  }, [genelDenemeList, genelDenemeFilter]);

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
      const response = await fetch(url);
      const data = await response.json();
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
        await fetch(`${API_BASE}/php-backend/api/update_student_online_status.php`, {
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
  const etutTotal = etutStats.toplam || (etutStats.yapilan + etutStats.yapilmayan);
  const yapilanYuzde = etutTotal > 0 ? (etutStats.yapilan / etutTotal) * 100 : 0;

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
                  background: `conic-gradient(
                    #10b981 0% ${yapilanYuzde}%,
                    #ef4444 ${yapilanYuzde}% 100%
                  )`,
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
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ color: '#6b7280' }}>Yapılan: {etutStats.yapilan}</span>
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
                        {(() => {
                          const studentArea = student?.alan || '';
                          const isYks = studentArea.startsWith('yks_');
                          
                          if (isYks) {
                            return (
                              <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                                <h4 style={{fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                                  <span style={{width: 4, height: 24, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', borderRadius: 2}}></span>
                                  YKS
                                </h4>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                                  <button
                                    onClick={() => {
                                      setSelectedQuestionExamArea('tyt');
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
                                    TYT
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedQuestionExamArea('ayt');
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
                                    AYT
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          
                          // Diğer sınavlar
                          return EXAM_CATEGORY_OPTIONS.map((group) => {
                            if (group.label === 'YKS') return null;
                            
                            const visibleOptions = group.options.filter((option) => {
                              return !studentArea || option.value === studentArea;
                            });

                            if (visibleOptions.length === 0) return null;

                            return (
                              <div key={group.label} style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                                <h4 style={{fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                                  <span style={{width: 4, height: 24, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', borderRadius: 2}}></span>
                                  {group.label}
                                </h4>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                                  {visibleOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() => {
                                        setSelectedQuestionExamArea(option.value);
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
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
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
                              {selectedQuestionExamArea === 'tyt' ? 'TYT Soru Dağılımı' : 
                               selectedQuestionExamArea === 'ayt' ? 'AYT Soru Dağılımı' :
                               EXAM_CATEGORY_OPTIONS.flatMap(g => g.options).find(o => o.value === selectedQuestionExamArea)?.label || 'Soru Dağılımı'}
                            </h3>
                          </div>

                          {/* Ders Bazlı Bar Grafikleri */}
                          <div style={{display: 'flex', gap: 32, minHeight: '450px', padding: '40px 20px', position: 'relative'}}>
                            <div style={{flex: 1, display: 'flex', alignItems: 'flex-end', gap: 24, justifyContent: 'center'}}>
                              {Object.entries(questionDistributionStats)
                                .filter(([subject, stats]) => stats.yapildi > 0)
                                .length === 0 ? (
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
                                ) : (
                                  Object.entries(questionDistributionStats)
                                    .filter(([subject, stats]) => stats.yapildi > 0)
                                    .sort((a, b) => b[1].yapildi - a[1].yapildi)
                                    .map(([subject, stats]) => {
                                      const maxValue = Math.max(...Object.values(questionDistributionStats).map(s => s.yapildi || 0), 1);
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
                                              borderRadius: '999px 999px 0 0',
                                              background: 'linear-gradient(180deg, #6a1b9a, #8e24aa)',
                                              boxShadow: '0 8px 20px rgba(106,27,154,0.3)',
                                              position: 'relative',
                                              overflow: 'hidden'
                                            }}>
                                              <div style={{
                                                position: 'absolute',
                                                top: -28,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: 'white',
                                                borderRadius: 999,
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
                                    })
                                )}
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
                        {(() => {
                          const studentArea = student?.alan || '';
                          const isYks = studentArea.startsWith('yks_');
                          if (isYks) {
                            return (
                              <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                                <h4 style={{fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                                  <span style={{width: 4, height: 24, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', borderRadius: 2}}></span>
                                  YKS
                                </h4>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                                  <button
                                    onClick={() => {
                                      setSelectedExamArea('tyt');
                                      setSelectedSubject(null);
                                      setTopicStats({});
                                    }}
                                    style={{
                                      padding: '14px 24px',
                                      background: 'linear-gradient(135deg, #f9fafb, #ffffff)',
                                      border: '2px solid #e5e7eb',
                                      borderRadius: 12,
                                      cursor: 'pointer',
                                      fontSize: '15px',
                                      fontWeight: 600,
                                      color: '#374151'
                                    }}
                                  >
                                    TYT
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedExamArea('ayt');
                                      setSelectedSubject(null);
                                      setTopicStats({});
                                    }}
                                    style={{
                                      padding: '14px 24px',
                                      background: 'linear-gradient(135deg, #f9fafb, #ffffff)',
                                      border: '2px solid #e5e7eb',
                                      borderRadius: 12,
                                      cursor: 'pointer',
                                      fontSize: '15px',
                                      fontWeight: 600,
                                      color: '#374151'
                                    }}
                                  >
                                    AYT
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return EXAM_CATEGORY_OPTIONS.map((group) => {
                            if (group.label === 'YKS') return null;
                            const visibleOptions = group.options.filter((option) => !studentArea || option.value === studentArea);
                            if (visibleOptions.length === 0) return null;
                            return (
                              <div key={group.label} style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                                <h4 style={{fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                                  <span style={{width: 4, height: 24, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', borderRadius: 2}}></span>
                                  {group.label}
                                </h4>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                                  {visibleOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() => {
                                        setSelectedExamArea(option.value);
                                        setSelectedSubject(null);
                                        setTopicStats({});
                                      }}
                                      style={{
                                        padding: '14px 24px',
                                        background: 'linear-gradient(135deg, #f9fafb, #ffffff)',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 12,
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: '#374151'
                                      }}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
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
                            {selectedExamArea === 'tyt' ? 'TYT Konu Dağılımı' : 
                             selectedExamArea === 'ayt' ? 'AYT Konu Dağılımı' :
                             EXAM_CATEGORY_OPTIONS.flatMap(g => g.options).find(o => o.value === selectedExamArea)?.label || 'Ders Seçin'}
                          </h3>
                          <p style={{fontSize: '14px', color: '#6b7280'}}>Ders seçerek konu analizine başlayın</p>
                        </div>
                      </div>
                      
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16}}>
                        {(() => {
                          let subjects = [];
                          if (selectedExamArea === 'tyt') {
                            subjects = EXAM_SUBJECTS_BY_AREA['yks_tyt'] || [];
                          } else if (selectedExamArea === 'ayt') {
                            const studentArea = student?.alan || '';
                            if (studentArea && studentArea.startsWith('yks_')) {
                              const allSubjects = EXAM_SUBJECTS_BY_AREA[studentArea] || [];
                              subjects = allSubjects.filter(s => s.startsWith('AYT '));
                            }
                          } else {
                            subjects = EXAM_SUBJECTS_BY_AREA[selectedExamArea] || [];
                          }
                          return subjects;
                        })().map((subject) => {
                          const hasPrograms = allPrograms.some(prog => prog.ders === subject);
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
                            .sort((a, b) => (b[1].total || 0) - (a[1].total || 0))
                            .map(([konu, stats]) => {
                              const topicPercent = stats.total > 0 ? Math.round((stats.yapildi / stats.total) * 100) : 0;
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
                                    <span>Çözülen: <strong style={{color: '#10b981'}}>{stats.yapildi}</strong></span>
                                    <span>Verilen: <strong style={{color: '#1f2937'}}>{stats.total}</strong></span>
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

                    {/* TYT/AYT sekmeleri - Sadece YKS öğrencileri için */}
                    {student?.alan?.startsWith('yks_') && (
                      <div style={{display: 'flex', gap: 8, background: 'white', padding: 4, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                        <button 
                          onClick={() => setDersBasariExamType('tyt')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 8,
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: dersBasariExamType === 'tyt' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                            color: dersBasariExamType === 'tyt' ? 'white' : '#6b7280'
                          }}
                          onMouseEnter={(e) => {
                            if (dersBasariExamType !== 'tyt') {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#374151';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (dersBasariExamType !== 'tyt') {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#6b7280';
                            }
                          }}
                        >
                          TYT
                        </button>
                        <button 
                          onClick={() => setDersBasariExamType('ayt')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 8,
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: dersBasariExamType === 'ayt' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                            color: dersBasariExamType === 'ayt' ? 'white' : '#6b7280'
                          }}
                          onMouseEnter={(e) => {
                            if (dersBasariExamType !== 'ayt') {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#374151';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (dersBasariExamType !== 'ayt') {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#6b7280';
                            }
                          }}
                        >
                          AYT
                        </button>
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
                        const iconSrc = getSubjectIcon(ders);
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
                            .sort((a, b) => b[1].total - a[1].total)
                            .map(([konu, topicStats]) => {
                              const topicPercent = topicStats.total > 0
                                ? Math.round((topicStats.yapildi / topicStats.total) * 100)
                                : 0;
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
                                    <span>Çözülen: <strong style={{color: '#10b981'}}>{topicStats.yapildi}</strong></span>
                                    <span>Verilen: <strong style={{color: '#1f2937'}}>{topicStats.total}</strong></span>
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
                  
                  {student?.alan?.startsWith('yks_') && (
                    <div style={{display: 'flex', gap: 8, background: 'white', padding: 4, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                      <button
                        onClick={() => {
                          setIlerlemeExamType('tyt');
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
                          background: ilerlemeExamType === 'tyt' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                          color: ilerlemeExamType === 'tyt' ? 'white' : '#6b7280'
                        }}
                      >
                        TYT
                      </button>
                      <button
                        onClick={() => {
                          setIlerlemeExamType('ayt');
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
                          background: ilerlemeExamType === 'ayt' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                          color: ilerlemeExamType === 'ayt' ? 'white' : '#6b7280'
                        }}
                      >
                        AYT
                      </button>
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
                        const studentArea = student.alan || 'yks_say';
                        let studentSubjects = EXAM_SUBJECTS_BY_AREA[studentArea] || [];
                        
                        if (studentArea.startsWith('yks_')) {
                          if (ilerlemeExamType === 'tyt') {
                            studentSubjects = studentSubjects.filter(s => s.startsWith('TYT '));
                          } else if (ilerlemeExamType === 'ayt') {
                            studentSubjects = studentSubjects.filter(s => s.startsWith('AYT '));
                          }
                        }
                        
                        return studentSubjects.map((ders) => {
                          const iconSrc = getSubjectIcon(ders);
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
                          {getSubjectIcon(selectedDersForIlerleme) && (
                            <img
                              src={getSubjectIcon(selectedDersForIlerleme)}
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
                      {bransIsYks ? 'YKS öğrencileri için branş denemesi sonucu ekle, konu bazlı başarıyı takip et.' : 'Branş denemesi sonucu ekle, konu bazlı başarıyı takip et.'}
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
                      {bransIsYks && (
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
                            <option value="tyt">TYT</option>
                            <option value="ayt">AYT</option>
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
                  </select>
                </div>

                {/* Ortalama Kartları - YKS için TYT/AYT, diğerleri için tek kart */}
                {(() => {
                  const studentAreaRaw = student?.alan || '';
                  const studentArea = (studentAreaRaw || '').toLowerCase();
                  const isYks = studentArea.startsWith('yks');
                  
                  // LGS için ortalama hesaplama (tüm denemelerin ortalaması)
                  let lgsOrtalama = 0;
                  if (!isYks) {
                    const filtered = genelDenemeList.filter(d => {
                      if (genelDenemeFilter === 'son-deneme') return true;
                      const count = parseInt(genelDenemeFilter.replace('son-', ''));
                      return genelDenemeList.indexOf(d) < count;
                    });
                    if (filtered.length > 0) {
                      const toplamNet = filtered.reduce((sum, d) => {
                        const dersler = d.dersler || {};
                        return sum + Object.values(dersler).reduce((dersSum, dersData) => {
                          return dersSum + (Number(dersData.net) || 0);
                        }, 0);
                      }, 0);
                      const toplamDers = filtered.reduce((sum, d) => {
                        return sum + Object.keys(d.dersler || {}).length;
                      }, 0);
                      lgsOrtalama = toplamDers > 0 ? parseFloat((toplamNet / toplamDers).toFixed(2)) : 0;
                    }
                  }

                  if (isYks) {
                    return (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32}}>
                        {/* TYT Ortalama */}
                        <div style={{
                          background: 'white',
                          borderRadius: 16,
                          padding: 32,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 16}}>TYT Deneme Ortalaması</div>
                          <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>
                            {calculateGenelDenemeOrtalamalari.tytOrtalama}
                          </div>
                          <div style={{fontSize: 20, fontWeight: 600, color: '#6b7280', marginTop: 8}}>Net</div>
                        </div>

                        {/* AYT Ortalama */}
                        <div style={{
                          background: 'white',
                          borderRadius: 16,
                          padding: 32,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 16}}>AYT Deneme Ortalaması</div>
                          <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>
                            {calculateGenelDenemeOrtalamalari.aytOrtalama}
                          </div>
                          <div style={{fontSize: 20, fontWeight: 600, color: '#6b7280', marginTop: 8}}>Net</div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32, maxWidth: 600}}>
                        <div style={{
                          background: 'white',
                          borderRadius: 16,
                          padding: 32,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 16}}>
                            {studentArea === 'lgs' ? 'LGS' : formatAreaLabel(studentAreaRaw)} Deneme Ortalaması
                          </div>
                          <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>{lgsOrtalama}</div>
                          <div style={{fontSize: 20, fontWeight: 600, color: '#6b7280', marginTop: 8}}>Net</div>
                        </div>
                      </div>
                    );
                  }
                })()}

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
                      const studentAreaRaw = student?.alan || '';
                      const studentArea = (studentAreaRaw || '').toLowerCase();
                      const isYks = studentArea.startsWith('yks');
                      const genelDenemeDersList = studentAreaRaw ? (EXAM_SUBJECTS_BY_AREA[studentAreaRaw] || []) : [];
                      
                      return (
                        <>
                          {/* Deneme Bilgileri */}
                          <div style={{display: 'grid', gridTemplateColumns: isYks ? '1fr 1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 24}}>
                            {isYks && (
                              <div>
                                <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Sınav Tipi</label>
                                <select
                                  value={genelDenemeForm.sinavTipi || 'tyt'}
                                  onChange={(e) => {
                                    setGenelDenemeForm(prev => ({ ...prev, sinavTipi: e.target.value }));
                                    setGenelDenemeDersler({});
                                  }}
                                  style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
                                >
                                  <option value="tyt">TYT</option>
                                  <option value="ayt">AYT</option>
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
                              {genelDenemeDersList.filter((ders) => {
                                if (!isYks) return true; // YKS değilse tüm dersleri göster
                                const sinavTipi = genelDenemeForm.sinavTipi || 'tyt';
                                return sinavTipi === 'tyt' ? ders.startsWith('TYT ') : ders.startsWith('AYT ');
                              }).map((ders) => {
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
                                  const studentArea = student?.alan || '';
                                  const dersList = studentArea ? (EXAM_SUBJECTS_BY_AREA[studentArea] || []) : [];
                                  return dersList.map((ders) => (
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
                    {genelDenemeListLoading ? (
                      <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Yükleniyor...</div>
                    ) : genelDenemeList.length === 0 ? (
                      <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Henüz kayıtlı deneme yok.</div>
                    ) : (
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20}}>
                        {genelDenemeList.map((deneme) => {
                          const toplamNet = Object.values(deneme.dersSonuclari || {}).reduce((sum, d) => sum + (Number(d.net) || 0), 0);
                          return (
                            <div key={deneme.id} style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#f9fafb'}}>
                              <div style={{marginBottom: 16}}>
                                <div style={{fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4}}>{deneme.denemeAdi}</div>
                                <div style={{fontSize: 14, color: '#6b7280'}}>{deneme.denemeTarihi}</div>
                                <div style={{marginTop: 8, fontSize: 16, fontWeight: 700, color: '#6a1b9a'}}>Toplam Net: {toplamNet.toFixed(2)}</div>
                              </div>
                              <div style={{height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, paddingBottom: 20}}>
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
                                          position: 'relative'
                                        }}
                                        title={`${ders}: ${net.toFixed(2)}`}
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
                                          {net.toFixed(1)}
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
                    <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>
                      Analiz içeriği buraya gelecek.
                    </div>
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