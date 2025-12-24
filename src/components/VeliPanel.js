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
  faMoneyBill,
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

const VeliPanel = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('ana-sayfa');
  const [parent, setParent] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Widget Data States
  const [motivationMessage, setMotivationMessage] = useState('');
  const [examCountdown, setExamCountdown] = useState({ days: 0, examName: '' });
  const [etutStats, setEtutStats] = useState({ yapilan: 0, eksikYapildi: 0, yapilmayan: 0, toplam: 0 });
  const [denemeNetleri, setDenemeNetleri] = useState(null);
  const [etutStatsLoading, setEtutStatsLoading] = useState(true);
  const [denemeLoading, setDenemeLoading] = useState(true);

  // Placeholders for other features' states (to be implemented)
  const [bransView, setBransView] = useState('charts'); // Default to charts for Veli
  const [genelDenemeView, setGenelDenemeView] = useState('grafikler'); // Default to charts
  const [questionStats, setQuestionStats] = useState({ todayRequired: 0, weekRequired: 0, weekPending: 0, totalSolved: 0 });
  const [questionStatsLoading, setQuestionStatsLoading] = useState(false);
  const [activeQuestionTab, setActiveQuestionTab] = useState('konu-dagilimi');
  const [selectedQuestionExamArea, setSelectedQuestionExamArea] = useState(null);
  const [questionDistributionPeriod, setQuestionDistributionPeriod] = useState('gunluk');
  const [questionDistributionStats, setQuestionDistributionStats] = useState({});
  const [questionDistributionLoading, setQuestionDistributionLoading] = useState(false);
  const [timeDistributionStats, setTimeDistributionStats] = useState({ daily: {}, weekly: [], weeklyDaily: {} });
  const [timeDistributionLoading, setTimeDistributionLoading] = useState(false);
  const [selectedWeeklyPeriod, setSelectedWeeklyPeriod] = useState('current');
  const [selectedExamArea, setSelectedExamArea] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topicStats, setTopicStats] = useState({});
  const [topicStatsLoading, setTopicStatsLoading] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);
  const [dersBasariLoading, setDersBasariLoading] = useState(false);
  const [dersBasariStats, setDersBasariStats] = useState({});
  const [dersDetailTopics, setDersDetailTopics] = useState({});
  const [dersBasariExamType, setDersBasariExamType] = useState('tyt');
  const [selectedDersForDetail, setSelectedDersForDetail] = useState(null);
  const [showDersDetailModal, setShowDersDetailModal] = useState(false);
  const [selectedDersForIlerleme, setSelectedDersForIlerleme] = useState(null);
  const [ilerlemeExamType, setIlerlemeExamType] = useState('tyt');
  const [konuIlerlemesi, setKonuIlerlemesi] = useState([]);
  const [konuIlerlemesiLoading, setKonuIlerlemesiLoading] = useState(false);
  const [bransDenemeList, setBransDenemeList] = useState([]);
  const [bransDenemelerLoading, setBransDenemelerLoading] = useState(false);
  const [genelDenemeFilter, setGenelDenemeFilter] = useState('son-deneme');
  const [genelDenemeList, setGenelDenemeList] = useState([]);
  const [genelDenemeListLoading, setGenelDenemeListLoading] = useState(false);
  const [denemeGrafikTab, setDenemeGrafikTab] = useState('genel');
  const [dersBazliGrafikSinavTipi, setDersBazliGrafikSinavTipi] = useState('tyt');
  const [dersBazliGrafikFiltre, setDersBazliGrafikFiltre] = useState('net');
  const [parentForm, setParentForm] = useState({ firstName: '', lastName: '', email: '', phone: '', newPassword: '', newPasswordConfirm: '' });
  const [parentSaving, setParentSaving] = useState(false);
  const [parentSaveMessage, setParentSaveMessage] = useState('');
  const [parentSaveError, setParentSaveError] = useState('');
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentsFilter, setPaymentsFilter] = useState('tum');
  
  const menuItems = [
    { id: 'ana-sayfa', icon: faHome, label: 'Ana Sayfa' },
    { id: 'plan-program', icon: faBook, label: 'Plan/ Program' },
    { id: 'gunluk-soru', icon: faStickyNote, label: 'Soru/Süre/Konu Dağılımı' },
    { id: 'ders-basari', icon: faTrophy, label: 'Ders/Konu Bazlı Başarım' },
    { id: 'konu-ilerlemesi', icon: faClipboardList, label: 'Kaynak ve Konu İlerlemesi' },
    { id: 'brans-denemeleri', icon: faBullseye, label: 'Branş Denemeleri' },
    { id: 'genel-denemeler', icon: faClock, label: 'Genel Denemeler' },
    { id: 'muhasebe', icon: faMoneyBill, label: 'Muhasebe' },
    { id: 'profil', icon: faUser, label: 'Profilim' }
  ];

  const fetchParentInfoByStudentId = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE}/php-backend/api/get_parent_info.php?studentId=${studentId}`);
      const data = await res.json();
      if (data && data.success && data.parent) {
        const p = data.parent;
        const normalized = {
          id: p._id,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: p.email || '',
          phone: p.phone || ''
        };
        setParent(normalized);
        setParentForm(f => ({
          ...f,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          email: normalized.email,
          phone: normalized.phone
        }));
        try {
          const currentUser = JSON.parse(localStorage.getItem('user')) || {};
          localStorage.setItem('user', JSON.stringify({ ...currentUser, ...normalized }));
        } catch {}
      }
    } catch (e) {
      // Sessizce geç
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'veli') {
      navigate('/');
      return;
    }
    setParent(user);
    
    // Öğrenci ID'sini bul
    const studentId = user.studentId || user.student_id || user.linkedStudentId;

    const loadByStudentId = (sid) => {
      fetchStudentInfo(sid);
      fetchEtutStats(sid);
      fetchDenemeNetleri(sid);
      fetchParentInfoByStudentId(sid);
    };

    if (studentId) {
      loadByStudentId(studentId);
    } else {
      // Fallback: Parent ID ile öğrenci bilgisi çek
      fetch(`${API_BASE}/php-backend/api/get_student_by_parent.php?parentId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.student && data.student.id) {
            setStudent(data.student);
            const sid = data.student.id;
            // localStorage'taki user içine da yaz (gelecek oturumlar için)
            try {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              localStorage.setItem('user', JSON.stringify({ ...currentUser, studentId: sid, linkedStudentId: sid }));
            } catch (e) {}
            loadByStudentId(sid);
          } else {
            console.warn('Veliye bağlı öğrenci ID bulunamadı.');
            setLoading(false);
            setEtutStatsLoading(false);
            setDenemeLoading(false);
            setMotivationMessage("Öğrenci bilgisi bulunamadı.");
          }
        })
        .catch(() => {
          console.warn('Veliye bağlı öğrenci ID bulunamadı.');
          setLoading(false);
          setEtutStatsLoading(false);
          setDenemeLoading(false);
          setMotivationMessage("Öğrenci bilgisi bulunamadı.");
        });
    }
  }, [navigate]);

  useEffect(() => {
    if (activeMenu === 'gunluk-soru' && student?.id) {
      fetchQuestionStatsForStudent(student.id);
    }
  }, [activeMenu, student]);

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

  useEffect(() => {
    if (selectedSubject && allPrograms.length > 0) {
      const stats = calculateTopicStatsForStudent(selectedSubject);
      setTopicStats(stats);
    } else if (selectedSubject && allPrograms.length === 0) {
      setTopicStats({});
    }
  }, [selectedSubject, allPrograms]);

  useEffect(() => {
    if (activeMenu === 'ders-basari' && student?.id) {
      fetchDersBasariStatsForStudent(student.id);
    }
  }, [activeMenu, student, dersBasariExamType]);
  
  useEffect(() => {
    if (activeMenu === 'konu-ilerlemesi' && selectedDersForIlerleme) {
      fetchKonuIlerlemesi();
    }
  }, [activeMenu, selectedDersForIlerleme]);
  
  useEffect(() => {
    if (activeMenu === 'brans-denemeleri' && student?.id) {
      fetchBransDenemeleri();
    }
  }, [activeMenu, student]);
  
  useEffect(() => {
    if (activeMenu === 'genel-denemeler' && student?.id) {
      fetchGenelDenemeler();
    }
  }, [activeMenu, student]);
  useEffect(() => {
    if (activeMenu !== 'muhasebe') return;
    const odemelerData = [
      { tarih: '2025-11-05', tutar: 2500, yontem: 'Banka EFT', aciklama: 'Kasım taksit' },
      { tarih: '2025-10-05', tutar: 2500, yontem: 'Kredi Kartı', aciklama: 'Ekim taksit' },
      { tarih: '2025-09-05', tutar: 2500, yontem: 'Nakit', aciklama: 'Eylül taksit' },
      { tarih: '2025-08-05', tutar: 2500, yontem: 'Banka EFT', aciklama: 'Ağustos taksit' }
    ];
    const bekleyenData = [
      { sonTarih: '2026-01-15', tutar: 1500, aciklama: 'Ocak taksit' },
      { sonTarih: '2026-02-15', tutar: 1500, aciklama: 'Şubat taksit' }
    ];
    setPayments(odemelerData);
    setPendingPayments(bekleyenData);
  }, [activeMenu]);
  
  useEffect(() => {
    if (parent) {
      setParentForm({
        firstName: parent.firstName || '',
        lastName: parent.lastName || '',
        email: parent.email || '',
        phone: parent.phone || '',
        newPassword: '',
        newPasswordConfirm: ''
      });
    }
  }, [parent]);

  const fetchStudentInfo = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/php-backend/api/get_student_info.php?studentId=${studentId}`);
      const data = await response.json();
      if (data.success && data.student) {
        setStudent(data.student);
        
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

  const fetchQuestionStatsForStudent = async (studentId) => {
    setQuestionStatsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (data.success && data.programs) {
        let todayRequired = 0;
        let weekRequired = 0;
        let weekPending = 0;
        let totalSolved = 0;
        const allTimeResponse = await fetch(`${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=2020-01-01&endDate=${todayStr}`);
        const allTimeData = await allTimeResponse.json();
        const allProgramsAllTime = allTimeData.success ? allTimeData.programs : [];
        allProgramsAllTime.forEach(prog => {
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
        setQuestionStats({ todayRequired, weekRequired, weekPending, totalSolved });
      }
    } catch (err) {
      setQuestionStats({ todayRequired: 0, weekRequired: 0, weekPending: 0, totalSolved: 0 });
    } finally {
      setQuestionStatsLoading(false);
    }
  };

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
          weekStart.setDate(today.getDate() - today.getDay() + 1);
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
      const response = await fetch(`${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=${startDateStr}&endDate=${endDateStr}`);
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
            const programKey = prog.id ? `prog_${prog.id}` : prog.routine_id ? `routine_${prog.routine_id}_${prog.tarih}_${prog.ders}_${soruSayisi}` : `${prog.tarih}_${prog.ders}_${prog.baslangic_saati}_${soruSayisi}`;
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
      const response = await fetch(`${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=${startDateStr}&endDate=${endDateStr}`);
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
                const weekStartRef = new Date(startDate);
                const daysDiff = Math.floor((date - weekStartRef) / (1000 * 60 * 60 * 24));
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
        const weeklyArray = Object.entries(weeklyMap).map(([week, totalHours]) => ({ week: parseInt(week, 10), totalHours: Math.round(totalHours * 10) / 10 })).sort((a, b) => a.week - b.week);
        const weeklyDailyRounded = { prev: {}, current: {}, next: {} };
        Object.keys(weeklyDailyMap).forEach(period => {
          Object.keys(weeklyDailyMap[period]).forEach(day => {
            weeklyDailyRounded[period][day] = Math.round(weeklyDailyMap[period][day] * 10) / 10;
          });
        });
        setTimeDistributionStats({ daily: {}, weekly: weeklyArray, weeklyDaily: weeklyDailyRounded });
      }
    } finally {
      setTimeDistributionLoading(false);
    }
  };

  const calculateTopicStatsForStudent = (subject) => {
    if (!subject || !allPrograms.length) return {};
    const subjectPrograms = allPrograms.filter(prog => prog.ders === subject);
    const topicMap = {};
    subjectPrograms.forEach(prog => {
      const topic = prog.konu || 'Belirtilmemiş';
      if (!topicMap[topic]) {
        topicMap[topic] = { total: 0, yapildi: 0, eksik_yapildi: 0, yapilmadi: 0 };
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

  const fetchAllProgramsForStudent = async () => {
    if (!student || !student.id) return;
    setTopicStatsLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE}/php-backend/api/get_student_program.php?studentId=${student.id}&startDate=2020-01-01&endDate=${todayStr}`);
      const data = await response.json();
      if (data.success && data.programs) {
        setAllPrograms(data.programs);
      } else {
        setAllPrograms([]);
      }
    } finally {
      setTopicStatsLoading(false);
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

  const fetchDersBasariStatsForStudent = async (studentId) => {
    setDersBasariLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${studentId}&startDate=2020-01-01&endDate=2099-12-31`
      );
      const data = await response.json();
      if (data.success && data.programs) {
        const studentArea = student?.alan || 'yks_say';
        let studentSubjects = EXAM_SUBJECTS_BY_AREA[studentArea] || [];
        if (studentArea.startsWith('yks_')) {
          if (dersBasariExamType === 'tyt') {
            studentSubjects = studentSubjects.filter(s => s.startsWith('TYT '));
          } else if (dersBasariExamType === 'ayt') {
            studentSubjects = studentSubjects.filter(s => s.startsWith('AYT '));
          }
        }
        const stats = {};
        const dersDetailMap = {};
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
            if (d || y || b) {
              topicMap[konu].dogru += d;
              topicMap[konu].yanlis += y;
              topicMap[konu].bos += b;
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
        setDersDetailTopics({});
      }
    } catch (err) {
      setDersBasariStats({});
      setDersDetailTopics({});
    } finally {
      setDersBasariLoading(false);
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
      setMotivationMessage("Bugün harika gidiyorsun! 👏");
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
      const genelResponse = await fetch(`${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${studentId}`);
      const genelData = await genelResponse.json();
      
      if (genelData.success && genelData.denemeler && genelData.denemeler.length > 0) {
        let sonDeneme = genelData.denemeler[0];
        
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

  const getConicGradient = () => {
    if (!etutStats.toplam) return '#e5e7eb'; // Gri (boş)

    const yapilanYuzde = (etutStats.yapilan / etutStats.toplam) * 100;
    const eksikYuzde = (etutStats.eksikYapildi / etutStats.toplam) * 100;
    const yapilmayanYuzde = (etutStats.yapilmayan / etutStats.toplam) * 100;

    let currentAngle = 0;
    const parts = [];

    if (yapilanYuzde > 0) {
      parts.push(`#10b981 0% ${yapilanYuzde}%`);
    }
    
    const eksikStart = yapilanYuzde;
    const eksikEnd = yapilanYuzde + eksikYuzde;
    
    if (eksikYuzde > 0) {
      parts.push(`#f59e0b ${eksikStart}% ${eksikEnd}%`);
    }
    
    const yapilmayanStart = eksikEnd;
    
    if (yapilmayanYuzde > 0) {
      parts.push(`#ef4444 ${yapilmayanStart}% 100%`);
    }
    
    if (parts.length === 0) {
      return '#e5e7eb';
    }
    
    return `conic-gradient(${parts.join(', ')})`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // ---------------- RENDER METHODS ----------------

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
            Hoş Geldin, {parent?.firstName || 'Veli'}! 👋
          </h2>
          <p style={{ margin: 0, fontSize: '18px', opacity: 0.95 }}>
            {motivationMessage || 'Öğrencinizin gelişimini buradan takip edebilirsiniz.'}
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
                    {etutStats.toplam}
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
      </div>
    </div>
  );

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
  
  const calculateYuzde = (kaynaklar) => {
    if (!kaynaklar || kaynaklar.length === 0) return 0;
    const tamamlanan = kaynaklar.filter(k => k.tamamlandi).length;
    return Math.round((tamamlanan / kaynaklar.length) * 100);
  };
  
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
      } else {
        setBransDenemeList([]);
      }
    } catch (err) {
      setBransDenemeList([]);
    } finally {
      setBransDenemelerLoading(false);
    }
  };
  
  const bransBasariColor = (yuzde) => {
    const clamped = Math.max(0, Math.min(100, yuzde || 0));
    const red = Math.round(239 - (clamped / 100) * 139);
    const green = Math.round(68 + (clamped / 100) * 113);
    return `rgb(${red}, ${green}, 68)`;
  };
  
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
  
  const genelNetColor = (net, maxNet) => {
    const denom = maxNet > 0 ? maxNet : 1;
    const ratio = Math.max(0, Math.min(1, net / denom));
    const red = Math.round(239 - ratio * 139);
    const green = Math.round(68 + ratio * 113);
    return `rgb(${red}, ${green}, 68)`;
  };
  
  const calculateGenelDenemeOrtalamalari = useMemo(() => {
    if (!genelDenemeList || genelDenemeList.length === 0) {
      return { tytOrtalama: 0, aytOrtalama: 0, digerOrtalama: 0 };
    }
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
    let tytToplamNet = 0;
    let tytSayisi = 0;
    let aytToplamNet = 0;
    let aytSayisi = 0;
    let digerToplamNet = 0;
    let digerSayisi = 0;
    filteredDenemeler.forEach((deneme) => {
      const sinavTipi = (deneme.sinavTipi || 'tyt').toLowerCase();
      const dersSonuclari = deneme.dersSonuclari || {};
      let toplamNet = 0;
      if (sinavTipi === 'tyt' || sinavTipi === 'ayt') {
        Object.entries(dersSonuclari).forEach(([ders, data]) => {
          let netValue = 0;
          if (data && data.net !== undefined && data.net !== null) {
            netValue = parseFloat(data.net) || 0;
          }
          if (sinavTipi === 'tyt' && ders.startsWith('TYT ')) {
            toplamNet += netValue;
          } else if (sinavTipi === 'ayt' && ders.startsWith('AYT ')) {
            toplamNet += netValue;
          }
        });
      } else {
        Object.entries(dersSonuclari).forEach(([, data]) => {
          let netValue = 0;
          if (data && data.net !== undefined && data.net !== null) {
            netValue = parseFloat(data.net) || 0;
          }
          toplamNet += netValue;
        });
      }
      if (sinavTipi === 'tyt') {
        tytToplamNet += toplamNet;
        tytSayisi++;
      } else if (sinavTipi === 'ayt') {
        aytToplamNet += toplamNet;
        aytSayisi++;
      } else {
        digerToplamNet += toplamNet;
        digerSayisi++;
      }
    });
    const tytOrtalama = tytSayisi > 0 ? parseFloat((tytToplamNet / tytSayisi).toFixed(2)) : 0;
    const aytOrtalama = aytSayisi > 0 ? parseFloat((aytToplamNet / aytSayisi).toFixed(2)) : 0;
    const digerOrtalama = digerSayisi > 0 ? parseFloat((digerToplamNet / digerSayisi).toFixed(2)) : 0;
    return { tytOrtalama, aytOrtalama, digerOrtalama };
  }, [genelDenemeList, genelDenemeFilter]);
  
  const fetchGenelDenemeler = async () => {
    if (!student?.id) return;
    setGenelDenemeListLoading(true);
    try {
      const url = `${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${student.id}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.denemeler) {
        setGenelDenemeList(data.denemeler || []);
      } else {
        setGenelDenemeList([]);
      }
    } catch {
      setGenelDenemeList([]);
    } finally {
      setGenelDenemeListLoading(false);
    }
  };
  
  const renderPlanProgram = () => (
    <OgrenciProgramTab 
      student={student} 
      teacherId={null} 
      isStudentPanel={true}
      readOnly={true}
    />
  );

  const renderGunlukSoru = () => (
    <div style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 100px)'}}>
      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24}}>
          <div className="dashboard-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faStickyNote} />
            </div>
            <div className="card-content">
              <h3>Bu Hafta Toplam Atanan</h3>
              <div className="card-number">{questionStatsLoading ? '...' : questionStats.weekRequired}</div>
              <div className="card-subtitle">Toplam soru</div>
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
              <h3>Bugüne Kadar Toplam Çözülen</h3>
              <div className="card-number">{questionStatsLoading ? '...' : questionStats.totalSolved}</div>
              <div className="card-subtitle">Toplam çözülen soru sayısı</div>
            </div>
          </div>
        </div>

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

        {activeQuestionTab === 'soru-dagilimi' && (
          <div className="dagilim-sekmesi" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
            {!selectedQuestionExamArea ? (
              <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                <div style={{marginBottom: 32}}>
                  <h3 style={{fontSize: '24px', fontWeight: 700, marginBottom: 8, color: '#1f2937'}}>Sınav Seçin</h3>
                  <p style={{fontSize: '14px', color: '#6b7280'}}>Analiz yapmak istediğiniz sınavı seçin</p>
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
              <div style={{maxWidth: '1400px', margin: '0 auto'}}>
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
                    <div style={{display: 'flex', gap: 32, minHeight: '450px', padding: '40px 20px', position: 'relative'}}>
                      <div style={{flex: 1, display: 'flex', alignItems: 'flex-end', gap: 24, justifyContent: 'center'}}>
                        {Object.entries(questionDistributionStats)
                          .filter(([subject, stats]) => stats.yapildi > 0)
                          .length === 0 ? (
                            <div style={{width: '100%', textAlign: 'center', padding: '80px 20px', color: '#6b7280', fontSize: '16px'}}>
                              <div style={{fontSize: '48px', marginBottom: 16, opacity: 0.5}}>📊</div>
                              <div style={{fontWeight: 600, marginBottom: 8}}>Henüz yapılan soru bulunmuyor</div>
                              <div style={{fontSize: '14px', color: '#9ca3af'}}>Soru çözüldükçe burada dağılımı göreceksiniz.</div>
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
                                    <div style={{fontSize: 14, fontWeight: 600, color: '#111827', textAlign: 'center'}}>{subject}</div>
                                    <div style={{position: 'relative', height: maxBarHeight, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                                      <div style={{width: '40px', height: `${Math.max(actualBarHeight, 4)}px`, borderRadius: '999px 999px 0 0', background: 'linear-gradient(180deg, #6a1b9a, #8e24aa)', boxShadow: '0 8px 20px rgba(106,27,154,0.3)', position: 'relative', overflow: 'hidden'}}>
                                        <div style={{position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 999, padding: '4px 8px', fontSize: 12, fontWeight: 700, color: '#6a1b9a', boxShadow: '0 2px 6px rgba(0,0,0,0.15)'}}>
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
                  <h3 style={{fontSize: '24px', fontWeight: 700, marginBottom: 8, color: '#1f2937'}}>Sınav Seçin</h3>
                  <p style={{fontSize: '14px', color: '#6b7280'}}>Analiz yapmak istediğiniz sınavı seçin</p>
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
                        const allSubjectsArea = EXAM_SUBJECTS_BY_AREA[studentArea] || [];
                        subjects = allSubjectsArea.filter(s => s.startsWith('AYT '));
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
                          <div style={{fontSize: '12px', marginTop: 8, color: '#9ca3af', fontWeight: 400}}>(Program yok)</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
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
                    <h3 style={{fontSize: '22px', fontWeight: 700, color: '#1f2937', margin: 0}}>{selectedSubject}</h3>
                    <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Konu bazlı başarı dağılımı</p>
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
                  <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                    <h3 style={{fontSize: '22px', fontWeight: 700, marginBottom: 24, color: '#1f2937', letterSpacing: '-0.5px'}}>Haftalık Günlük Toplam Etüt Süresi</h3>
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
                            <div style={{fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: 12, minHeight: '24px', display: 'flex', alignItems: 'center'}}>{hours > 0 ? `${hours.toFixed(1)}s` : '0s'}</div>
                            <div style={{width: '100%', height: `${barHeight}px`, minHeight: hours > 0 ? '40px' : '0', background: 'linear-gradient(180deg, #8e24aa, #6a1b9a)', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: barHeight > 50 ? '14px' : '12px', fontWeight: 700, boxShadow: '0 2px 8px rgba(142, 36, 170, 0.3)', transition: 'all 0.2s'}} title={`${day}: ${hours.toFixed(1)} saat`}>
                              {barHeight > 50 && hours > 0 && `${hours.toFixed(1)}s`}
                            </div>
                            <div style={{fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'center', padding: '12px 4px 0', lineHeight: '1.4', minHeight: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center'}}>{day}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                    <h3 style={{fontSize: '22px', fontWeight: 700, marginBottom: 32, color: '#1f2937', letterSpacing: '-0.5px'}}>Haftalık Toplam Etüt Süresi</h3>
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
                              <div style={{fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: 12, minHeight: '24px', display: 'flex', alignItems: 'center', textAlign: 'center'}}>{weekData.totalHours > 0 ? `${weekData.totalHours.toFixed(1)}s` : '0s'}</div>
                              <div style={{width: '100%', height: `${barHeight}px`, minHeight: weekData.totalHours > 0 ? '40px' : '0', background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: barHeight > 50 ? '12px' : '10px', fontWeight: 700, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s'}} title={`${weekData.week}. Hafta: ${weekData.totalHours.toFixed(1)} saat`}>
                                {barHeight > 50 && weekData.totalHours > 0 && `${weekData.totalHours.toFixed(1)}s`}
                              </div>
                              <div style={{fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'center', padding: '12px 4px 0', lineHeight: '1.4', minHeight: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center'}}>{weekData.week}. Hafta</div>
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
    </div>
  );

  const renderDersBasari = () => (
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
                >
                  AYT
                </button>
              </div>
            )}
          </div>
          {Object.keys(dersBasariStats).length === 0 ? (
            <div style={{textAlign: 'center', padding: '80px 20px', color: '#6b7280', fontSize: '16px'}}>
              <div style={{fontSize: '48px', marginBottom: 16, opacity: 0.5}}>📚</div>
              <div style={{fontWeight: 600, marginBottom: 8}}>Henüz ders verisi bulunmuyor</div>
              <div style={{fontSize: '14px', color: '#9ca3af'}}>Program oluştukça burada görünecek</div>
            </div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24}}>
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
                      padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                      {iconSrc && (
                        <img src={iconSrc} alt={ders} style={{width: 40, height: 40, borderRadius: 8}} />
                      )}
                      <div>
                        <div style={{fontSize: 16, fontWeight: 700, color: '#1f2937'}}>{ders}</div>
                        <div style={{fontSize: 12, color: '#6b7280'}}>Toplam: {stats.total} soru</div>
                      </div>
                    </div>
                    <div style={{width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden'}}>
                      <div style={{width: `${yapildiPercent}%`, height: '100%', background: progressColor, transition: 'width 0.3s ease'}} />
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280'}}>
                      <span>Çözülen: <strong style={{color: '#10b981'}}>{stats.yapildi}</strong></span>
                      <span>Verilen: <strong style={{color: '#1f2937'}}>{stats.total}</strong></span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDersForDetail(ders);
                        setShowDersDetailModal(true);
                      }}
                      disabled={!hasProgram}
                      style={{
                        marginTop: 4,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: hasProgram ? '#f3f4f6' : '#f9fafb',
                        color: hasProgram ? '#374151' : '#9ca3af',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: hasProgram ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Konu Detayı
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
            <div style={{padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
              <div>
                <h3 style={{margin: 0, fontSize: 20, fontWeight: 700, color: '#111827'}}>{selectedDersForDetail} - Konu Detayları</h3>
                <p style={{margin: 0, marginTop: 4, fontSize: 13, color: '#6b7280'}}>Bu derse ait programlanan konuların performans dağılımı</p>
              </div>
              <button
                onClick={() => {
                  setShowDersDetailModal(false);
                  setSelectedDersForDetail(null);
                }}
                style={{border: 'none', background: '#f3f4f6', borderRadius: 9999, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer'}}
              >
                Kapat
              </button>
            </div>
            <div style={{padding: '32px', overflowY: 'auto', flex: 1}}>
              {dersDetailTopics[selectedDersForDetail] && Object.keys(dersDetailTopics[selectedDersForDetail]).length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                  {Object.entries(dersDetailTopics[selectedDersForDetail])
                    .sort((a, b) => (b[1].total || 0) - (a[1].total || 0))
                    .map(([konu, topicStats]) => {
                      const topicPercent = topicStats.total > 0 ? Math.round((topicStats.yapildi / topicStats.total) * 100) : 0;
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
                            <span>Çözülen: <strong style={{color: '#10b981'}}>{topicStats.yapildi}</strong></span>
                            <span>Verilen: <strong style={{color: '#1f2937'}}>{topicStats.total}</strong></span>
                          </div>
                          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginTop: 8}}>
                            <span>Doğru: <strong style={{color: '#065f46'}}>{topicStats.dogru || 0}</strong></span>
                            <span>Yanlış: <strong style={{color: '#b91c1c'}}>{topicStats.yanlis || 0}</strong></span>
                            <span>Boş: <strong style={{color: '#374151'}}>{topicStats.bos || 0}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '60px 20px', color: '#6b7280', fontSize: '15px'}}>
                  <div style={{fontSize: '40px', marginBottom: 12, opacity: 0.5}}>📚</div>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Henüz konu detayı bulunmuyor</div>
                  <div style={{fontSize: '13px', color: '#9ca3af'}}>Bu ders için program oluşturdukça burada konu bazlı dağılımı göreceksiniz.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderKonuIlerlemesi = () => (
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
                      <div style={{fontSize: '15px', fontWeight: 600, color: '#1f2937'}}>
                        {konu.konu}
                      </div>
                      <div style={{fontSize: '14px', color: '#6b7280'}}>
                        {konu.tarih || '-'}
                      </div>
                      <div>
                        <select
                          value={konu.durum}
                          disabled
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: '14px',
                            background: '#f9fafb',
                            color: '#6b7280',
                            cursor: 'not-allowed'
                          }}
                        >
                          <option value="Konuya Gelinmedi">Konuya Gelinmedi</option>
                          <option value="Daha Sonra Yapılacak">Daha Sonra Yapılacak</option>
                          <option value="Konuyu Anlamadım">Konuyu Anlamadım</option>
                          <option value="Çalıştım">Çalıştım</option>
                        </select>
                      </div>
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
                                {kaynak.tamamlandi && (
                                  <FontAwesomeIcon icon={faCheck} style={{color: '#10b981', fontSize: '10px'}} />
                                )}
                                <span style={{color: '#374151'}}>{kaynak.kaynak_adi}</span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div style={{color: '#9ca3af', fontSize: '12px'}}>
                            Henüz kaynak eklenmedi
                          </div>
                        )}
                      </div>
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
      </div>
    </div>
  );

  const renderBransDenemeleri = () => (
    <div className="brans-denemeleri-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20}}>
          <div>
            <h2 style={{fontSize: 28, fontWeight: 700, margin: 0, color: '#111827'}}>Branş Denemeleri</h2>
            <p style={{margin: '6px 0 0', color: '#6b7280'}}>Branş denemesi grafikleri</p>
          </div>
        </div>
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
      </div>
    </div>
  );

  const renderGenelDenemeler = () => (
    <div className="genel-denemeler-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
        <h2 style={{fontSize: 32, fontWeight: 700, margin: '0 0 32px 0', color: '#111827'}}>Genel Denemeler</h2>

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

        {(() => {
          const studentAreaRaw = student?.alan || '';
          const studentArea = (studentAreaRaw || '').toLowerCase();
          const isYks = studentArea.startsWith('yks');
          if (isYks) {
            return (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32}}>
                <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                  <div style={{fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 16}}>TYT Deneme Ortalaması</div>
                  <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>
                    {calculateGenelDenemeOrtalamalari.tytOrtalama}
                  </div>
                  <div style={{fontSize: 20, fontWeight: 600, color: '#6b7280', marginTop: 8}}>Net</div>
                </div>
                <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
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
                <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                  <div style={{fontSize: 18, fontWeight: 600, color: '#6b7280', marginBottom: 16}}>
                    {studentArea === 'lgs' ? 'LGS' : formatAreaLabel(studentAreaRaw)} Deneme Ortalaması
                  </div>
                  <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>{calculateGenelDenemeOrtalamalari.digerOrtalama}</div>
                  <div style={{fontSize: 20, fontWeight: 600, color: '#6b7280', marginTop: 8}}>Net</div>
                </div>
              </div>
            );
          }
        })()}

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20}}>
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

        {genelDenemeView === 'grafikler' && (
          <div style={{marginTop: 32, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
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
            {denemeGrafikTab === 'genel' && (
              <>
                {genelDenemeListLoading ? (
                  <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Yükleniyor...</div>
                ) : genelDenemeList.length === 0 ? (
                  <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>Henüz kayıtlı deneme yok.</div>
                ) : (() => {
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
                  return (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20}}>
                      {filteredDenemeler.map((deneme) => {
                        const toplamNet = Object.values(deneme.dersSonuclari || {}).reduce((sum, d) => sum + (Number(d.net) || 0), 0);
                        return (
                          <div key={deneme.id} style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 10}}>
                            <div style={{marginBottom: 16}}>
                              <div style={{fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4}}>{deneme.denemeAdi}</div>
                              <div style={{fontSize: 14, color: '#6b7280'}}>{deneme.denemeTarihi}</div>
                              <div style={{marginTop: 8, fontSize: 16, fontWeight: 700, color: '#6a1b9a'}}>Toplam Net: {toplamNet.toFixed(2)}</div>
                            </div>
                            <div style={{height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 10, paddingBottom: 20}}>
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
                                        marginTop: 10
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
                  const studentArea = (studentAreaRaw || '').toLowerCase();
                  const isYks = studentArea.startsWith('yks');
                  let dersList = [];
                  if (isYks) {
                    const sinavTipi = dersBazliGrafikSinavTipi;
                    dersList = EXAM_SUBJECTS_BY_AREA[studentAreaRaw]?.filter(ders => 
                      sinavTipi === 'tyt' ? ders.startsWith('TYT ') : ders.startsWith('AYT ')
                    ) || [];
                  } else {
                    dersList = EXAM_SUBJECTS_BY_AREA[studentAreaRaw] || [];
                  }
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
                      {isYks && (
                        <div style={{marginBottom: 24, display: 'flex', gap: 12}}>
                          <button
                            onClick={() => setDersBazliGrafikSinavTipi('tyt')}
                            style={{
                              padding: '10px 20px',
                              borderRadius: 8,
                              border: '1px solid #d1d5db',
                              background: dersBazliGrafikSinavTipi === 'tyt' ? '#6a1b9a' : 'white',
                              color: dersBazliGrafikSinavTipi === 'tyt' ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            TYT
                          </button>
                          <button
                            onClick={() => setDersBazliGrafikSinavTipi('ayt')}
                            style={{
                              padding: '10px 20px',
                              borderRadius: 8,
                              border: '1px solid #d1d5db',
                              background: dersBazliGrafikSinavTipi === 'ayt' ? '#6a1b9a' : 'white',
                              color: dersBazliGrafikSinavTipi === 'ayt' ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            AYT
                          </button>
                        </div>
                      )}
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
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 24}}>
                        {dersList.map((ders) => {
                          let chartColor = '#3b82f6';
                          if (dersBazliGrafikFiltre === 'net') chartColor = '#3b82f6';
                          else if (dersBazliGrafikFiltre === 'dogru') chartColor = '#10b981';
                          else if (dersBazliGrafikFiltre === 'yanlis') chartColor = '#ef4444';
                          else if (dersBazliGrafikFiltre === 'bos') chartColor = '#6b7280';
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
                            return { denemeAdi: deneme.denemeAdi, tarih: deneme.denemeTarihi, value };
                          }).filter(Boolean);
                          if (dersVerileri.length === 0) return null;
                          const rawMaxValue = Math.max(...dersVerileri.map(d => d.value), 0);
                          const maxValue = rawMaxValue > 0 ? Math.ceil(rawMaxValue * 1.1 / 5) * 5 : 5;
                          const chartHeight = 180;
                          return (
                            <div key={ders} style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                              <h4 style={{fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20}}>
                                {ders}
                              </h4>
                              <div style={{background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
                                <div style={{position: 'relative', height: chartHeight}}>
                                  <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 8}}>
                                    {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((val, idx) => (
                                      <div key={idx} style={{fontSize: 11, color: '#6b7280', textAlign: 'right'}}>
                                        {Math.round(val)}
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{marginLeft: 40, position: 'relative', height: chartHeight, borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb'}}>
                                    {[1, 2, 3, 4].map(val => (
                                      <div key={val} style={{position: 'absolute', left: 0, right: 0, bottom: `${(val / 4) * 100}%`, borderTop: '1px dashed #e5e7eb'}} />
                                    ))}
                                    <div style={{display: 'flex', alignItems: 'flex-end', height: '100%', padding: '0 20px', gap: 12, justifyContent: 'center', position: 'absolute', bottom: 0, left: 0, right: 0}}>
                                      {dersVerileri.map((data, index) => {
                                        const heightPx = chartHeight * (data.value / maxValue);
                                        return (
                                          <div key={index} style={{flex: 1, minWidth: 36, maxWidth: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%'}}>
                                            {data.value > 0 && (
                                              <div style={{marginBottom: 4, fontSize: 12, fontWeight: 700, color: '#111827', minHeight: '16px', display: 'flex', alignItems: 'center'}}>
                                                {data.value}
                                              </div>
                                            )}
                                            <div style={{width: '100%', background: chartColor, borderRadius: '4px 4px 0 0', height: `${heightPx}px`, minHeight: data.value > 0 ? 5 : 0, position: 'relative', alignSelf: 'flex-end'}} />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div style={{marginLeft: 40, marginTop: 12, display: 'flex', padding: '0 20px', gap: 12, justifyContent: 'center'}}>
                                    {dersVerileri.map((data, index) => (
                                      <div key={index} style={{flex: 1, minWidth: 36, maxWidth: dersVerileri.length > 5 ? 20 : 80, fontSize: 11, color: '#6b7280', textAlign: 'center', writingMode: dersVerileri.length > 5 ? 'vertical-rl' : 'horizontal-tb', transform: dersVerileri.length > 5 ? 'rotate(180deg)' : 'none', wordBreak: 'break-word'}}>
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
              const denemelerWithDegerlendirme = genelDenemeList.filter(d => d.degerlendirme);
              if (denemelerWithDegerlendirme.length === 0) {
                return (
                  <div style={{padding: 40, textAlign: 'center', color: '#6b7280'}}>
                    Henüz değerlendirme verisi bulunmuyor.
                  </div>
                );
              }
              let filteredDenemeler = [...denemelerWithDegerlendirme];
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
              const maxValue = 5;
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
                      <div key={deneme.id || index} style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                        <div style={{marginBottom: 20}}>
                          <h4 style={{fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4}}>
                            {deneme.denemeAdi}
                          </h4>
                          <div style={{fontSize: 14, color: '#6b7280'}}>
                            {deneme.denemeTarihi}
                          </div>
                        </div>
                        <div style={{background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16}}>
                          <div style={{position: 'relative', height: chartHeight}}>
                            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 8}}>
                              {[5, 4, 3, 2, 1, 0].map(val => (
                                <div key={val} style={{fontSize: 11, color: '#6b7280', textAlign: 'right'}}>{val}</div>
                              ))}
                            </div>
                            <div style={{marginLeft: 40, position: 'relative', height: chartHeight, borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb'}}>
                              {[1, 2, 3, 4, 5].map(val => (
                                <div key={val} style={{position: 'absolute', left: 0, right: 0, bottom: `${(val / maxValue) * 100}%`, borderTop: '1px dashed #e5e7eb'}} />
                              ))}
                              <div style={{display: 'flex', alignItems: 'flex-end', height: '100%', padding: '0 30px', gap: 30, justifyContent: 'center', position: 'absolute', bottom: 0, left: 0, right: 0}}>
                                {metrics.map((metric, metricIndex) => {
                                  const heightPx = chartHeight * (metric.value / maxValue);
                                  return (
                                    <div key={metricIndex} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 100, justifyContent: 'flex-end', height: '100%'}}>
                                      {metric.value > 0 && (
                                        <div style={{marginBottom: 4, fontSize: 14, fontWeight: 700, color: '#111827', minHeight: '16px', display: 'flex', alignItems: 'center'}}>
                                          {metric.value}
                                        </div>
                                      )}
                                      <div style={{width: '100%', background: metric.color, borderRadius: '4px 4px 0 0', height: `${heightPx}px`, minHeight: metric.value > 0 ? 4 : 0, position: 'relative', alignSelf: 'flex-end'}} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div style={{marginLeft: 40, marginTop: 12, display: 'flex', padding: '0 30px', gap: 30, justifyContent: 'center'}}>
                              {metrics.map((metric, metricIndex) => (
                                <div key={metricIndex} style={{flex: 1, maxWidth: 100, fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center'}}>
                                  {metric.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {enZorlayanDers && (
                          <div style={{padding: 12, background: '#fef3c7', borderRadius: 8, border: '1px solid #fcd34d'}}>
                            <div style={{fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4}}>
                              En Zorlanılan Ders:
                            </div>
                            <div style={{fontSize: 14, fontWeight: 700, color: '#78350f'}}>
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
  );

  const renderMuhasebe = () => {
    const formatAmount = (v) => `${Number(v).toLocaleString('tr-TR')} TL`;
    const toplamOdeme = payments.reduce((sum, p) => sum + (p.tutar || 0), 0);
    const toplamBekleyen = pendingPayments.reduce((sum, p) => sum + (p.tutar || 0), 0);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const filteredPayments = [...payments]
      .filter(p => {
        if (paymentsFilter === 'tum') return true;
        const dt = new Date(p.tarih);
        if (paymentsFilter === 'son6') return dt >= sixMonthsAgo;
        if (paymentsFilter === 'buyil') return dt.getFullYear() === now.getFullYear();
        return true;
      })
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    return (
      <div style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
        <div style={{maxWidth: '1400px', margin: '0 auto'}}>
          <h2 style={{fontSize: 32, fontWeight: 700, margin: '0 0 24px 0', color: '#111827'}}>Muhasebe</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24}}>
            <div style={{background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize: 16, color: '#6b7280', fontWeight: 600, marginBottom: 8}}>Toplam Yapılan Ödeme</div>
              <div style={{fontSize: 40, fontWeight: 800, color: '#10b981'}}>{formatAmount(toplamOdeme)}</div>
            </div>
            <div style={{background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize: 16, color: '#6b7280', fontWeight: 600, marginBottom: 8}}>Toplam Bekleyen Ödeme</div>
              <div style={{fontSize: 40, fontWeight: 800, color: '#ef4444'}}>{formatAmount(toplamBekleyen)}</div>
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
            <div style={{background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <h3 style={{fontSize: 20, fontWeight: 700, margin: 0, color: '#111827'}}>Yapılan Ödemeler</h3>
                <div style={{display: 'flex', gap: 8, background: '#f3f4f6', padding: 4, borderRadius: 12}}>
                  <button
                    onClick={() => setPaymentsFilter('tum')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: paymentsFilter === 'tum' ? '#fff' : '#374151',
                      background: paymentsFilter === 'tum' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent'
                    }}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setPaymentsFilter('son6')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: paymentsFilter === 'son6' ? '#fff' : '#374151',
                      background: paymentsFilter === 'son6' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent'
                    }}
                  >
                    Son 6 Ay
                  </button>
                  <button
                    onClick={() => setPaymentsFilter('buyil')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: paymentsFilter === 'buyil' ? '#fff' : '#374151',
                      background: paymentsFilter === 'buyil' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent'
                    }}
                  >
                    Bu Yıl
                  </button>
                </div>
              </div>
              <div style={{display: 'grid', gap: 12}}>
                {filteredPayments.map((o, idx) => (
                  <div key={`${o.tarih}-${idx}`} style={{display: 'grid', gridTemplateColumns: '140px 1fr 120px', gap: 12, alignItems: 'center', padding: 12, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb'}}>
                    <div style={{fontSize: 13, color: '#6b7280'}}>{o.tarih}</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                      <div style={{fontSize: 16, fontWeight: 700, color: '#111827'}}>{formatAmount(o.tutar)}</div>
                      <div style={{fontSize: 12, color: '#6b7280'}}>{o.yontem} • {o.aciklama}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <span style={{padding: '6px 10px', borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 12, fontWeight: 700}}>Ödendi</span>
                    </div>
                  </div>
                ))}
                {filteredPayments.length === 0 && (
                  <div style={{padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', textAlign: 'center', fontWeight: 700}}>
                    Kayıt bulunamadı
                  </div>
                )}
              </div>
            </div>
            <div style={{background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <h3 style={{fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16}}>Bekleyen Ödemeler</h3>
              <div style={{display: 'grid', gap: 12}}>
                {pendingPayments.map((b, idx) => (
                  <div key={`${b.sonTarih}-${idx}`} style={{display: 'grid', gridTemplateColumns: '140px 1fr 120px', gap: 12, alignItems: 'center', padding: 12, background: '#fff7ed', borderRadius: 12, border: '1px solid #fde68a'}}>
                    <div style={{fontSize: 13, color: '#92400e'}}>{b.sonTarih}</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                      <div style={{fontSize: 16, fontWeight: 700, color: '#111827'}}>{formatAmount(b.tutar)}</div>
                      <div style={{fontSize: 12, color: '#6b7280'}}>{b.aciklama}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <span style={{padding: '6px 10px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700}}>Bekliyor</span>
                    </div>
                  </div>
                ))}
                {pendingPayments.length === 0 && (
                  <div style={{padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', textAlign: 'center', fontWeight: 700}}>
                    Kayıt bulunamadı
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfil = () => (
    <div className="content-area" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#1f2937' }}>Profil Bilgileri</h2>
      <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Ad</label>
            <input
              type="text"
              value={parentForm.firstName}
              onChange={(e) => setParentForm(f => ({ ...f, firstName: e.target.value }))}
              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Soyad</label>
            <input
              type="text"
              value={parentForm.lastName}
              onChange={(e) => setParentForm(f => ({ ...f, lastName: e.target.value }))}
              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>E-posta</label>
            <input
              type="email"
              value={parentForm.email}
              onChange={(e) => setParentForm(f => ({ ...f, email: e.target.value }))}
              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Telefon</label>
            <input
              type="text"
              value={parentForm.phone}
              onChange={(e) => setParentForm(f => ({ ...f, phone: e.target.value }))}
              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
            />
          </div>
        </div>
        <div style={{marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Yeni Şifre (opsiyonel)</label>
            <input
              type="password"
              value={parentForm.newPassword}
              onChange={(e) => setParentForm(f => ({ ...f, newPassword: e.target.value }))}
              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, color: '#4b5563'}}>Yeni Şifre Tekrarı</label>
            <input
              type="password"
              value={parentForm.newPasswordConfirm}
              onChange={(e) => setParentForm(f => ({ ...f, newPasswordConfirm: e.target.value }))}
              style={{width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db'}}
            />
          </div>
        </div>
        {parentSaveError && (
          <div style={{marginTop: 16, padding: 12, borderRadius: 10, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 600}}>
            {parentSaveError}
          </div>
        )}
        {parentSaveMessage && (
          <div style={{marginTop: 16, padding: 12, borderRadius: 10, background: '#ecfdf5', color: '#065f46', border: '1px solid #d1fae5', fontWeight: 600}}>
            {parentSaveMessage}
          </div>
        )}
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24}}>
          <button
            onClick={async () => {
              setParentSaveError('');
              setParentSaveMessage('');
              if (!parentForm.firstName || !parentForm.lastName || !parentForm.email) {
                setParentSaveError('Lütfen zorunlu alanları doldurun.');
                return;
              }
              if (parentForm.newPassword && parentForm.newPassword !== parentForm.newPasswordConfirm) {
                setParentSaveError('Yeni şifre ve tekrarı eşleşmiyor.');
                return;
              }
              setParentSaving(true);
              try {
                const payload = {
                  _id: parent?.id,
                  firstName: parentForm.firstName,
                  lastName: parentForm.lastName,
                  email: parentForm.email,
                  phone: parentForm.phone
                };
                if (parentForm.newPassword) {
                  payload.password = parentForm.newPassword;
                }
                const res = await fetch(`${API_BASE}/php-backend/api/update_parent.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                  const updatedParent = {
                    ...parent,
                    firstName: parentForm.firstName,
                    lastName: parentForm.lastName,
                    email: parentForm.email,
                    phone: parentForm.phone
                  };
                  setParent(updatedParent);
                  try {
                    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
                    localStorage.setItem('user', JSON.stringify({ ...currentUser, firstName: updatedParent.firstName, lastName: updatedParent.lastName, email: updatedParent.email, phone: updatedParent.phone }));
                  } catch {}
                  setParentSaveMessage('Bilgileriniz güncellendi.');
                  setParentForm(f => ({ ...f, newPassword: '', newPasswordConfirm: '' }));
                } else {
                  setParentSaveError(data.message || 'Güncelleme başarısız.');
                }
              } catch (e) {
                setParentSaveError('Sunucu hatası oluştu.');
              } finally {
                setParentSaving(false);
              }
            }}
            disabled={parentSaving}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: parentSaving ? '#9ca3af' : '#6a1b9a',
              color: 'white',
              cursor: parentSaving ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            {parentSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Yükleniyor...</div>
      </div>
    );
  }

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
          <div className="user-role">Veli</div>
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
          {activeMenu === 'plan-program' && renderPlanProgram()}
          {activeMenu === 'gunluk-soru' && renderGunlukSoru()}
          {activeMenu === 'ders-basari' && renderDersBasari()}
          {activeMenu === 'konu-ilerlemesi' && renderKonuIlerlemesi()}
          {activeMenu === 'brans-denemeleri' && renderBransDenemeleri()}
          {activeMenu === 'genel-denemeler' && renderGenelDenemeler()}
          {activeMenu === 'muhasebe' && renderMuhasebe()}
          {activeMenu === 'profil' && renderProfil()}
        </div>
      </div>
    </div>
  );
};

export default VeliPanel;
