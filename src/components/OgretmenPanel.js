import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUsers, 
  faBell, 
  faCreditCard, 
  faStickyNote, 
  faRobot, 
  faComments, 
  faPaperPlane,
  faSignOutAlt,
  faSearch,
  faSun,
  faBell as faBellIcon,
  faComments as faCommentsIcon,
  faUser,
  faBook,
  faChartLine,
  faClock,
  faBullseye,
  faPhone,
  faComments as faMessageIcon,
  faEllipsisV,
  faClipboardList,
  faTrophy,
  faDownload,
  faLightbulb,
  faFilter,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
  faGripVertical,
  faPlus,
  faCheck,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './OgretmenPanel.css';
import studentImg from '../assets/student-img.png';
import Bildirimler from './Bildirimler';
import Kaynaklar from './Kaynaklar';
import OgretmenProfilTab from './OgretmenProfilTab';
import OgrenciProgramTab from './OgrenciProgramTab';
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

const OgretmenPanel = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('ogrenciler');
  const [activeTab, setActiveTab] = useState('konular');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPanelActive, setStudentPanelActive] = useState(false);

  // Muhasebe: filtreler, veri ve modal durumu
  const [accountingFilters, setAccountingFilters] = useState({
    search: '',
    month: '',
    year: '',
    status: '' // Varsayılan olarak tüm öğrenciler gösterilsin
  });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('muhasebe'); // 'muhasebe' veya 'program'

  const openAccountModal = (item) => {
    setSelectedAccount(item);
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setSelectedAccount(null);
    setAccountModalTab('muhasebe'); // Modal kapatıldığında varsayılan sekmeye dön
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setStudentPanelActive(true);
    setActiveMenu('plan-program');
    setActiveTab('konular');
  };

  const handleBackToStudents = () => {
    setStudentPanelActive(false);
    setSelectedStudent(null);
  };

  const menuItems = [
    { id: 'ogrenciler', icon: faUsers, label: 'Öğrenciler' },
    { id: 'profil', icon: faUser, label: 'Profilim' },
    { id: 'bildirimler', icon: faBell, label: 'Bildirimler' },
    { id: 'muhasebe', icon: faCreditCard, label: 'Muhasebe' },
    { id: 'kaynaklar', icon: faBook, label: 'Kaynak/Kitaplar' }
  ];

  const studentMenuItems = [
    { id: 'plan-program', icon: faBook, label: 'Plan/ Program' },
    { id: 'gunluk-soru', icon: faStickyNote, label: 'Soru/Süre/Konu Dağılımı' },
    { id: 'ders-basari', icon: faTrophy, label: 'Ders/Konu Bazlı Başarım' },
    { id: 'kaynak-konu-ilerlemesi', icon: faClipboardList, label: 'Kaynak ve Konu İlerlemesi' },
    { id: 'brans-denemeleri', icon: faBullseye, label: 'Brans Denemeleri' },
    { id: 'genel-denemeler', icon: faClock, label: 'Genel Denemeler' },
    { id: 'yapay-zeka', icon: faRobot, label: 'Yapay Zeka' },
    { id: 'kaynak-onerileri', icon: faLightbulb, label: 'Kaynak Önerileri' }
  ];

const MEETING_DAY_OPTIONS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' }
];

  // Öğrenciler state - backend'den çekilecek
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Muhasebe için students verisini kullan, varsayılan değerlerle
  const accountingData = useMemo(() => {
    return students.map((student, index) => {
      // Öğrenci verisinden muhasebe formatına çevir
      // Varsayılan değerler kullanılıyor, ileride backend'den bu bilgiler de gelebilir
      return {
        id: student.id || index + 1,
        name: student.name || 'İsimsiz Öğrenci',
        gender: student.gender || 'm', // Varsayılan olarak 'm', backend'den gelebilir
        className: student.class || student.className || 'Belirtilmemiş',
        registeredAt: student.registeredAt || new Date().toISOString().split('T')[0],
        overdueCount: student.overdueCount || 0, // Backend'den gelebilir
        lastPayment: student.lastPayment || new Date().toISOString().split('T')[0], // Backend'den gelebilir
        history: student.history || [], // Backend'den gelebilir
        meetingDay: student.meetingDay || 1
      };
    });
  }, [students]);

  const filteredAccounting = useMemo(() => {
    return accountingData.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(accountingFilters.search.toLowerCase());

    const date = new Date(item.lastPayment);
    const matchesMonth = accountingFilters.month
      ? date.getMonth() + 1 === Number(accountingFilters.month)
      : true;
    const matchesYear = accountingFilters.year
      ? date.getFullYear() === Number(accountingFilters.year)
      : true;

      const matchesStatus = accountingFilters.status === ''
        ? true // Eğer filtre seçilmemişse tüm öğrencileri göster
        : accountingFilters.status === 'odemesi-gecen'
      ? item.overdueCount > 0
      : item.overdueCount === 0;

    return matchesSearch && matchesMonth && matchesYear && matchesStatus;
  });
  }, [accountingData, accountingFilters]);

  // Muhasebe: üst özetler için basit hesaplamalar
  const now = new Date();
  const { monthIncome, yearIncome, unpaidTotal } = useMemo(() => {
    const allPayments = accountingData.flatMap((s) => s.history);
  const monthIncome = allPayments
    .filter((p) => {
      const d = new Date(p.date);
      return p.status === 'paid' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);
  const yearIncome = allPayments
    .filter((p) => {
      const d = new Date(p.date);
      return p.status === 'paid' && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);
  // Basit varsayım: her gecen ödeme 1000 TL
  const unpaidTotal = accountingData.reduce((sum, s) => sum + s.overdueCount * 1000, 0);
    return { monthIncome, yearIncome, unpaidTotal };
  }, [accountingData]);

  // Öğrenci ekleme modalı için state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    alan: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    className: '',
    profilePhoto: '',
    password: '',
    passwordConfirm: '',
    meetingDay: 1,
    meetingDate: ''
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [stuUploading, setStuUploading] = useState(false);

  // Veli formu için state
  const [veliForm, setVeliForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: ''
  });
  const [veliSaving, setVeliSaving] = useState(false);
  const [veliError, setVeliError] = useState('');
  const [veliSuccess, setVeliSuccess] = useState('');

  // Öğrenci düzenleme/silme için state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    id: '',
    alan: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    className: '',
    profilePhoto: '',
    meetingDate: '',
    password: '',
    passwordConfirm: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [editStuUploading, setEditStuUploading] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [studentsEtutLoading, setStudentsEtutLoading] = useState(false);

  // Öğrencilerin etüt istatistiklerini haftalık olarak çek
  const fetchEtutStatsForStudents = async (studentList) => {
    if (!studentList || studentList.length === 0) return;
    try {
      setStudentsEtutLoading(true);

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
      const todayStr = today.toISOString().split('T')[0];

      const updated = await Promise.all(
        studentList.map(async (stu) => {
          try {
            const res = await fetch(
              `${API_BASE}/php-backend/api/get_student_program.php?studentId=${stu.id}&startDate=${startDateStr}&endDate=${endDateStr}`
            );
            const data = await res.json();
            if (data.success && data.programs) {
              let yapilan = 0;
              let yapilmayan = 0;
              let toplam = 0;
              let bugunYapilmayan = 0; // Sadece bugün için zamanı geçen etüt

              data.programs.forEach((prog) => {
                toplam++;
                if (prog.durum === 'yapildi') {
                  yapilan++;
                } else {
                  yapilmayan++;
                  // Sadece bugün için zamanı geçen etütleri say
                  if (prog.tarih === todayStr) {
                    bugunYapilmayan++;
                  }
                }
              });

              const completedPct = toplam > 0 ? Math.round((yapilan / toplam) * 100) : 0;

              return {
                ...stu,
                overdue: bugunYapilmayan, // Sadece bugün için zamanı geçen etüt
                completed: completedPct
              };
            }
          } catch (err) {
            console.error('Öğrenci etüt istatistiği alınamadı:', stu.id, err);
          }
          return stu;
        })
      );

      setStudents(updated);
    } catch (err) {
      console.error('Öğrencilerin etüt istatistikleri yüklenemedi:', err);
    } finally {
      setStudentsEtutLoading(false);
    }
  };

  // Günlük soru istatistikleri için state
  const [questionStats, setQuestionStats] = useState({
    todayRequired: 0,
    weekRequired: 0,
    weekPending: 0,
    totalSolved: 0
  });
  const [questionStatsLoading, setQuestionStatsLoading] = useState(false);

  // Konu dağılımı için state
  const [selectedExamArea, setSelectedExamArea] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topicStats, setTopicStats] = useState({});
  const [topicStatsLoading, setTopicStatsLoading] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);

  // Soru dağılımı için state
  const [selectedQuestionExamArea, setSelectedQuestionExamArea] = useState(null);
  const [questionDistributionPeriod, setQuestionDistributionPeriod] = useState('gunluk');
  const [questionDistributionStats, setQuestionDistributionStats] = useState({});
  const [questionDistributionLoading, setQuestionDistributionLoading] = useState(false);

  // Süre dağılımı için state
  const [timeDistributionStats, setTimeDistributionStats] = useState({
    daily: {}, // { 'Pazartesi': 2.5, 'Salı': 3.0, ... }
    weekly: [], // [{ week: 1, totalHours: 15.5 }, { week: 2, totalHours: 18.0 }, ...]
    weeklyDaily: {} // { 'prev': { 'Pazartesi': 2.5, ... }, 'current': { ... }, 'next': { ... } }
  });
  const [timeDistributionLoading, setTimeDistributionLoading] = useState(false);
  const [selectedWeeklyPeriod, setSelectedWeeklyPeriod] = useState('current'); // 'prev', 'current', 'next'

  // Branş denemeleri state
  const [bransView, setBransView] = useState('entry'); // 'entry' | 'charts'
  const [bransExamType, setBransExamType] = useState('tyt'); // 'tyt' veya 'ayt'
  const [genelDenemeFilter, setGenelDenemeFilter] = useState('son-deneme'); // 'son-deneme' | 'son-3' | 'son-5' | 'son-10'
  const [genelDenemeView, setGenelDenemeView] = useState(null); // null | 'ekle' | 'grafikler' | 'analizler'
  const [genelDenemeTab, setGenelDenemeTab] = useState('ekle'); // 'ekle' | 'grafikler'
  const [genelDenemeSinavTipi, setGenelDenemeSinavTipi] = useState('tyt'); // 'tyt' | 'ayt'
  const [genelDenemeForm, setGenelDenemeForm] = useState({
    denemeAdi: '',
    denemeTarihi: '',
    notlar: '',
    sinavTipi: 'tyt' // 'tyt' | 'ayt'
  });
  const [genelDenemeDersler, setGenelDenemeDersler] = useState({}); // {dersAdi: {soruSayisi, dogru, yanlis, bos, net}}
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
  const [bransDenemeForm, setBransDenemeForm] = useState({
    alan: selectedStudent?.alan || '',
    ders: '',
    denemeTarihi: '',
    denemeAdi: '',
    soruSayisi: '',
    dogru: '',
    yanlis: '',
    bos: ''
  });
  const [bransKonular, setBransKonular] = useState([]); // [{konu,sira,dogru,yanlis,bos}]
  const [bransKonuDetayAcik, setBransKonuDetayAcik] = useState(false);
  const [bransKaydediliyor, setBransKaydediliyor] = useState(false);
  const [bransDenemelerLoading, setBransDenemelerLoading] = useState(false);
  const [bransDenemeList, setBransDenemeList] = useState([]);
  const [bransChartsSelectedDers, setBransChartsSelectedDers] = useState('');
  const bransAreaRaw = bransDenemeForm.alan || selectedStudent?.alan || '';
  const bransArea = (bransAreaRaw || '').toLowerCase();
  const bransIsYks = bransArea.startsWith('yks');
  const bransHasSubjects = !!EXAM_SUBJECTS_BY_AREA[bransArea];
  // Ders listesini al: YKS ise TYT/AYT'ye göre filtrele, diğer alanlarda doğrudan kullan
  const bransDersListRaw = bransHasSubjects ? (EXAM_SUBJECTS_BY_AREA[bransArea] || []) : [];
  const bransDersList = bransIsYks 
    ? (bransExamType === 'tyt' 
        ? bransDersListRaw.filter(d => d.startsWith('TYT '))
        : bransDersListRaw.filter(d => d.startsWith('AYT ')))
    : bransDersListRaw;

  // Ders/Konu bazlı başarım için state
  const [dersBasariStats, setDersBasariStats] = useState({});
  const [dersBasariLoading, setDersBasariLoading] = useState(false);
  const [selectedDersForDetail, setSelectedDersForDetail] = useState(null);
  const [showDersDetailModal, setShowDersDetailModal] = useState(false);
  const [dersDetailTopics, setDersDetailTopics] = useState({});
  const [dersBasariExamType, setDersBasariExamType] = useState('tyt'); // 'tyt' veya 'ayt'

  // Kaynak ve Konu İlerlemesi için state
  const [selectedDersForIlerleme, setSelectedDersForIlerleme] = useState(null);
  const [konuIlerlemesi, setKonuIlerlemesi] = useState([]); // [{ id, konu, sira, durum, tarih, kaynaklar: [{ id, kaynak_adi, tamamlandi }] }]
  const [konuIlerlemesiLoading, setKonuIlerlemesiLoading] = useState(false);
  const [draggedKonu, setDraggedKonu] = useState(null);
  const [showKaynakEkleModal, setShowKaynakEkleModal] = useState(false);
  const [yeniKaynakAdi, setYeniKaynakAdi] = useState('');
  const [savingIlerleme, setSavingIlerleme] = useState(false);
  const [ilerlemeExamType, setIlerlemeExamType] = useState('tyt'); // 'tyt' veya 'ayt'

  const API_STUDENT = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/create_student.php";
  const API_UPDATE_STUDENT = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/update_student.php";
  const API_DELETE_STUDENT = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/delete_student.php";
  const API_PHOTO = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/upload_teacher_photo.php";

  // Ders adına göre görsel eşleştirmesi
  const getSubjectIcon = (ders) => {
    if (!ders) return null;
    let normalized = ders.toLowerCase().trim();
    normalized = normalized.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
    normalized = normalized
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    normalized = normalized.replace(/-\d+$/, '');
    
    if (normalized.includes('matematik')) return tumMatematikImg;
    if (normalized.includes('geometri')) return tumGeometriImg;
    if (normalized.includes('turkce') || normalized === 'turkce') return tumTurkceImg;
    if (normalized.includes('edebiyat') || normalized.includes('turk dili')) return edebiyatImg;
    if (normalized.includes('fizik')) return tumFizikImg;
    if (normalized.includes('kimya')) return tumKimyaImg;
    if (normalized.includes('biyoloji')) return tumBiyolojiImg;
    if (normalized.includes('inkilap') || normalized.includes('inkılap')) return lgsInkilapImg;
    if (normalized.includes('tarih')) return tarihImg;
    if (normalized.includes('cografya') || normalized.includes('coğrafya')) return cografyaImg;
    if (normalized.includes('felsefe') || normalized.includes('psikoloji') || normalized.includes('sosyoloji') || normalized.includes('mantik') || normalized.includes('mantık')) return felsefeImg;
    if (normalized.includes('din')) return dinImg;
    if (normalized.includes('fen bilimleri') || normalized.includes('fen bilim') || normalized === 'fen') return lgsFenImg;
    if (normalized.includes('ingilizce') || normalized.includes('ingiliz')) return tumIngilizceImg;
    if (normalized.includes('sosyal') || normalized.includes('vatandaslik') || normalized.includes('vatandaşlık')) return sosyalImg;
    return null;
  };

  // Öğrencileri backend'den çek
  const fetchStudents = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      setStudentsLoading(false);
      return;
    }
    
    fetch(`${API_BASE}/php-backend/api/get_teacher_students.php?teacherId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.students) {
          const now = new Date();
          // Backend formatını frontend formatına çevir
          const formattedStudents = data.students.map(s => {
            const lastSeen = s.son_giris_tarihi ? new Date(s.son_giris_tarihi) : null;
            const diffMinutes = lastSeen ? (now - lastSeen) / 60000 : Number.POSITIVE_INFINITY;
            const isOnlineFlag = s.online_status === 1 || s.online_status === '1' || s.online_status === true;
            const isOnline = isOnlineFlag && diffMinutes <= 5; // 5 dk içinde aktifse online

            return {
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              class: s.className,
              alan: s.alan || null,
              online: isOnline,
              overdue: 0, // Varsayılan
              completed: 0, // Varsayılan
              photo: s.profilePhoto || null,
              email: s.email,
              phone: s.phone,
              meetingDay: (() => {
                const raw = s.meetingDay ?? s.meeting_day ?? s.gorusmeGunu ?? s.gorusme_gunu;
                const parsed = parseInt(raw, 10);
                return Number.isFinite(parsed) && parsed >= 1 && parsed <= 7 ? parsed : 1;
              })(),
              meetingDate: s.meetingDate ?? s.meeting_date ?? null,
              sonGirisTarihi: s.son_giris_tarihi || null
            };
          });
          setStudents(formattedStudents);
          // Öğrenciler yüklendikten sonra etüt istatistiklerini getir
          fetchEtutStatsForStudents(formattedStudents);
        }
        setStudentsLoading(false);
      })
      .catch(err => {
        console.error('Öğrenciler yüklenemedi:', err);
        setStudentsLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Günlük soru istatistiklerini hesapla
  const fetchQuestionStats = async () => {
    if (!selectedStudent || !selectedStudent.id) return;
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
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_student_program.php?studentId=${selectedStudent.id}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        let todayRequired = 0;
        let weekRequired = 0;
        let weekPending = 0;
        let totalSolved = 0;

        // Bugüne kadar tüm programları çek (toplam çözülen için)
        const allTimeResponse = await fetch(
          `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_student_program.php?studentId=${selectedStudent.id}&startDate=2020-01-01&endDate=${todayStr}`
        );
        const allTimeData = await allTimeResponse.json();
        const allPrograms = allTimeData.success ? allTimeData.programs : [];

        // Bugüne kadar toplam çözülen soru sayısı
        allPrograms.forEach(prog => {
          if (prog.soru_sayisi && (prog.durum === 'yapildi' || prog.durum === 'eksik_yapildi')) {
            totalSolved += parseInt(prog.soru_sayisi) || 0;
          }
        });

        // Bu hafta için hesaplamalar
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
      console.error('İstatistikler yüklenemedi:', err);
    } finally {
      setQuestionStatsLoading(false);
    }
  };

  // Öğrenci seçildiğinde veya aktif menü değiştiğinde istatistikleri güncelle
  useEffect(() => {
    if (activeMenu === 'gunluk-soru' && selectedStudent) {
      fetchQuestionStats();
    }
  }, [activeMenu, selectedStudent]);

  // Günlük soru sekmesine geçildiğinde varsayılan tab'ı ayarla
  useEffect(() => {
    if (activeMenu === 'gunluk-soru') {
      const validTabs = ['soru-dagilimi', 'sure-dagilimi', 'konu-dagilimi'];
      if (!validTabs.includes(activeTab)) {
        setActiveTab('konu-dagilimi'); // Konu Dağılımı varsayılan sekme
      }
    }
  }, [activeMenu]);

  // Tüm program verilerini çek (konu dağılımı için)
  const fetchAllPrograms = async () => {
    if (!selectedStudent || !selectedStudent.id) return;
    setTopicStatsLoading(true);
    try {
      // Bugüne kadar tüm programları çek
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const response = await fetch(
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_student_program.php?studentId=${selectedStudent.id}&startDate=2020-01-01&endDate=${todayStr}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        setAllPrograms(data.programs);
      }
    } catch (err) {
      console.error('Program verileri yüklenemedi:', err);
    } finally {
      setTopicStatsLoading(false);
    }
  };

  // Konu istatistiklerini hesapla
  const calculateTopicStats = (subject) => {
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

    // Yüzdeleri hesapla
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

  // Konu dağılımı sekmesi açıldığında program verilerini çek
  useEffect(() => {
    if (activeTab === 'konu-dagilimi' && selectedStudent) {
      fetchAllPrograms();
      setSelectedExamArea(null);
      setSelectedSubject(null);
    }
  }, [activeTab, selectedStudent]);

  // Ders seçildiğinde konu istatistiklerini hesapla
  useEffect(() => {
    if (selectedSubject && allPrograms.length > 0) {
      const stats = calculateTopicStats(selectedSubject);
      setTopicStats(stats);
    } else if (selectedSubject && allPrograms.length === 0) {
      setTopicStats({});
    }
  }, [selectedSubject, allPrograms]);

  // Soru dağılımı istatistiklerini hesapla
  const fetchQuestionDistributionStats = async () => {
    if (!selectedStudent || !selectedStudent.id || !selectedQuestionExamArea) return;
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
        case 'haftalik':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
          startDate = weekStart;
          endDate = new Date(today);
          break;
        case 'aylik':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today);
          break;
        case 'tum-zamanlar':
          // Öğrencinin ilk program tarihini kullan (meetingDate varsa onu, yoksa 1 yıl öncesini kullan)
          if (selectedStudent?.meetingDate || selectedStudent?.meeting_date) {
            const meetingDate = new Date(selectedStudent.meetingDate || selectedStudent.meeting_date);
            if (!isNaN(meetingDate.getTime())) {
              startDate = new Date(meetingDate);
              startDate.setHours(0, 0, 0, 0);
            } else {
              // Geçersiz tarih ise 1 yıl öncesini kullan
              startDate = new Date(today);
              startDate.setFullYear(today.getFullYear() - 1);
            }
          } else {
            // Meeting date yoksa 1 yıl öncesini kullan
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
          }
          endDate = new Date(today);
          break;
        default:
          startDate = new Date(today);
          endDate = new Date(today);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_student_program.php?studentId=${selectedStudent.id}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        // Ders bazlı soru sayılarını hesapla (tüm sorular - yapıldı ve yapılmadı ayrı)
        const subjectMap = {};
        // Aynı programın tekrar sayılmasını önlemek için unique key'ler
        const processedPrograms = new Set();
        
        data.programs.forEach(prog => {
          // Sadece "yapildi" durumundaki programları say
          if (prog.durum !== 'yapildi') return;
          
          // Sadece soru çözümü programlarını say (program_tipi === 'soru_cozum' veya soru_sayisi varsa)
          if (prog.ders && (prog.program_tipi === 'soru_cozum' || prog.soru_sayisi)) {
            const subject = prog.ders;
            const soruSayisi = parseInt(prog.soru_sayisi) || 0;
            
            // Soru sayısı 0 ise atla
            if (soruSayisi === 0) return;
            
            // Program'ın unique key'ini oluştur (id, tarih, ders, soru_sayisi kombinasyonu)
            // Rutinlerden gelen programlar için routine_id + tarih kullan
            const programKey = prog.id 
              ? `prog_${prog.id}` 
              : prog.routine_id 
                ? `routine_${prog.routine_id}_${prog.tarih}_${prog.ders}_${soruSayisi}`
                : `${prog.tarih}_${prog.ders}_${prog.baslangic_saati}_${soruSayisi}`;
            
            // Eğer bu program daha önce işlendiyse atla (tekrar saymayı önle)
            if (processedPrograms.has(programKey)) {
              return;
            }
            processedPrograms.add(programKey);
            
            if (!subjectMap[subject]) {
              subjectMap[subject] = {
                yapildi: 0
              };
            }
            
            subjectMap[subject].yapildi += soruSayisi;
          }
        });

        console.log('Soru dağılımı istatistikleri:', {
          period: questionDistributionPeriod,
          studentId: selectedStudent.id,
          totalPrograms: data.programs.length,
          processedPrograms: processedPrograms.size,
          subjectMap
        });

        setQuestionDistributionStats(subjectMap);
      }
    } catch (err) {
      console.error('Soru dağılımı istatistikleri yüklenemedi:', err);
    } finally {
      setQuestionDistributionLoading(false);
    }
  };

  // Soru dağılımı sekmesi veya period değiştiğinde istatistikleri güncelle
  useEffect(() => {
    if (activeTab === 'soru-dagilimi' && selectedStudent && selectedQuestionExamArea) {
      fetchQuestionDistributionStats();
    }
  }, [activeTab, selectedStudent, selectedQuestionExamArea, questionDistributionPeriod]);

  // Soru dağılımı sekmesi açıldığında sınav seçimini sıfırla
  useEffect(() => {
    if (activeTab === 'soru-dagilimi') {
      setSelectedQuestionExamArea(null);
      setQuestionDistributionPeriod('gunluk');
      setQuestionDistributionStats({});
    }
  }, [activeTab]);

  // Süre hesaplama fonksiyonu
  const calculateDurationBetweenTimes = (start, end) => {
    if (!start || !end) return 0;
    const startTime = start.split(':').map(v => parseInt(v, 10));
    const endTime = end.split(':').map(v => parseInt(v, 10));
    if (startTime.length < 2 || endTime.length < 2) return 0;
    if ([startTime[0], startTime[1], endTime[0], endTime[1]].some(v => Number.isNaN(v))) return 0;
    const startTotal = startTime[0] * 60 + (startTime[1] || 0);
    const endTotal = endTime[0] * 60 + (endTime[1] || 0);
    const diff = endTotal - startTotal;
    return diff > 0 ? diff / 60 : 0; // Saat cinsinden döndür
  };

  // Süre dağılımı istatistiklerini hesapla
  const fetchTimeDistributionStats = async () => {
    if (!selectedStudent || !selectedStudent.id) return;
    setTimeDistributionLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Öğrencinin meetingDate'inden bugüne kadar tüm programları çek
      let startDate;
      if (selectedStudent?.meetingDate || selectedStudent?.meeting_date) {
        const meetingDate = new Date(selectedStudent.meetingDate || selectedStudent.meeting_date);
        if (!isNaN(meetingDate.getTime())) {
          startDate = new Date(meetingDate);
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
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_student_program.php?studentId=${selectedStudent.id}&startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        // Bu haftanın başlangıcını hesapla (Pazartesi)
        const currentWeekStart = new Date(today);
        const dayOfWeek = currentWeekStart.getDay();
        const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Pazartesi
        currentWeekStart.setDate(diff);
        currentWeekStart.setHours(0, 0, 0, 0);

        // Önceki hafta (bir hafta önce)
        const prevWeekStart = new Date(currentWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
        prevWeekEnd.setHours(23, 59, 59, 999);

        // Bu hafta
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
        currentWeekEnd.setHours(23, 59, 59, 999);

        // Sonraki hafta (bir hafta sonra)
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);

        // Haftalık günlük toplamlar için
        const weeklyDailyMap = {
          prev: { 'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0 },
          current: { 'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0 },
          next: { 'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0 }
        };

        // Haftalık toplamlar
        const weeklyMap = {};
        
        // Gün isimleri
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        
        data.programs.forEach(prog => {
          // Sadece "yapildi" durumundaki programları say
          if (prog.durum !== 'yapildi') return;
          
          if (prog.baslangic_saati && prog.bitis_saati && prog.tarih) {
            const duration = calculateDurationBetweenTimes(prog.baslangic_saati, prog.bitis_saati);
            if (duration > 0) {
              const date = new Date(prog.tarih);
              if (!isNaN(date.getTime())) {
                const dayName = dayNames[date.getDay()];
                
                // Önceki hafta
                if (date >= prevWeekStart && date <= prevWeekEnd) {
                  if (weeklyDailyMap.prev.hasOwnProperty(dayName)) {
                    weeklyDailyMap.prev[dayName] += duration;
                  }
                }
                // Bu hafta
                else if (date >= currentWeekStart && date <= currentWeekEnd) {
                  if (weeklyDailyMap.current.hasOwnProperty(dayName)) {
                    weeklyDailyMap.current[dayName] += duration;
                  }
                }
                // Sonraki hafta
                else if (date >= nextWeekStart && date <= nextWeekEnd) {
                  if (weeklyDailyMap.next.hasOwnProperty(dayName)) {
                    weeklyDailyMap.next[dayName] += duration;
                  }
                }

                // Haftalık toplamlar için
                // Öğrencinin meetingDate'inden itibaren hafta numarasını hesapla
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

        // Haftalık verileri array'e çevir
        const weeklyArray = Object.entries(weeklyMap)
          .map(([week, totalHours]) => ({
            week: parseInt(week, 10),
            totalHours: Math.round(totalHours * 10) / 10 // 1 ondalık basamağa yuvarla
          }))
          .sort((a, b) => a.week - b.week);

        // Haftalık günlük verileri yuvarla
        const weeklyDailyRounded = {
          prev: {},
          current: {},
          next: {}
        };
        Object.keys(weeklyDailyMap).forEach(period => {
          Object.keys(weeklyDailyMap[period]).forEach(day => {
            weeklyDailyRounded[period][day] = Math.round(weeklyDailyMap[period][day] * 10) / 10;
          });
        });

        setTimeDistributionStats({
          daily: {}, // Artık kullanılmıyor, weeklyDaily kullanılıyor
          weekly: weeklyArray,
          weeklyDaily: weeklyDailyRounded
        });
      }
    } catch (err) {
      console.error('Süre dağılımı istatistikleri yüklenemedi:', err);
    } finally {
      setTimeDistributionLoading(false);
    }
  };

  // Süre dağılımı sekmesi açıldığında istatistikleri güncelle
  useEffect(() => {
    if (activeTab === 'sure-dagilimi' && selectedStudent) {
      fetchTimeDistributionStats();
    }
  }, [activeTab, selectedStudent]);

  // Ders/Konu bazlı başarım istatistiklerini hesapla
  const fetchDersBasariStats = async () => {
    if (!selectedStudent || !selectedStudent.id) return;
    setDersBasariLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const response = await fetch(
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_student_program.php?studentId=${selectedStudent.id}&startDate=2020-01-01&endDate=${todayStr}`
      );
      const data = await response.json();
      
      if (data.success && data.programs) {
        // Öğrencinin alanına göre dersleri al
        const studentArea = selectedStudent.alan || selectedStudent.area || 'yks_say';
        let studentSubjects = EXAM_SUBJECTS_BY_AREA[studentArea] || [];
        
        // TYT veya AYT filtrelemesi
        if (studentArea.startsWith('yks_')) {
          if (dersBasariExamType === 'tyt') {
            // Sadece TYT dersleri
            studentSubjects = studentSubjects.filter(s => s.startsWith('TYT '));
          } else if (dersBasariExamType === 'ayt') {
            // Sadece AYT dersleri
            studentSubjects = studentSubjects.filter(s => s.startsWith('AYT '));
          }
        }
        
        const dersStats = {};
        const dersDetailMap = {}; // Her ders için konu detayları
        
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
            
            // Konu detayları için
            if (!topicMap[konu]) {
              topicMap[konu] = {
                total: 0,
                yapildi: 0
              };
            }
            topicMap[konu].total += soruSayisi;
            if (prog.durum === 'yapildi') {
              topicMap[konu].yapildi += soruSayisi;
            }
          });
          
          // Program verilmemiş olsa bile tüm dersleri göster
          const yapildiPercent = totalSoru > 0 ? Math.round((yapildiSoru / totalSoru) * 100) : 0;
          dersStats[subject] = {
            total: totalSoru,
            yapildi: yapildiSoru,
            yapilmadi: totalSoru - yapildiSoru,
            yapildiPercent: yapildiPercent
          };
          dersDetailMap[subject] = topicMap;
        });
        
        setDersBasariStats(dersStats);
        setDersDetailTopics(dersDetailMap);
      }
    } catch (err) {
      console.error('Ders başarı istatistikleri yüklenemedi:', err);
    } finally {
      setDersBasariLoading(false);
    }
  };

  // Ders/Konu bazlı başarım sekmesi açıldığında istatistikleri güncelle
  useEffect(() => {
    if (activeMenu === 'ders-basari' && selectedStudent) {
      fetchDersBasariStats();
    }
  }, [activeMenu, selectedStudent, dersBasariExamType]);

  // Kaynak ve Konu İlerlemesi - Veri çekme
  const fetchKonuIlerlemesi = async () => {
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    const dersForPayload = (selectedDersForIlerleme || '').trim();
    if (!studentIdForPayload || !dersForPayload) {
      console.warn('Konu ilerlemesi çağrısı atlandı: eksik studentId/ders', { studentIdForPayload, dersForPayload });
      return;
    }
    setKonuIlerlemesiLoading(true);
    try {
      const response = await fetch(
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_konu_ilerlemesi.php?studentId=${studentIdForPayload}&ders=${encodeURIComponent(dersForPayload)}`
      );
      const data = await response.json();
      
      if (data.success && data.konular && data.konular.length > 0) {
        // Backend zaten sira’ya göre sıralı dönüyor, direkt set et
        setKonuIlerlemesi(data.konular);
      } else {
        // Eğer konu yoksa, 10 konu oluştur (otomatik kaydetme, sadece göster)
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
      // Hata durumunda da default konular oluştur
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

  // Kaynak ve Konu İlerlemesi - Veri kaydetme
  const saveKonuIlerlemesi = async (showAlert = false, konularOverride = null) => {
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    if (!studentIdForPayload || !selectedDersForIlerleme) {
      if (showAlert) {
        alert('Öğrenci veya ders seçili değil');
      }
      return;
    }
    const payloadKonular = konularOverride || konuIlerlemesi;
    setSavingIlerleme(true);
    try {
      const response = await fetch(
        'https://vedatdaglarmuhendislik.com.tr/php-backend/api/save_konu_ilerlemesi.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: studentIdForPayload,
            ders: (selectedDersForIlerleme || '').trim(),
            konular: payloadKonular
          })
        }
      );
      const data = await response.json();
      if (data.success) {
        if (showAlert) {
          alert('Kaydedildi!');
        }
        // Kayıttan hemen sonra yeniden çekip sıralamayı kesinleştir
        fetchKonuIlerlemesi();
      } else {
        if (showAlert) {
          alert(data.message || 'Kaydetme hatası');
        }
      }
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      if (showAlert) {
        alert('Kaydetme hatası');
      }
    } finally {
      setSavingIlerleme(false);
    }
  };

  // Konu sıralama (drag-drop)
  const handleKonuDragStart = (e, index) => {
    setDraggedKonu(index);
    e.dataTransfer.effectAllowed = 'move';
    // Bazı tarayıcılarda drag'in başlaması için veri set etmek gerekiyor
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleKonuDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleKonuDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedKonu === null || draggedKonu === targetIndex) return;
    
    const newKonular = [...konuIlerlemesi];
    const [removed] = newKonular.splice(draggedKonu, 1);
    newKonular.splice(targetIndex, 0, removed);
    
    // Sıra numaralarını güncelle
    newKonular.forEach((konu, idx) => {
      konu.sira = idx + 1;
    });
    
    setKonuIlerlemesi(newKonular);
    setDraggedKonu(null);
    // Otomatik kaydet (alert gösterme yok) - yeni sıralama ile kaydet
    setTimeout(() => {
      saveKonuIlerlemesi(false, newKonular);
    }, 50);
  };

  // Durum değişikliği
  const handleDurumChange = (index, newDurum) => {
    const newKonular = [...konuIlerlemesi];
    newKonular[index].durum = newDurum;
    newKonular[index].tarih = new Date().toISOString().split('T')[0];
    setKonuIlerlemesi(newKonular);
    // Otomatik kaydet (alert gösterme yok)
    setTimeout(() => {
      saveKonuIlerlemesi(false, newKonular);
    }, 50);
  };

  // Kaynak ekleme
  const handleKaynakEkle = async () => {
    if (!yeniKaynakAdi.trim()) return;
    const newKonular = konuIlerlemesi.map(k => {
      const kaynaklar = Array.isArray(k.kaynaklar) ? [...k.kaynaklar] : [];
      kaynaklar.push({
        id: null,
        kaynak_adi: yeniKaynakAdi.trim(),
        tamamlandi: false
      });
      return { ...k, kaynaklar };
    });
    setKonuIlerlemesi(newKonular);
    setYeniKaynakAdi('');
    setShowKaynakEkleModal(false);
    setTimeout(() => {
      saveKonuIlerlemesi(false, newKonular);
    }, 50);
  };

  // Kaynak tamamlama durumu değiştir
  const handleKaynakToggle = (konuIndex, kaynakIndex) => {
    const newKonular = [...konuIlerlemesi];
    if (newKonular[konuIndex].kaynaklar && newKonular[konuIndex].kaynaklar[kaynakIndex]) {
      newKonular[konuIndex].kaynaklar[kaynakIndex].tamamlandi = !newKonular[konuIndex].kaynaklar[kaynakIndex].tamamlandi;
      setKonuIlerlemesi(newKonular);
      // Otomatik kaydet (alert gösterme yok)
      setTimeout(() => {
        saveKonuIlerlemesi(false, newKonular);
      }, 50);
    }
  };

  // Kaynak silme
  const handleKaynakSil = (konuIndex, kaynakIndex) => {
    const newKonular = [...konuIlerlemesi];
    if (newKonular[konuIndex].kaynaklar) {
      newKonular[konuIndex].kaynaklar.splice(kaynakIndex, 1);
      setKonuIlerlemesi(newKonular);
      // Otomatik kaydet (alert gösterme yok)
      setTimeout(() => {
        saveKonuIlerlemesi(false, newKonular);
      }, 50);
    }
  };

  // Yüzde hesaplama
  const calculateYuzde = (kaynaklar) => {
    if (!kaynaklar || kaynaklar.length === 0) return 0;
    const tamamlanan = kaynaklar.filter(k => k.tamamlandi).length;
    return Math.round((tamamlanan / kaynaklar.length) * 100);
  };

  // Yüzdeye göre renk
  const getYuzdeColor = (yuzde) => {
    if (yuzde === 0) return '#ef4444'; // Kırmızı
    if (yuzde === 100) return '#10b981'; // Yeşil
    // Kırmızıdan yeşile geçiş
    const red = Math.round(239 - (yuzde / 100) * 229); // 239 -> 10
    const green = Math.round(68 + (yuzde / 100) * 113); // 68 -> 181
    return `rgb(${red}, ${green}, 68)`;
  };

  // Branş denemeleri yardımcıları
  const bransNet = useMemo(() => {
    const d = Number(bransDenemeForm.dogru) || 0;
    const y = Number(bransDenemeForm.yanlis) || 0;
    const net = d - y * 0.25;
    return net.toFixed(2);
  }, [bransDenemeForm.dogru, bransDenemeForm.yanlis]);

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
    if (field === 'alan') {
      // Alan değişince ders ve konuları sıfırla
      setBransDenemeForm((prev) => ({ ...prev, ders: '' }));
      setBransKonuDetayAcik(false);
      setBransKonular([]);
    }
  };

  const fetchBransKonular = async (dersName) => {
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    if (!studentIdForPayload || !dersName) {
      setBransKonular([]);
      return;
    }
    try {
      const response = await fetch(
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_konu_ilerlemesi.php?studentId=${studentIdForPayload}&ders=${encodeURIComponent(
          dersName
        )}`
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
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    const area = bransDenemeForm.alan || selectedStudent?.alan || '';
    if (!studentIdForPayload) {
      alert('Öğrenci seçilmedi');
      return;
    }
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
      const response = await fetch('https://vedatdaglarmuhendislik.com.tr/php-backend/api/save_brans_deneme.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentIdForPayload,
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

  const fetchBransDenemeleri = async () => {
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    if (!studentIdForPayload) return;
    setBransDenemelerLoading(true);
    try {
      const response = await fetch(
        `https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_brans_denemeleri.php?studentId=${studentIdForPayload}`
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.denemeler)) {
        setBransDenemeList(data.denemeler);
        if (data.denemeler.length > 0) {
          setBransChartsSelectedDers((prev) => prev || data.denemeler[0].ders);
        }
      } else {
        setBransDenemeList([]);
      }
    } catch (err) {
      console.error('Branş denemeleri çekilemedi', err);
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
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    if (!studentIdForPayload) {
      alert('Öğrenci seçilmedi');
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

      const response = await fetch('https://vedatdaglarmuhendislik.com.tr/php-backend/api/save_genel_deneme.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentIdForPayload,
          denemeAdi: genelDenemeForm.denemeAdi,
          denemeTarihi: genelDenemeForm.denemeTarihi,
          notlar: genelDenemeForm.notlar || '',
          sinavTipi: (() => {
            const studentAreaRaw = selectedStudent?.alan || '';
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
        setGenelDenemeForm({ denemeAdi: '', denemeTarihi: '', notlar: '' });
        setGenelDenemeDersler({});
        setGenelDenemeDegerlendirme({
          zamanYeterli: null,
          odaklanma: null,
          kaygiDuzeyi: null,
          enZorlayanDers: '',
          kendiniHissediyorsun: null
        });
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

  const fetchGenelDenemeler = async () => {
    const studentIdForPayload = selectedStudent?.id || selectedStudent?.studentId || selectedStudent?.student_id;
    if (!studentIdForPayload) return;
    
    setGenelDenemeListLoading(true);
    try {
      const response = await fetch(`https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_genel_denemeler.php?studentId=${studentIdForPayload}`);
      const data = await response.json();
      if (data.success) {
        setGenelDenemeList(data.denemeler || []);
      }
    } catch (error) {
      console.error('Genel denemeler yüklenemedi', error);
      setGenelDenemeList([]);
    } finally {
      setGenelDenemeListLoading(false);
    }
  };

  // TYT ve AYT ortalamalarını hesapla
  const calculateGenelDenemeOrtalamalari = useMemo(() => {
    if (!genelDenemeList || genelDenemeList.length === 0) {
      return { tytOrtalama: 0, aytOrtalama: 0 };
    }

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

    // TYT ve AYT netlerini topla
    let tytToplamNet = 0;
    let tytSayisi = 0;
    let aytToplamNet = 0;
    let aytSayisi = 0;

    filteredDenemeler.forEach((deneme) => {
      const sinavTipi = deneme.sinavTipi || 'tyt';
      const dersSonuclari = deneme.dersSonuclari || {};
      
      let toplamNet = 0;
      Object.entries(dersSonuclari).forEach(([ders, data]) => {
        // net değerini güvenli bir şekilde parse et
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

      // sinavTipi'ne göre say, toplamNet > 0 kontrolünü kaldır (0 net olsa bile sayılmalı)
      if (sinavTipi === 'tyt') {
        tytToplamNet += toplamNet;
        tytSayisi++;
      } else if (sinavTipi === 'ayt') {
        aytToplamNet += toplamNet;
        aytSayisi++;
      }
    });

    const tytOrtalama = tytSayisi > 0 ? parseFloat((tytToplamNet / tytSayisi).toFixed(2)) : 0;
    const aytOrtalama = aytSayisi > 0 ? parseFloat((aytToplamNet / aytSayisi).toFixed(2)) : 0;

    return { tytOrtalama, aytOrtalama };
  }, [genelDenemeList, genelDenemeFilter]);

  // Genel denemeler sekmesine girildiğinde verileri yükle ve formu sıfırla
  useEffect(() => {
    if (activeMenu === 'genel-denemeler' && selectedStudent) {
      fetchGenelDenemeler();
      // Öğrencinin alanına göre formu sıfırla
      const studentAreaRaw = selectedStudent?.alan || '';
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
  }, [activeMenu, selectedStudent]);

  // Ders seçili olduğunda veriyi çek
  useEffect(() => {
    if (activeMenu === 'kaynak-konu-ilerlemesi' && selectedStudent && selectedDersForIlerleme) {
      fetchKonuIlerlemesi();
    }
  }, [activeMenu, selectedStudent, selectedDersForIlerleme]);

  // Branş denemeleri - öğrenci değişince alan ve konuları sıfırla
  useEffect(() => {
    setBransDenemeForm((prev) => ({
      ...prev,
      alan: selectedStudent?.alan || '',
      ders: ''
    }));
    setBransKonular([]);
    setBransExamType('tyt'); // Varsayılan olarak TYT
    setBransKonuDetayAcik(false);
  }, [selectedStudent]);

  // Branş denemeleri - grafik görünümüne geçince verileri çek
  useEffect(() => {
    if (bransView === 'charts' && selectedStudent) {
      fetchBransDenemeleri();
    }
  }, [bransView, selectedStudent]);

  // Menü dışına tıklanınca menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest('.card-menu')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Öğrenci ekleme fonksiyonları
  function handleStudentFormChange(e) {
    const { name, value } = e.target;
    setStudentForm(f => ({ ...f, [name]: value }));
  }

  async function handleStudentPhotoUpload(e) {
    setStuUploading(true); setAddError(''); setAddSuccess('');
    const file = e.target.files[0]; if (!file) return;
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData();
    formData.append('photo', file);
    // Öğrenci fotoğrafları için geçici ID kullan (öğrenci henüz oluşturulmadı)
    formData.append('_id', 'temp_' + Date.now());
    formData.append('type', 'student'); // Öğrenci fotoğrafı olduğunu belirt
    try {
      const res = await fetch(API_PHOTO, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || 'Yükleme hatası!');
      setStudentForm(f => ({ ...f, profilePhoto: data.url }));
      setAddSuccess('Fotoğraf yüklendi!');
    } catch (err) {
      setAddError('Fotoğraf yüklenemedi: ' + err.message);
    } finally { setStuUploading(false); }
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    if (!studentForm.firstName || !studentForm.lastName ||
        !studentForm.email || !studentForm.className || !studentForm.alan || !studentForm.password) {
      setAddError('Tüm zorunlu alanları doldurun!');
      return;
    }
    if (studentForm.password !== studentForm.passwordConfirm) {
      setAddError('Şifreler eşleşmiyor!');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user'));
    setAdding(true);
    let meetingDate = null;
    if (studentForm.meetingDate) {
      const d = new Date(studentForm.meetingDate);
      if (!Number.isNaN(d.getTime())) {
        meetingDate = d.toISOString().split('T')[0];
      }
    }
    const payload = {
      alan: studentForm.alan,
      firstName: studentForm.firstName,
      lastName: studentForm.lastName,
      email: studentForm.email,
      phone: studentForm.phone,
      className: studentForm.className,
      profilePhoto: studentForm.profilePhoto,
      password: studentForm.password,
      meetingDate,
      teacherId: user.id
    };
    try {
      const res = await fetch(API_STUDENT, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız');
      setAddSuccess('Öğrenci kaydedildi!');
      setStudentForm({
        alan: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        className: '',
        profilePhoto: '',
        password: '',
        passwordConfirm: '',
        meetingDay: 1,
        meetingDate: ''
      });
      setShowAddStudentModal(false);
      // Öğrenci listesini yenile
      fetchStudents();
    } catch (err) {
      setAddError(err.message);
    }
    setAdding(false);
  }

  // Öğrenci düzenleme fonksiyonları
  const handleEditStudent = (student) => {
    // Backend formatından frontend formatına çevir
    const backendStudent = students.find(s => s.id === student.id);
    if (!backendStudent) {
      // Eğer students listesinde yoksa, backend'den çek
      const user = JSON.parse(localStorage.getItem('user'));
      fetch(`https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_teacher_students.php?teacherId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.students) {
            const found = data.students.find(s => s.id === student.id);
            if (found) {
              setEditStudentForm({
                id: found.id,
                alan: found.alan || '',
                firstName: found.firstName || '',
                lastName: found.lastName || '',
                email: found.email || '',
                phone: found.phone || '',
                className: found.className || '',
                profilePhoto: found.profilePhoto || '',
                meetingDate: found.meetingDate ? found.meetingDate.split('T')[0] : '',
                password: '',
                passwordConfirm: ''
              });
              setEditingStudent(found);
              setShowEditStudentModal(true);
              setOpenMenuId(null);
            }
          }
        });
    } else {
      // Backend formatından düzenleme formuna çevir
      const user = JSON.parse(localStorage.getItem('user'));
      fetch(`https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_teacher_students.php?teacherId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.students) {
            const found = data.students.find(s => s.id === student.id);
            if (found) {
              setEditStudentForm({
                id: found.id,
                alan: found.alan || '',
                firstName: found.firstName || '',
                lastName: found.lastName || '',
                email: found.email || '',
                phone: found.phone || '',
                className: found.className || '',
                profilePhoto: found.profilePhoto || '',
                meetingDate: found.meetingDate ? found.meetingDate.split('T')[0] : '',
                password: '',
                passwordConfirm: ''
              });
              setEditingStudent(found);
              setShowEditStudentModal(true);
              setOpenMenuId(null);
            }
          }
        });
    }
  };

  function handleEditStudentFormChange(e) {
    const { name, value } = e.target;
    setEditStudentForm(f => ({ ...f, [name]: value }));
  }

  async function handleEditStudentPhotoUpload(e) {
    setEditStuUploading(true); setUpdateError(''); setUpdateSuccess('');
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('_id', editingStudent.id);
    formData.append('type', 'student');
    try {
      const res = await fetch(API_PHOTO, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || 'Yükleme hatası!');
      setEditStudentForm(f => ({ ...f, profilePhoto: data.url }));
      setUpdateSuccess('Fotoğraf yüklendi!');
    } catch (err) {
      setUpdateError('Fotoğraf yüklenemedi: ' + err.message);
    } finally { setEditStuUploading(false); }
  }

  async function handleUpdateStudent(e) {
    e.preventDefault();
    setUpdateError(''); setUpdateSuccess('');
    if (!editStudentForm.firstName || !editStudentForm.lastName ||
        !editStudentForm.email || !editStudentForm.className || !editStudentForm.alan) {
      setUpdateError('Tüm zorunlu alanları doldurun!');
      return;
    }
    if (editStudentForm.password && editStudentForm.password !== editStudentForm.passwordConfirm) {
      setUpdateError('Şifreler eşleşmiyor!');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user'));
    setUpdating(true);
    const payload = {
      id: editStudentForm.id,
      teacherId: user.id,
      firstName: editStudentForm.firstName,
      lastName: editStudentForm.lastName,
      email: editStudentForm.email,
      phone: editStudentForm.phone,
      className: editStudentForm.className,
      alan: editStudentForm.alan,
      profilePhoto: editStudentForm.profilePhoto,
      meetingDate: editStudentForm.meetingDate || null
    };
    if (editStudentForm.password) {
      payload.password = editStudentForm.password;
    }
    try {
      const res = await fetch(API_UPDATE_STUDENT, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız');
      setUpdateSuccess('Öğrenci güncellendi!');
      setTimeout(() => {
        setShowEditStudentModal(false);
        setEditingStudent(null);
        fetchStudents();
      }, 1000);
    } catch (err) {
      setUpdateError(err.message);
    }
    setUpdating(false);
  }

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      setOpenMenuId(null);
      return;
    }
    const user = JSON.parse(localStorage.getItem('user'));
    setDeletingStudentId(studentId);
    setOpenMenuId(null);
    try {
      const res = await fetch(API_DELETE_STUDENT, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, teacherId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Silme işlemi başarısız');
      fetchStudents();
    } catch (err) {
      alert('Silme hatası: ' + err.message);
    } finally {
      setDeletingStudentId(null);
    }
  };

  if (studentPanelActive && selectedStudent) {
    return (
      <div className="ogretmen-panel student-panel">
        {/* Sol Sidebar - Öğrenci Paneli */}
        <div className="sidebar student-sidebar">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">
              <FontAwesomeIcon icon={faBook} />
            </div>
            <span className="logo-text">KoçApp</span>
          </div>
          <div className="user-role">Öğretmen</div>
        </div>
          <nav className="sidebar-nav">
            {studentMenuItems.map((item) => (
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

          <button className="logout-btn" onClick={handleBackToStudents}>
            <span className="logout-icon">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </span>
            Geri Dön
          </button>
        </div>

        {/* Ana İçerik Alanı */}
        <div className="main-content">
          {/* İçerik Alanı */}
          <div className="content-area">
            {activeMenu === 'plan-program' && selectedStudent ? (
              <OgrenciProgramTab 
                student={selectedStudent} 
                teacherId={JSON.parse(localStorage.getItem('user'))?.id}
              />
            ) : activeMenu === 'plan-program' ? (
              <div className="plan-program-content">
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Plan Program</h1>
                    <p className="welcome-subtitle">Öğrenci seçin</p>
                  </div>
                </div>

                {/* Plan Program Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <div className="card-content">
                      <h3>Toplam Konu Sayısı</h3>
                      <div className="card-number">24</div>
                      <div className="card-subtitle">Bu dönem için planlanan</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Tamamlanan Konular</h3>
                      <div className="card-number">18</div>
                      <div className="card-subtitle">%75 tamamlandı</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '75%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="card-content">
                      <h3>Bu Hafta Atanan Sorular</h3>
                      <div className="card-number">150</div>
                      <div className="card-subtitle">Matematik + Fizik</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Başarı Oranı</h3>
                      <div className="card-number">%85</div>
                      <div className="card-subtitle">Mevcut: %78</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'konular' ? 'active' : ''}`}
                      onClick={() => setActiveTab('konular')}
                    >
                      Konu Anlatımları
                    </button>
                    <button 
                      className={`tab ${activeTab === 'sorular' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sorular')}
                    >
                      Soru Atamaları
                    </button>
                    <button 
                      className={`tab ${activeTab === 'takvim' ? 'active' : ''}`}
                      onClick={() => setActiveTab('takvim')}
                    >
                      Haftalık Takvim
                    </button>
                    <button 
                      className={`tab ${activeTab === 'veli-bilgileri' ? 'active' : ''}`}
                      onClick={() => setActiveTab('veli-bilgileri')}
                    >
                      Veli Bilgileri
                    </button>
                  </div>
                </div>

                {/* Konu Anlatımları Sekmesi */}
                {activeTab === 'konular' && (
                  <div className="konu-anlatimlari">
                    <div className="section-header">
                      <h2>Konu Anlatımları</h2>
                      <button className="add-konu-btn">
                        <FontAwesomeIcon icon={faBook} />
                        Yeni Konu Ekle
                      </button>
                    </div>

                    <div className="konu-grid">
                      <div className="konu-card">
                        <div className="konu-header">
                          <h3>Matematik - Fonksiyonlar</h3>
                          <span className="konu-durum completed">Tamamlandı</span>
                        </div>
                        <div className="konu-content">
                          <p>Fonksiyon kavramı, tanım ve değer kümesi, fonksiyon türleri</p>
                          <div className="konu-meta">
                            <span className="konu-tarih">15 Ekim 2024</span>
                            <span className="konu-soru-sayisi">50 soru atandı</span>
                          </div>
                        </div>
                        <div className="konu-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Görüntüle</button>
                        </div>
                      </div>

                      <div className="konu-card">
                        <div className="konu-header">
                          <h3>Fizik - Hareket</h3>
                          <span className="konu-durum in-progress">Devam Ediyor</span>
                        </div>
                        <div className="konu-content">
                          <p>Düzgün doğrusal hareket, ivmeli hareket, serbest düşme</p>
                          <div className="konu-meta">
                            <span className="konu-tarih">20 Ekim 2024</span>
                            <span className="konu-soru-sayisi">75 soru atandı</span>
                          </div>
                        </div>
                        <div className="konu-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Görüntüle</button>
                        </div>
                      </div>

                      <div className="konu-card">
                        <div className="konu-header">
                          <h3>Kimya - Atom Teorisi</h3>
                          <span className="konu-durum pending">Bekliyor</span>
                        </div>
                        <div className="konu-content">
                          <p>Atom yapısı, elektron dağılımı, periyodik tablo</p>
                          <div className="konu-meta">
                            <span className="konu-tarih">25 Ekim 2024</span>
                            <span className="konu-soru-sayisi">0 soru atandı</span>
                          </div>
                        </div>
                        <div className="konu-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Görüntüle</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Soru Atamaları Sekmesi */}
                {activeTab === 'sorular' && (
                  <div className="soru-atamalari">
                    <div className="section-header">
                      <h2>Soru Atamaları</h2>
                      <button className="add-soru-btn">
                        <FontAwesomeIcon icon={faStickyNote} />
                        Yeni Soru Atama
                      </button>
                    </div>

                    <div className="soru-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Konu Seçin</label>
                          <select className="form-select">
                            <option>Matematik - Fonksiyonlar</option>
                            <option>Fizik - Hareket</option>
                            <option>Kimya - Atom Teorisi</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Soru Sayısı</label>
                          <input type="number" className="form-input" placeholder="100" />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Zorluk Seviyesi</label>
                          <select className="form-select">
                            <option>Kolay</option>
                            <option>Orta</option>
                            <option>Zor</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Teslim Tarihi</label>
                          <input type="date" className="form-input" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Özel Notlar</label>
                        <textarea className="form-textarea" placeholder="Öğrenci için özel notlar..."></textarea>
                      </div>
                      <button className="submit-btn">Soruları Ata</button>
                    </div>

                    <div className="soru-listesi">
                      <h3>Atanan Sorular</h3>
                      <div className="soru-item">
                        <div className="soru-info">
                          <h4>Matematik - Fonksiyonlar</h4>
                          <p>50 soru • Orta seviye • 22 Ekim 2024</p>
                        </div>
                        <div className="soru-durum completed">Tamamlandı</div>
                        <div className="soru-actions">
                          <button className="action-btn">Görüntüle</button>
                          <button className="action-btn">Düzenle</button>
                        </div>
                      </div>
                      <div className="soru-item">
                        <div className="soru-info">
                          <h4>Fizik - Hareket</h4>
                          <p>75 soru • Zor seviye • 25 Ekim 2024</p>
                        </div>
                        <div className="soru-durum in-progress">Devam Ediyor</div>
                        <div className="soru-actions">
                          <button className="action-btn">Görüntüle</button>
                          <button className="action-btn">Düzenle</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Veli Bilgileri Sekmesi */}
                {activeTab === 'veli-bilgileri' && (
                  <div className="veli-bilgileri" style={{padding: '24px', background: 'white', borderRadius: '12px'}}>
                    <div className="section-header" style={{marginBottom: '24px'}}>
                      <h2 style={{margin: 0, fontSize: '24px', fontWeight: 700, color: '#111827'}}>Veli Bilgileri</h2>
                    </div>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedStudent?.id) {
                        setVeliError('Öğrenci seçilmedi');
                        return;
                      }
                      
                      if (veliForm.password !== veliForm.passwordConfirm) {
                        setVeliError('Şifreler eşleşmiyor');
                        return;
                      }
                      
                      setVeliSaving(true);
                      setVeliError('');
                      setVeliSuccess('');
                      
                      try {
                        const user = JSON.parse(localStorage.getItem('user'));
                        const response = await fetch(`${API_BASE}/php-backend/api/create_parent.php`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            firstName: veliForm.firstName,
                            lastName: veliForm.lastName,
                            email: veliForm.email,
                            phone: veliForm.phone || null,
                            password: veliForm.password,
                            studentId: selectedStudent.id,
                            teacherId: user.id
                          })
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                          setVeliSuccess('Veli başarıyla oluşturuldu');
                          setVeliForm({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            password: '',
                            passwordConfirm: ''
                          });
                        } else {
                          setVeliError(data.message || 'Veli oluşturulamadı');
                        }
                      } catch (error) {
                        console.error('Veli oluşturma hatası:', error);
                        setVeliError('Veli oluşturulamadı: ' + error.message);
                      } finally {
                        setVeliSaving(false);
                      }
                    }}>
                      <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                        <div>
                          <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151'}}>Ad</label>
                          <input
                            type="text"
                            value={veliForm.firstName}
                            onChange={(e) => setVeliForm({...veliForm, firstName: e.target.value})}
                            required
                            style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}
                          />
                        </div>
                        <div>
                          <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151'}}>Soyad</label>
                          <input
                            type="text"
                            value={veliForm.lastName}
                            onChange={(e) => setVeliForm({...veliForm, lastName: e.target.value})}
                            required
                            style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}
                          />
                        </div>
                      </div>
                      
                      <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                        <div>
                          <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151'}}>E-posta</label>
                          <input
                            type="email"
                            value={veliForm.email}
                            onChange={(e) => setVeliForm({...veliForm, email: e.target.value})}
                            required
                            style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}
                          />
                        </div>
                        <div>
                          <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151'}}>Telefon</label>
                          <input
                            type="tel"
                            value={veliForm.phone}
                            onChange={(e) => setVeliForm({...veliForm, phone: e.target.value})}
                            style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}
                          />
                        </div>
                      </div>
                      
                      <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px'}}>
                        <div>
                          <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151'}}>Şifre</label>
                          <input
                            type="password"
                            value={veliForm.password}
                            onChange={(e) => setVeliForm({...veliForm, password: e.target.value})}
                            required
                            style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}
                          />
                        </div>
                        <div>
                          <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151'}}>Şifre Tekrar</label>
                          <input
                            type="password"
                            value={veliForm.passwordConfirm}
                            onChange={(e) => setVeliForm({...veliForm, passwordConfirm: e.target.value})}
                            required
                            style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}
                          />
                        </div>
                      </div>
                      
                      {veliError && (
                        <div style={{padding: '12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '16px'}}>
                          {veliError}
                        </div>
                      )}
                      
                      {veliSuccess && (
                        <div style={{padding: '12px', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', marginBottom: '16px'}}>
                          {veliSuccess}
                        </div>
                      )}
                      
                      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                        <button
                          type="button"
                          onClick={() => {
                            setVeliForm({
                              firstName: '',
                              lastName: '',
                              email: '',
                              phone: '',
                              password: '',
                              passwordConfirm: ''
                            });
                            setVeliError('');
                            setVeliSuccess('');
                          }}
                          style={{padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#374151'}}
                        >
                          Temizle
                        </button>
                        <button
                          type="submit"
                          disabled={veliSaving}
                          style={{padding: '10px 20px', background: veliSaving ? '#9ca3af' : '#6a1b9a', border: 'none', borderRadius: '8px', cursor: veliSaving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, color: 'white'}}
                        >
                          {veliSaving ? 'Kaydediliyor...' : 'Veli Oluştur'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Haftalık Takvim Sekmesi */}
                {activeTab === 'takvim' && (
                  <div className="haftalik-takvim">
                    <div className="section-header">
                      <h2>Haftalık Program</h2>
                      <div className="takvim-nav">
                        <button className="nav-btn">← Önceki Hafta</button>
                        <span className="hafta-bilgi">42. Hafta (14-20 Ekim)</span>
                        <button className="nav-btn">Sonraki Hafta →</button>
                      </div>
                    </div>

                    <div className="takvim-grid">
                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Pazartesi</h3>
                          <span className="gun-tarih">14 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="etkinlik">
                            <span className="etkinlik-saat">09:00</span>
                            <span className="etkinlik-konu">Matematik - Fonksiyonlar</span>
                          </div>
                          <div className="etkinlik">
                            <span className="etkinlik-saat">14:00</span>
                            <span className="etkinlik-konu">50 soru atandı</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Salı</h3>
                          <span className="gun-tarih">15 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="etkinlik">
                            <span className="etkinlik-saat">10:00</span>
                            <span className="etkinlik-konu">Fizik - Hareket</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Çarşamba</h3>
                          <span className="gun-tarih">16 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="etkinlik">
                            <span className="etkinlik-saat">11:00</span>
                            <span className="etkinlik-konu">Kimya - Atom Teorisi</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Perşembe</h3>
                          <span className="gun-tarih">17 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="etkinlik">
                            <span className="etkinlik-saat">09:00</span>
                            <span className="etkinlik-konu">Matematik - Türev</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Cuma</h3>
                          <span className="gun-tarih">18 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="etkinlik">
                            <span className="etkinlik-saat">14:00</span>
                            <span className="etkinlik-konu">Genel Tekrar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeMenu === 'gunluk-soru' ? (
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
                      className={`tab ${activeTab === 'konu-dagilimi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('konu-dagilimi')}
                    >
                      Konu Dağılımı
                    </button>
                    <button 
                      className={`tab ${activeTab === 'soru-dagilimi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('soru-dagilimi')}
                    >
                      Soru Dağılımı
                    </button>
                    <button 
                      className={`tab ${activeTab === 'sure-dagilimi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sure-dagilimi')}
                    >
                      Süre Dağılımı
                    </button>
                  </div>
                </div>

                {/* Soru Dağılımı Sekmesi */}
                {activeTab === 'soru-dagilimi' && (
                  <div className="dagilim-sekmesi" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                    {!selectedQuestionExamArea ? (
                      // Sınav seçimi
                      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                        <div style={{marginBottom: 32}}>
                          <h3 style={{fontSize: '24px', fontWeight: 700, marginBottom: 8, color: '#1f2937'}}>
                            Sınav Seçin
                          </h3>
                          <p style={{fontSize: '14px', color: '#6b7280'}}>
                            Analiz yapmak istediğiniz sınavı seçin
                          </p>
                        </div>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                          {(() => {
                            const studentArea = selectedStudent?.alan || '';
                            const isYks = studentArea.startsWith('yks_');
                            
                            // YKS öğrencileri için TYT ve AYT seçenekleri
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
                                      onMouseEnter={(e) => {
                                        e.target.style.borderColor = '#8e24aa';
                                        e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = 'linear-gradient(135deg, #f9fafb, #ffffff)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                      }}
                                    >
                                      TYT
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedQuestionExamArea('ayt');
                                        setQuestionDistributionPeriod('gunluk');
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
                                      onMouseEnter={(e) => {
                                        e.target.style.borderColor = '#8e24aa';
                                        e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = 'linear-gradient(135deg, #f9fafb, #ffffff)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                      }}
                                    >
                                      AYT
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Diğer öğrenciler için normal seçenekler (YKS grubunu hariç tut)
                            return EXAM_CATEGORY_OPTIONS.map((group) => {
                              // YKS grubunu atla (YKS öğrencileri için zaten TYT/AYT gösterdik)
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
                                        onMouseEnter={(e) => {
                                          e.target.style.borderColor = '#8e24aa';
                                          e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                          e.target.style.transform = 'translateY(-2px)';
                                          e.target.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.borderColor = '#e5e7eb';
                                          e.target.style.background = 'linear-gradient(135deg, #f9fafb, #ffffff)';
                                          e.target.style.transform = 'translateY(0)';
                                          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
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
                      // Zaman periyodu sekmeleri ve ders bazlı soru dağılımı
                      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                        {/* Zaman Periyodu Sekmeleri */}
                        <div style={{display: 'flex', gap: 12, marginBottom: 32, background: 'white', padding: 8, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                          <button
                            onClick={() => setQuestionDistributionPeriod('gunluk')}
                            style={{
                              flex: 1,
                              padding: '12px 20px',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: questionDistributionPeriod === 'gunluk' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                              color: questionDistributionPeriod === 'gunluk' ? 'white' : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (questionDistributionPeriod !== 'gunluk') {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.color = '#374151';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (questionDistributionPeriod !== 'gunluk') {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            Günlük Çözülen Soru Dağılımı
                          </button>
                          <button
                            onClick={() => setQuestionDistributionPeriod('haftalik')}
                            style={{
                              flex: 1,
                              padding: '12px 20px',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: questionDistributionPeriod === 'haftalik' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                              color: questionDistributionPeriod === 'haftalik' ? 'white' : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (questionDistributionPeriod !== 'haftalik') {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.color = '#374151';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (questionDistributionPeriod !== 'haftalik') {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            Haftalık Çözülen Soru Dağılımı
                          </button>
                          <button
                            onClick={() => setQuestionDistributionPeriod('aylik')}
                            style={{
                              flex: 1,
                              padding: '12px 20px',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: questionDistributionPeriod === 'aylik' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                              color: questionDistributionPeriod === 'aylik' ? 'white' : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (questionDistributionPeriod !== 'aylik') {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.color = '#374151';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (questionDistributionPeriod !== 'aylik') {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            Aylık Çözülen Soru Dağılımı
                          </button>
                          <button
                            onClick={() => setQuestionDistributionPeriod('tum-zamanlar')}
                            style={{
                              flex: 1,
                              padding: '12px 20px',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: questionDistributionPeriod === 'tum-zamanlar' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                              color: questionDistributionPeriod === 'tum-zamanlar' ? 'white' : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (questionDistributionPeriod !== 'tum-zamanlar') {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.color = '#374151';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (questionDistributionPeriod !== 'tum-zamanlar') {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            Tüm Zamanlar Çözülen Soru Dağılımı
                          </button>
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
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#e5e7eb';
                                  e.target.style.color = '#374151';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#f3f4f6';
                                  e.target.style.color = '#6b7280';
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

                            {/* Ders Bazlı Soru Dağılımı Chart'ları */}
                            <div style={{display: 'flex', gap: 32, minHeight: '450px', padding: '40px 20px', position: 'relative'}}>
                              {/* Chart Bars */}
                              <div style={{flex: 1, display: 'flex', alignItems: 'flex-end', gap: 24, justifyContent: 'center'}}>
                                {Object.entries(questionDistributionStats)
                                  .filter(([subject, stats]) => stats.yapildi > 0) // Sadece yapılan soruları göster
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
                                      <div style={{fontSize: '14px', color: '#9ca3af'}}>Öğrenci etütleri tamamladıkça burada görünecek</div>
                                    </div>
                                  ) : (
                                    Object.entries(questionDistributionStats)
                                      .filter(([subject, stats]) => {
                                        // Sadece yapılan soruları göster
                                        if (stats.yapildi === 0) return false;
                                        
                                        // TYT veya AYT seçildiyse dersleri filtrele
                                        if (selectedQuestionExamArea === 'tyt') {
                                          return subject.startsWith('TYT ');
                                        } else if (selectedQuestionExamArea === 'ayt') {
                                          const studentArea = selectedStudent?.alan || '';
                                          if (!studentArea || !studentArea.startsWith('yks_')) return false;
                                          
                                          // Öğrencinin alanına göre AYT derslerini al
                                          const aytDersleri = EXAM_SUBJECTS_BY_AREA[studentArea]?.filter(d => d.startsWith('AYT ')) || [];
                                          return subject.startsWith('AYT ') && aytDersleri.includes(subject);
                                        }
                                        
                                        return true;
                                      })
                                      .sort((a, b) => b[1].yapildi - a[1].yapildi) // Yapılan soru sayısına göre sırala
                                      .map(([subject, stats]) => {
                                    const maxValue = Math.max(...Object.values(questionDistributionStats).map(s => s.yapildi || 0), 1);
                                    const maxBarHeight = 300; // Maksimum bar yüksekliği (px)
                                    const actualBarHeight = maxValue > 0 ? (stats.yapildi / maxValue) * maxBarHeight : 0;
                                    
                                    return (
                                      <div key={subject} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: '120px'}}>
                                        {/* Yapılan soru sayısı - Bar'ın üstünde */}
                                        <div style={{
                                          fontSize: '18px',
                                          fontWeight: 700,
                                          color: '#1f2937',
                                          marginBottom: 12,
                                          minHeight: '24px',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}>
                                          {stats.yapildi}
                                        </div>
                                        
                                        {/* Dikey Bar Chart - Sadece Yeşil (Yapıldı) */}
                                        <div 
                                          style={{
                                            width: '100%',
                                            height: `${actualBarHeight}px`,
                                            minHeight: actualBarHeight > 0 ? '40px' : '0',
                                            background: 'linear-gradient(180deg, #10b981, #059669)',
                                            borderRadius: '8px 8px 0 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: actualBarHeight > 50 ? '14px' : '12px',
                                            fontWeight: 700,
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                          }}
                                          title={`${subject}: Yapılan ${stats.yapildi} soru`}
                                        >
                                          {actualBarHeight > 50 && stats.yapildi}
                                        </div>
                                        
                                        {/* Ders adı - Bar'ın altında */}
                                        <div style={{
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          color: '#374151',
                                          textAlign: 'center',
                                          padding: '12px 4px 0',
                                          lineHeight: '1.4',
                                          minHeight: '50px',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          justifyContent: 'center'
                                        }}>
                                          {subject}
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

                {/* Süre Dağılımı Sekmesi */}
                {activeTab === 'sure-dagilimi' && (
                  <div className="dagilim-sekmesi" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                    {timeDistributionLoading ? (
                      <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                        <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                        <div style={{fontSize: '14px', color: '#9ca3af'}}>Veriler hazırlanıyor</div>
                      </div>
                    ) : (
                      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 20}}>
                          {/* Sol Chart: Günlük Toplamlar */}
                          <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                            <h3 style={{fontSize: '22px', fontWeight: 700, marginBottom: 24, color: '#1f2937', letterSpacing: '-0.5px'}}>
                              Haftalık Günlük Toplam Etüt Süresi
                            </h3>
                            
                            {/* Hafta Seçimi Sekmeleri */}
                            <div style={{display: 'flex', gap: 8, marginBottom: 24, background: '#f3f4f6', padding: 6, borderRadius: 12}}>
                              <button
                                onClick={() => setSelectedWeeklyPeriod('prev')}
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: selectedWeeklyPeriod === 'prev' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                                  color: selectedWeeklyPeriod === 'prev' ? 'white' : '#6b7280'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedWeeklyPeriod !== 'prev') {
                                    e.target.style.background = '#e5e7eb';
                                    e.target.style.color = '#374151';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedWeeklyPeriod !== 'prev') {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = '#6b7280';
                                  }
                                }}
                              >
                                Önceki Hafta
                              </button>
                              <button
                                onClick={() => setSelectedWeeklyPeriod('current')}
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: selectedWeeklyPeriod === 'current' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                                  color: selectedWeeklyPeriod === 'current' ? 'white' : '#6b7280'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedWeeklyPeriod !== 'current') {
                                    e.target.style.background = '#e5e7eb';
                                    e.target.style.color = '#374151';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedWeeklyPeriod !== 'current') {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = '#6b7280';
                                  }
                                }}
                              >
                                Bu Hafta
                              </button>
                              <button
                                onClick={() => setSelectedWeeklyPeriod('next')}
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: selectedWeeklyPeriod === 'next' ? 'linear-gradient(135deg, #6a1b9a, #8e24aa)' : 'transparent',
                                  color: selectedWeeklyPeriod === 'next' ? 'white' : '#6b7280'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedWeeklyPeriod !== 'next') {
                                    e.target.style.background = '#e5e7eb';
                                    e.target.style.color = '#374151';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedWeeklyPeriod !== 'next') {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = '#6b7280';
                                  }
                                }}
                              >
                                Sonraki Hafta
                              </button>
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
                                    {/* Toplam saat - Bar'ın üstünde */}
                                    <div style={{
                                      fontSize: '16px',
                                      fontWeight: 700,
                                      color: '#1f2937',
                                      marginBottom: 12,
                                      minHeight: '24px',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      {hours > 0 ? `${hours.toFixed(1)}s` : '0s'}
                                    </div>
                                    
                                    {/* Dikey Bar Chart */}
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
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                        boxShadow: '0 2px 8px rgba(142, 36, 170, 0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.boxShadow = '0 4px 16px rgba(142, 36, 170, 0.4)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(142, 36, 170, 0.3)';
                                      }}
                                      title={`${day}: ${hours.toFixed(1)} saat`}
                                    >
                                      {barHeight > 50 && hours > 0 && `${hours.toFixed(1)}s`}
                                    </div>
                                    
                                    {/* Gün adı - Bar'ın altında */}
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: '#374151',
                                      textAlign: 'center',
                                      padding: '12px 4px 0',
                                      lineHeight: '1.4',
                                      minHeight: '40px',
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      justifyContent: 'center'
                                    }}>
                                      {day}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sağ Chart: Haftalık Toplamlar */}
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
                                      {/* Toplam saat - Bar'ın üstünde */}
                                      <div style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: '#1f2937',
                                        marginBottom: 12,
                                        minHeight: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                      }}>
                                        {weekData.totalHours > 0 ? `${weekData.totalHours.toFixed(1)}s` : '0s'}
                                      </div>
                                      
                                      {/* Dikey Bar Chart */}
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
                                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.transform = 'scale(1.05)';
                                          e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.transform = 'scale(1)';
                                          e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                        }}
                                        title={`${weekData.week}. Hafta: ${weekData.totalHours.toFixed(1)} saat`}
                                      >
                                        {barHeight > 50 && weekData.totalHours > 0 && `${weekData.totalHours.toFixed(1)}s`}
                                      </div>
                                      
                                      {/* Hafta numarası - Bar'ın altında */}
                                      <div style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        textAlign: 'center',
                                        padding: '12px 4px 0',
                                        lineHeight: '1.4',
                                        minHeight: '40px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'center'
                                      }}>
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

                {/* Konu Dağılımı Sekmesi */}
                {activeTab === 'konu-dagilimi' && (
                  <div className="dagilim-sekmesi" style={{padding: '16px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                    {topicStatsLoading ? (
                      <div style={{padding: '80px', textAlign: 'center', color: '#6b7280'}}>
                        <div style={{fontSize: '18px', marginBottom: 12}}>Yükleniyor...</div>
                        <div style={{fontSize: '14px', color: '#9ca3af'}}>Veriler hazırlanıyor</div>
                      </div>
                    ) : !selectedExamArea ? (
                      // Sınav seçimi - Modern tasarım
                      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                        <div style={{marginBottom: 32}}>
                          <h3 style={{fontSize: '24px', fontWeight: 700, marginBottom: 8, color: '#1f2937'}}>
                            Sınav Seçin
                          </h3>
                          <p style={{fontSize: '14px', color: '#6b7280'}}>
                            Analiz yapmak istediğiniz sınavı seçin
                          </p>
                        </div>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                          {(() => {
                            const studentArea = selectedStudent?.alan || '';
                            const isYks = studentArea.startsWith('yks_');
                            
                            // YKS öğrencileri için TYT ve AYT seçenekleri
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
                                        color: '#374151',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.borderColor = '#8e24aa';
                                        e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = 'linear-gradient(135deg, #f9fafb, #ffffff)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
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
                                        color: '#374151',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.borderColor = '#8e24aa';
                                        e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = 'linear-gradient(135deg, #f9fafb, #ffffff)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                      }}
                                    >
                                      AYT
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Diğer öğrenciler için normal seçenekler (YKS grubunu hariç tut)
                            return EXAM_CATEGORY_OPTIONS.map((group) => {
                              // YKS grubunu atla (YKS öğrencileri için zaten TYT/AYT gösterdik)
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
                                          color: '#374151',
                                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.borderColor = '#8e24aa';
                                          e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                          e.target.style.transform = 'translateY(-2px)';
                                          e.target.style.boxShadow = '0 4px 12px rgba(142, 36, 170, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.borderColor = '#e5e7eb';
                                          e.target.style.background = 'linear-gradient(135deg, #f9fafb, #ffffff)';
                                          e.target.style.transform = 'translateY(0)';
                                          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
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
                      // Ders seçimi - Modern tasarım
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
                              color: '#6b7280',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#e5e7eb';
                              e.target.style.color = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#6b7280';
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
                              // TYT dersleri
                              subjects = EXAM_SUBJECTS_BY_AREA['yks_tyt'] || [];
                            } else if (selectedExamArea === 'ayt') {
                              // Öğrencinin alanına göre AYT dersleri
                              const studentArea = selectedStudent?.alan || '';
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
                                  opacity: hasPrograms ? 1 : 0.6,
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                  if (hasPrograms) {
                                    e.target.style.borderColor = '#6a1b9a';
                                    e.target.style.background = 'linear-gradient(135deg, #f3e8ff, #faf5ff)';
                                    e.target.style.transform = 'translateY(-3px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(142, 36, 170, 0.2)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (hasPrograms) {
                                    e.target.style.borderColor = '#8e24aa';
                                    e.target.style.background = 'linear-gradient(135deg, #ffffff, #f9fafb)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                  }
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
                      // Konu listesi ve stacked bar chart
                      <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0', background: '#fafafa', minHeight: '500px'}}>
                        {/* ALAN SEÇ ve DERS SEÇ Dropdown'ları */}
                        <div style={{display: 'flex', gap: 20, marginBottom: 8, flexWrap: 'wrap', alignItems: 'flex-end'}}>
                          <div style={{flex: '1 1 250px'}}>
                            <label style={{display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: 10, color: '#374151'}}>
                              ALAN SEÇ:
                            </label>
                            <select
                              value={selectedExamArea || ''}
                              onChange={(e) => {
                                setSelectedExamArea(e.target.value || null);
                                setSelectedSubject(null);
                                setTopicStats({});
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 12,
                                fontSize: '15px',
                                fontWeight: 500,
                                color: '#374151',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#8e24aa';
                                e.target.style.boxShadow = '0 0 0 3px rgba(142, 36, 170, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                              }}
                            >
                              <option value="">Seçiniz</option>
                              {EXAM_CATEGORY_OPTIONS.map((group) =>
                                group.options.map((option) => {
                                  const studentArea = selectedStudent?.alan;
                                  if (studentArea && option.value !== studentArea) return null;
                                  return (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  );
                                })
                              )}
                            </select>
                          </div>
                          
                          <div style={{flex: '1 1 250px'}}>
                            <label style={{display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: 10, color: '#374151'}}>
                              DERS SEÇ:
                            </label>
                            <select
                              value={selectedSubject || ''}
                              onChange={(e) => setSelectedSubject(e.target.value || null)}
                              disabled={!selectedExamArea}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 12,
                                fontSize: '15px',
                                fontWeight: 500,
                                color: selectedExamArea ? '#374151' : '#9ca3af',
                                background: selectedExamArea ? 'white' : '#f3f4f6',
                                cursor: selectedExamArea ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}
                              onFocus={(e) => {
                                if (selectedExamArea) {
                                  e.target.style.borderColor = '#8e24aa';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(142, 36, 170, 0.1)';
                                }
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                              }}
                            >
                              <option value="">Seçiniz</option>
                              {(EXAM_SUBJECTS_BY_AREA[selectedExamArea] || []).map((subject) => {
                                const hasPrograms = allPrograms.some(prog => prog.ders === subject);
                                return (
                                  <option key={subject} value={subject} disabled={!hasPrograms}>
                                    {subject} {!hasPrograms && '(Program yok)'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* KONU BAZLI SORU DAĞILIMI Chart */}
                        {selectedSubject && Object.keys(topicStats).length > 0 ? (
                          <div style={{background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}>
                            <h3 style={{fontSize: '22px', fontWeight: 700, marginBottom: 32, color: '#1f2937', letterSpacing: '-0.5px'}}>
                              KONU BAZLI SORU DAĞILIMI
                            </h3>
                            
                            {/* Dikey Bar Chart Container - Öğrenci panelindeki gibi */}
                            <div style={{background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
                              {(() => {
                                const rawMaxValue = Math.max(...Object.values(topicStats).map(s => s.total), 0);
                                // maxValue'yu yukarı yuvarla (en yakın 5'in katına veya %10 ekle)
                                const maxValue = rawMaxValue > 0 ? Math.ceil(rawMaxValue * 1.1 / 5) * 5 : 5;
                                const chartHeight = 300;
                                
                                return (
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
                                      
                                      {/* Chart Bars */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        height: '100%',
                                        padding: '0 20px',
                                        gap: 24,
                                        justifyContent: 'center',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0
                                      }}>
                                        {Object.entries(topicStats)
                                          .sort((a, b) => b[1].total - a[1].total) // Toplam soru sayısına göre sırala
                                          .map(([topic, stats]) => {
                                            const barHeight = (stats.total / maxValue) * 100; // Bar yüksekliği yüzdesi
                                            const actualBarHeight = (barHeight / 100) * chartHeight;
                                            
                                            // Yapıldı ve yapılmadı yükseklikleri
                                            const yapildiHeight = stats.total > 0 ? (stats.yapildi / stats.total) * actualBarHeight : 0;
                                            const yapilmadiHeight = stats.total > 0 ? ((stats.yapilmadi + stats.eksik_yapildi) / stats.total) * actualBarHeight : 0;
                                            
                                            return (
                                              <div key={topic} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: '120px', justifyContent: 'flex-end', height: '100%'}}>
                                                {/* Toplam soru sayısı - Bar'ın üstünde */}
                                                <div style={{
                                                  fontSize: '18px',
                                                  fontWeight: 700,
                                                  color: '#1f2937',
                                                  marginBottom: 12,
                                                  minHeight: '24px',
                                                  display: 'flex',
                                                  alignItems: 'center'
                                                }}>
                                                  {stats.total}
                                                </div>
                                                
                                                {/* Dikey Stacked Bar Chart */}
                                                <div 
                                                  style={{
                                                    width: '100%',
                                                    height: `${actualBarHeight}px`,
                                                    minHeight: stats.total > 0 ? 5 : 0,
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column-reverse', // Alt'tan üste doğru
                                                    borderRadius: '4px 4px 0 0',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    alignSelf: 'flex-end'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    e.target.style.transform = 'scale(1.03)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                  }}
                                                  title={`${topic}: Toplam ${stats.total}, Yapıldı ${stats.yapildi}, Yapılmadı ${stats.yapilmadi + stats.eksik_yapildi}`}
                                                >
                                                  {/* Kırmızı segment (Yapılmadı + Eksik) - Alt kısım */}
                                                  {yapilmadiHeight > 0 && (
                                                    <div
                                                      style={{
                                                        height: `${yapilmadiHeight}px`,
                                                        minHeight: yapilmadiHeight > 3 ? '25px' : '0',
                                                        background: '#ef4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: yapilmadiHeight > 25 ? '14px' : '12px',
                                                        fontWeight: 700,
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                        borderTop: yapildiHeight > 0 ? '2px solid rgba(255,255,255,0.4)' : 'none'
                                                      }}
                                                    >
                                                      {yapilmadiHeight > 25 && (stats.yapilmadi + stats.eksik_yapildi)}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Yeşil segment (Yapıldı) - Üst kısım */}
                                                  {yapildiHeight > 0 && (
                                                    <div
                                                      style={{
                                                        height: `${yapildiHeight}px`,
                                                        minHeight: yapildiHeight > 3 ? '25px' : '0',
                                                        background: '#10b981',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: yapildiHeight > 25 ? '14px' : '12px',
                                                        fontWeight: 700,
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                        borderRadius: '4px 4px 0 0'
                                                      }}
                                                    >
                                                      {yapildiHeight > 25 && stats.yapildi}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                      
                                      {/* Konu adları - Grafik alanının dışında */}
                                      <div style={{
                                        marginLeft: 40,
                                        marginTop: 12,
                                        display: 'flex',
                                        padding: '0 20px',
                                        gap: 24,
                                        justifyContent: 'center'
                                      }}>
                                        {Object.entries(topicStats)
                                          .sort((a, b) => b[1].total - a[1].total)
                                          .map(([topic, stats]) => (
                                            <div
                                              key={topic}
                                              style={{
                                                flex: 1,
                                                maxWidth: '120px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#374151',
                                                textAlign: 'center',
                                                padding: '12px 4px 0',
                                                lineHeight: '1.4',
                                                minHeight: '50px',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'center'
                                              }}
                                            >
                                              {topic}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ) : selectedSubject ? (
                          <div style={{background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6b7280'}}>
                            <p style={{fontSize: '16px'}}>Bu ders için henüz konu verisi bulunmuyor.</p>
                          </div>
                        ) : (
                          <div style={{background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6b7280'}}>
                            <p style={{fontSize: '16px'}}>Lütfen alan ve ders seçiniz.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Eski Soru Ekleme Sekmesi - Kaldırıldı */}
                {false && activeTab === 'soru-ekle' && (
                  <div className="soru-ekleme">
                    <div className="section-header">
                      <h2>Yeni Soru Ataması</h2>
                      <button className="hizli-ekle-btn">
                        <FontAwesomeIcon icon={faStickyNote} />
                        Hızlı Atama
                      </button>
                    </div>

                    <div className="soru-ekleme-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Ders Seçin</label>
                          <select className="form-select">
                            <option>Matematik</option>
                            <option>Fizik</option>
                            <option>Kimya</option>
                            <option>Biyoloji</option>
                            <option>Türkçe</option>
                            <option>Tarih</option>
                            <option>Coğrafya</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Konu</label>
                          <input type="text" className="form-input" placeholder="Örn: Köklü Sayılar, Fonksiyonlar" />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Soru Sayısı</label>
                          <input type="number" className="form-input" placeholder="150" />
                        </div>
                        <div className="form-group">
                          <label>Yayın Evi</label>
                          <select className="form-select">
                            <option>Apotemi Yayınları</option>
                            <option>Bilfen Yayınları</option>
                            <option>Karekök Yayınları</option>
                            <option>Çözüm Yayınları</option>
                            <option>Palme Yayınları</option>
                            <option>Limit Yayınları</option>
                            <option>Diğer</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Sayfa Aralığı</label>
                          <input type="text" className="form-input" placeholder="Örn: 45-67" />
                        </div>
                        <div className="form-group">
                          <label>Zorluk Seviyesi</label>
                          <select className="form-select">
                            <option>Kolay</option>
                            <option>Orta</option>
                            <option>Zor</option>
                            <option>Karışık</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Teslim Tarihi</label>
                          <input type="date" className="form-input" />
                        </div>
                        <div className="form-group">
                          <label>Öncelik</label>
                          <select className="form-select">
                            <option>Normal</option>
                            <option>Yüksek</option>
                            <option>Düşük</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Özel Notlar</label>
                        <textarea className="form-textarea" placeholder="Öğrenci için özel notlar, çözüm ipuçları..." rows="3"></textarea>
                      </div>

                      <div className="form-actions">
                        <button className="submit-btn">Soruları Ata</button>
                        <button className="cancel-btn">İptal</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Eski Günlük Liste Sekmesi - Kaldırıldı */}
                {false && activeTab === 'gunluk-listesi' && (
                  <div className="gunluk-liste">
                    <div className="section-header">
                      <h2>Günlük Soru Listesi</h2>
                      <div className="filtreler">
                        <select className="filter-select">
                          <option>Tüm Dersler</option>
                          <option>Matematik</option>
                          <option>Fizik</option>
                          <option>Kimya</option>
                        </select>
                        <select className="filter-select">
                          <option>Tüm Durumlar</option>
                          <option>Çözüldü</option>
                          <option>Bekliyor</option>
                          <option>Yanlış</option>
                        </select>
                      </div>
                    </div>

                    <div className="soru-listesi">
                      <div className="soru-item">
                        <div className="soru-bilgi">
                          <div className="soru-header">
                            <h4>Matematik - Köklü Sayılar</h4>
                            <span className="soru-tarih">12 Ekim 2024</span>
                          </div>
                          <div className="soru-detaylar">
                            <div className="detay-satir">
                              <span className="detay-label">Soru Sayısı:</span>
                              <span className="detay-deger">150 soru</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Yayın:</span>
                              <span className="detay-deger">Apotemi Yayınları</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Sayfa:</span>
                              <span className="detay-deger">45-67</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Teslim:</span>
                              <span className="detay-deger">15 Ekim 2024</span>
                            </div>
                          </div>
                          <div className="soru-notlar">
                            <p>Köklü sayılar konusunda temel kavramları pekiştirmek için çözülmesi gereken sorular.</p>
                          </div>
                        </div>
                        <div className="soru-durum">
                          <span className="durum-badge completed">Tamamlandı</span>
                          <span className="ilerleme">150/150</span>
                        </div>
                        <div className="soru-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Detay</button>
                        </div>
                      </div>

                      <div className="soru-item">
                        <div className="soru-bilgi">
                          <div className="soru-header">
                            <h4>Fizik - Hareket</h4>
                            <span className="soru-tarih">11 Ekim 2024</span>
                          </div>
                          <div className="soru-detaylar">
                            <div className="detay-satir">
                              <span className="detay-label">Soru Sayısı:</span>
                              <span className="detay-deger">75 soru</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Yayın:</span>
                              <span className="detay-deger">Bilfen Yayınları</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Sayfa:</span>
                              <span className="detay-deger">23-45</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Teslim:</span>
                              <span className="detay-deger">14 Ekim 2024</span>
                            </div>
                          </div>
                          <div className="soru-notlar">
                            <p>Hareket konusunda problem çözme becerilerini geliştirmek için.</p>
                          </div>
                        </div>
                        <div className="soru-durum">
                          <span className="durum-badge pending">Devam Ediyor</span>
                          <span className="ilerleme">45/75</span>
                        </div>
                        <div className="soru-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Detay</button>
                        </div>
                      </div>

                      <div className="soru-item">
                        <div className="soru-bilgi">
                          <div className="soru-header">
                            <h4>Kimya - Atom Teorisi</h4>
                            <span className="soru-tarih">10 Ekim 2024</span>
                          </div>
                          <div className="soru-detaylar">
                            <div className="detay-satir">
                              <span className="detay-label">Soru Sayısı:</span>
                              <span className="detay-deger">100 soru</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Yayın:</span>
                              <span className="detay-deger">Karekök Yayınları</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Sayfa:</span>
                              <span className="detay-deger">12-28</span>
                            </div>
                            <div className="detay-satir">
                              <span className="detay-label">Teslim:</span>
                              <span className="detay-deger">13 Ekim 2024</span>
                            </div>
                          </div>
                          <div className="soru-notlar">
                            <p>Atom yapısı ve elektron dağılımı konularında temel kavramları öğrenmek için.</p>
                          </div>
                        </div>
                        <div className="soru-durum">
                          <span className="durum-badge wrong">Gecikti</span>
                          <span className="ilerleme">30/100</span>
                        </div>
                        <div className="soru-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Detay</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Eski Soru Takvimi Sekmesi - Kaldırıldı */}
                {false && activeTab === 'takvim' && (
                  <div className="soru-takvimi">
                    <div className="section-header">
                      <h2>Soru Takvimi</h2>
                      <div className="takvim-nav">
                        <button className="nav-btn">← Önceki Hafta</button>
                        <span className="hafta-bilgi">42. Hafta (14-20 Ekim)</span>
                        <button className="nav-btn">Sonraki Hafta →</button>
                      </div>
                    </div>

                    <div className="takvim-grid">
                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Pazartesi</h3>
                          <span className="gun-tarih">14 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Atanan:</span>
                            <span className="istatistik-deger">15 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Çözülen:</span>
                            <span className="istatistik-deger">12 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Başarı:</span>
                            <span className="istatistik-deger">%80</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Salı</h3>
                          <span className="gun-tarih">15 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Atanan:</span>
                            <span className="istatistik-deger">20 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Çözülen:</span>
                            <span className="istatistik-deger">18 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Başarı:</span>
                            <span className="istatistik-deger">%90</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Çarşamba</h3>
                          <span className="gun-tarih">16 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Atanan:</span>
                            <span className="istatistik-deger">10 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Çözülen:</span>
                            <span className="istatistik-deger">8 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Başarı:</span>
                            <span className="istatistik-deger">%80</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Perşembe</h3>
                          <span className="gun-tarih">17 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Atanan:</span>
                            <span className="istatistik-deger">25 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Çözülen:</span>
                            <span className="istatistik-deger">22 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Başarı:</span>
                            <span className="istatistik-deger">%88</span>
                          </div>
                        </div>
                      </div>

                      <div className="gun-kart">
                        <div className="gun-header">
                          <h3>Cuma</h3>
                          <span className="gun-tarih">18 Ekim</span>
                        </div>
                        <div className="gun-icerik">
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Atanan:</span>
                            <span className="istatistik-deger">18 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Çözülen:</span>
                            <span className="istatistik-deger">15 soru</span>
                          </div>
                          <div className="soru-istatistik">
                            <span className="istatistik-label">Başarı:</span>
                            <span className="istatistik-deger">%83</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeMenu === 'ders-basari' ? (
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
                      {selectedStudent?.alan?.startsWith('yks_') && (
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
                        <div style={{fontSize: '14px', color: '#9ca3af'}}>Öğrenciye program atandıkça burada görünecek</div>
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
                        padding: '24px 32px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
                        color: 'white'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                          {getSubjectIcon(selectedDersForDetail) && (
                            <img
                              src={getSubjectIcon(selectedDersForDetail)}
                              alt={selectedDersForDetail}
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: 'contain',
                                borderRadius: 8
                              }}
                            />
                          )}
                          <h3 style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            margin: 0
                          }}>
                            {selectedDersForDetail} - Konu Detayları
                          </h3>
                    </div>
                        <button
                          onClick={() => {
                            setShowDersDetailModal(false);
                            setSelectedDersForDetail(null);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: 8,
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                          }}
                        >
                          <FontAwesomeIcon icon={faTimes} />
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
                            color: '#6b7280'
                          }}>
                            <div style={{fontSize: '48px', marginBottom: 16, opacity: 0.5}}>📝</div>
                            <div style={{fontWeight: 600, marginBottom: 8}}>Bu ders için henüz konu verisi bulunmuyor</div>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                      </div>
            ) : activeMenu === 'kaynak-konu-ilerlemesi' ? (
              <div className="kaynak-konu-ilerlemesi-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32}}>
                    <h2 style={{fontSize: '28px', fontWeight: 700, color: '#1f2937', letterSpacing: '-0.5px', margin: 0}}>
                      Kaynak ve Konu İlerlemesi
                    </h2>
                    
                    {/* TYT/AYT sekmeleri - Sadece YKS öğrencileri için */}
                    {selectedStudent?.alan?.startsWith('yks_') && (
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
                          onMouseEnter={(e) => {
                            if (ilerlemeExamType !== 'tyt') {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#374151';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (ilerlemeExamType !== 'tyt') {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#6b7280';
                            }
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
                          onMouseEnter={(e) => {
                            if (ilerlemeExamType !== 'ayt') {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#374151';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (ilerlemeExamType !== 'ayt') {
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

                  {/* Ders Seçimi */}
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
                        {selectedStudent && (() => {
                          const studentArea = selectedStudent.alan || selectedStudent.area || 'yks_say';
                          let studentSubjects = EXAM_SUBJECTS_BY_AREA[studentArea] || [];
                          
                          // TYT veya AYT filtrelemesi
                          if (studentArea.startsWith('yks_')) {
                            if (ilerlemeExamType === 'tyt') {
                              // Sadece TYT dersleri
                              studentSubjects = studentSubjects.filter(s => s.startsWith('TYT '));
                            } else if (ilerlemeExamType === 'ayt') {
                              // Sadece AYT dersleri
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
                      {/* Geri Butonu ve Ders Adı */}
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
                          <button
                            onClick={() => setShowKaynakEkleModal(true)}
                            disabled={!selectedDersForIlerleme}
                            style={{
                              padding: '10px 14px',
                              background: selectedDersForIlerleme ? '#6a1b9a' : '#d1d5db',
                              color: 'white',
                              border: 'none',
                              borderRadius: 8,
                              cursor: selectedDersForIlerleme ? 'pointer' : 'not-allowed',
                              fontSize: '13px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: selectedDersForIlerleme ? '0 4px 12px rgba(106,27,154,0.3)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedDersForIlerleme) e.currentTarget.style.background = '#8e24aa';
                            }}
                            onMouseLeave={(e) => {
                              if (selectedDersForIlerleme) e.currentTarget.style.background = '#6a1b9a';
                            }}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Kaynak Ekle
                          </button>
                          <button
                            onClick={() => saveKonuIlerlemesi(true)}
                            disabled={!selectedDersForIlerleme}
                            style={{
                              padding: '10px 16px',
                              background: selectedDersForIlerleme ? '#10b981' : '#d1d5db',
                              color: 'white',
                              border: 'none',
                              borderRadius: 8,
                              cursor: selectedDersForIlerleme ? 'pointer' : 'not-allowed',
                              fontSize: '13px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: selectedDersForIlerleme ? '0 4px 12px rgba(16,185,129,0.35)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedDersForIlerleme) e.currentTarget.style.background = '#0ea271';
                            }}
                            onMouseLeave={(e) => {
                              if (selectedDersForIlerleme) e.currentTarget.style.background = '#10b981';
                            }}
                          >
                            Kaydet
                          </button>
                  </div>
                </div>

                      {/* Tablo */}
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
                          {/* Genel İlerleme Kartı */}
                          {(() => {
                            const totalKaynak = konuIlerlemesi.reduce((sum, k) => sum + (k.kaynaklar ? k.kaynaklar.length : 0), 0);
                            const doneKaynak = konuIlerlemesi.reduce((sum, k) => sum + (k.kaynaklar ? k.kaynaklar.filter(x => x.tamamlandi).length : 0), 0);
                            const genelYuzde = totalKaynak > 0 ? Math.round((doneKaynak / totalKaynak) * 100) : 0;
                            const color = getYuzdeColor(genelYuzde);
                            return (
                              <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                background: '#f9fafb'
                              }}>
                                <div style={{flex: 1}}>
                                  <div style={{fontSize: '14px', color: '#6b7280', fontWeight: 600}}>
                                    Ders Genel Kaynak İlerleme
                    </div>
                                  <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 8}}>
                                    <div style={{
                                      width: '100%',
                                      height: 10,
                                      background: '#e5e7eb',
                                      borderRadius: 6,
                                      overflow: 'hidden'
                                    }}>
                                      <div style={{
                                        width: `${genelYuzde}%`,
                                        height: '100%',
                                        background: color,
                                        transition: 'width 0.3s ease'
                                      }} />
                  </div>
                                    <span style={{fontWeight: 700, color}}>%{genelYuzde}</span>
                    </div>
                                  <div style={{fontSize: '12px', color: '#9ca3af', marginTop: 4}}>
                                    Tamamlanan: {doneKaynak} / {totalKaynak}
                      </div>
                    </div>
                  </div>
                            );
                          })()}

                          {/* Tablo Başlıkları */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 150px 200px 1fr 100px',
                            gap: 16,
                            padding: '16px 20px',
                            background: '#f9fafb',
                            borderBottom: '2px solid #e5e7eb',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#374151',
                            alignItems: 'center'
                          }}>
                            <div></div>
                            <div>Konu</div>
                            <div>Tarih</div>
                            <div>Durum</div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                              <span>Kaynaklar</span>
                          <button
                            onClick={() => setShowKaynakEkleModal(true)}
                            disabled={!selectedDersForIlerleme}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 8,
                              border: 'none',
                              background: selectedDersForIlerleme ? '#6a1b9a' : '#d1d5db',
                              color: 'white',
                              cursor: selectedDersForIlerleme ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="Kaynak Ekle"
                          >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                    </div>
                            <div>Yüzde</div>
                    </div>

                          {/* Tablo Satırları */}
                          {konuIlerlemesi.map((konu, index) => {
                            const yuzde = calculateYuzde(konu.kaynaklar);
                            const yuzdeColor = getYuzdeColor(yuzde);
                            return (
                              <div
                                key={konu.id || `konu-${index}`}
                                draggable
                                onDragStart={(e) => handleKonuDragStart(e, index)}
                                onDragOver={handleKonuDragOver}
                                onDrop={(e) => handleKonuDrop(e, index)}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '40px 1fr 150px 200px 1fr 100px',
                                  gap: 16,
                                  padding: '16px 20px',
                                  borderBottom: '1px solid #e5e7eb',
                                  alignItems: 'center',
                                  cursor: 'move',
                                  transition: 'background 0.2s',
                                  background: draggedKonu === index ? '#f3f4f6' : 'white'
                                }}
                                onMouseEnter={(e) => {
                                  if (draggedKonu !== index) {
                                    e.currentTarget.style.background = '#f9fafb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (draggedKonu !== index) {
                                    e.currentTarget.style.background = 'white';
                                  }
                                }}
                              >
                                {/* Sürükle İkonu */}
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                  <FontAwesomeIcon
                                    icon={faGripVertical}
                                    style={{color: '#9ca3af', fontSize: '18px'}}
                                  />
                  </div>

                                {/* Konu (sabit) */}
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
                                    onChange={(e) => handleDurumChange(index, e.target.value)}
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
                    <button 
                                            onClick={() => handleKaynakSil(index, kaynakIndex)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              cursor: 'pointer',
                                              padding: 0,
                                              color: '#ef4444',
                                              fontSize: '12px'
                                            }}
                                          >
                                            <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                                      ))}
                                    </>
                                  ) : null}
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
                                      transition: 'width 0.3s ease'
                                    }} />
                      </div>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: yuzdeColor,
                                    minWidth: 40,
                                    textAlign: 'right'
                                  }}>
                                    %{yuzde}
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

                {/* Kaynak Ekle Modal (başlık +) */}
                {showKaynakEkleModal && (
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
                    onClick={() => {
                      setShowKaynakEkleModal(false);
                      setYeniKaynakAdi('');
                    }}
                  >
                    <div
                      style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: 24,
                        width: '90%',
                        maxWidth: '430px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: 16, color: '#1f2937'}}>
                        Kaynak Ekle
                      </h3>
                      <div style={{marginBottom: 16}}>
                        <label style={{display: 'block', marginBottom: 8, fontSize: '14px', fontWeight: 600, color: '#374151'}}>
                          Kaynak Adı (tüm konulara eklenecek)
                        </label>
                        <input
                          type="text"
                          value={yeniKaynakAdi}
                          onChange={(e) => setYeniKaynakAdi(e.target.value)}
                          placeholder="Örn: 3-4-5 Yayınları Fasikül 1"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: '14px'
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleKaynakEkle();
                            }
                          }}
                        />
                          </div>
                      <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
                        <button
                          onClick={() => {
                            setShowKaynakEkleModal(false);
                            setYeniKaynakAdi('');
                          }}
                          style={{
                            padding: '10px 20px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#374151'
                          }}
                        >
                          İptal
                        </button>
                        <button
                          onClick={handleKaynakEkle}
                          disabled={!yeniKaynakAdi.trim()}
                          style={{
                            padding: '10px 20px',
                            background: yeniKaynakAdi.trim() ? '#6a1b9a' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: yeniKaynakAdi.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 600
                          }}
                        >
                          Ekle
                        </button>
                        </div>
                            </div>
                            </div>
                )}
                            </div>
            ) : activeMenu === 'brans-denemeleri' ? (
              <div className="brans-denemeleri-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                <div style={{maxWidth: '1200px', margin: '0 auto'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20}}>
                    <div>
                      <h2 style={{fontSize: 28, fontWeight: 700, margin: 0, color: '#111827'}}>Branş Denemeleri</h2>
                      <p style={{margin: '6px 0 0', color: '#6b7280'}}>
                        Branş denemesi sonucu ekle, konu bazlı başarıyı takip et.
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
                            disabled={!bransHasSubjects}
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

                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
                        <button
                          style={{padding: '12px 16px', borderRadius: 10, border: '1px dashed #d1d5db', background: '#f9fafb', color: '#6b7280', cursor: 'pointer'}}
                          onClick={() => alert('PDF yükleme entegrasyonu daha sonra eklenecek.')}
                        >
                          Yapay zeka destekli analiz için deneme sonuç karnesini PDF olarak yükleyin
                        </button>
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
            ) : activeMenu === 'genel-denemeler' ? (
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
                    const studentAreaRaw = selectedStudent?.alan || '';
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
                            <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>{calculateGenelDenemeOrtalamalari.tytOrtalama}</div>
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
                            <div style={{fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1}}>{calculateGenelDenemeOrtalamalari.aytOrtalama}</div>
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
                        const studentAreaRaw = selectedStudent?.alan || '';
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
                                    const studentArea = selectedStudent?.alan || '';
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
                                          margin: '12px 0',
                                          fontWeight: 600,
                                          color: '#111827',
                                          textAlign: 'center',
                                          writingMode: 'vertical-rl',
                                          textOrientation: 'mixed',
                                          transform: 'rotate(180deg)',
                                          height: 40,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
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
            ) : activeMenu === 'yapay-zeka' ? (
              <div className="yapay-zeka-content" style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 200px)'}}>
                <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                  {/* Başlık */}
                  <h1 style={{fontSize: 32, fontWeight: 700, margin: '0 0 32px 0', color: '#111827'}}>Yapay Zeka Asistanı</h1>

                  {/* Yapay Zeka Metrik Kartları */}
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32}}>
                    <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16}}>
                      <div style={{width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, flexShrink: 0}}>
                        <FontAwesomeIcon icon={faRobot} />
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4}}>AI Analiz Puanı</div>
                        <div style={{fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1}}>8.7</div>
                        <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>Genel performans</div>
                      </div>
                    </div>

                    <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16}}>
                      <div style={{width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, flexShrink: 0}}>
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4}}>Öğrenme Hızı</div>
                        <div style={{fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1}}>%92</div>
                        <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>Konu kavrama</div>
                      </div>
                    </div>

                    <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16}}>
                      <div style={{width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, flexShrink: 0}}>
                        <FontAwesomeIcon icon={faBullseye} />
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4}}>Hedef Uygunluğu</div>
                        <div style={{fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1}}>%85</div>
                        <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>Üniversite hedefi</div>
                      </div>
                    </div>

                    <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16}}>
                      <div style={{width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, flexShrink: 0}}>
                        <FontAwesomeIcon icon={faStickyNote} />
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4}}>AI Önerileri</div>
                        <div style={{fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1}}>12</div>
                        <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>Aktif öneri</div>
                      </div>
                    </div>
                  </div>

                  {/* Tab Sistemi */}
                  <div style={{display: 'flex', gap: 8, marginBottom: 32, borderBottom: '2px solid #e5e7eb'}}>
                    <button 
                      onClick={() => setActiveTab('ai-chat')}
                      style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'ai-chat' ? '#6a1b9a' : '#6b7280',
                        fontWeight: activeTab === 'ai-chat' ? 700 : 500,
                        fontSize: 16,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'ai-chat' ? '2px solid #6a1b9a' : '2px solid transparent',
                        marginBottom: '-2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Chatbot
                    </button>
                    <button 
                      onClick={() => setActiveTab('akilli-analiz')}
                      style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'akilli-analiz' ? '#6a1b9a' : '#6b7280',
                        fontWeight: activeTab === 'akilli-analiz' ? 700 : 500,
                        fontSize: 16,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'akilli-analiz' ? '2px solid #6a1b9a' : '2px solid transparent',
                        marginBottom: '-2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Akıllı Analiz
                    </button>
                    <button 
                      onClick={() => setActiveTab('ai-raporlar')}
                      style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'ai-raporlar' ? '#6a1b9a' : '#6b7280',
                        fontWeight: activeTab === 'ai-raporlar' ? 700 : 500,
                        fontSize: 16,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'ai-raporlar' ? '2px solid #6a1b9a' : '2px solid transparent',
                        marginBottom: '-2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      AI Raporları
                    </button>
                  </div>

                {/* Chatbot Sekmesi */}
                {activeTab === 'ai-chat' && (
                  <div className="ai-chat-section" style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24}}>
                    <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                      <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                        <div>
                          <h2 style={{fontSize: 24, fontWeight: 700, margin: 0, color: '#111827'}}>Kocapp AI</h2>
                          <p style={{fontSize: 14, color: '#6b7280', margin: '4px 0 0'}}>Yapay zekayla konuş, öğrenciye özel yanıtlar al.</p>
                        </div>
                        <div className="ai-status" style={{display: 'flex', alignItems: 'center', gap: 8}}>
                          <span className="status-indicator online" style={{width: 8, height: 8, borderRadius: '50%', background: '#10b981'}}></span>
                          <span className="status-text" style={{fontSize: 14, color: '#10b981', fontWeight: 600}}>Çevrimiçi</span>
                        </div>
                      </div>

                      <div className="chat-container" style={{display: 'flex', flexDirection: 'column', height: '600px'}}>
                        <div className="chat-messages" style={{flex: 1, overflowY: 'auto', padding: '16px 0', marginBottom: 16}}>
                          <div className="message ai-message" style={{display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start'}}>
                            <div className="message-avatar" style={{width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a1b9a', flexShrink: 0}}>
                              <FontAwesomeIcon icon={faRobot} />
                            </div>
                            <div className="message-content" style={{flex: 1, background: '#f9fafb', padding: '12px 16px', borderRadius: 12, maxWidth: '80%'}}>
                              <p style={{margin: 0, color: '#111827', fontSize: 14, lineHeight: 1.5}}>Merhaba! Öğrencinin son denemelerine göre hangi konuda destek istersin? Net artışı, konu önceliği veya günlük plan önerebilirim.</p>
                              <span className="message-time" style={{fontSize: 12, color: '#6b7280', marginTop: 8, display: 'block'}}>1 dk önce</span>
                            </div>
                          </div>

                          <div className="message user-message" style={{display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start', justifyContent: 'flex-end'}}>
                            <div className="message-content" style={{flex: 1, background: '#6a1b9a', padding: '12px 16px', borderRadius: 12, maxWidth: '80%', textAlign: 'right'}}>
                              <p style={{margin: 0, color: 'white', fontSize: 14, lineHeight: 1.5}}>Son TYT denemesindeki zayıf konular neler?</p>
                              <span className="message-time" style={{fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8, display: 'block'}}>Şimdi</span>
                            </div>
                            <div className="message-avatar" style={{width: 40, height: 40, borderRadius: '50%', background: '#6a1b9a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0}}>
                              <FontAwesomeIcon icon={faUser} />
                            </div>
                          </div>
                        </div>

                        <div className="chat-input-container" style={{borderTop: '1px solid #e5e7eb', paddingTop: 16}}>
                          <div className="chat-input-wrapper" style={{display: 'flex', gap: 12}}>
                            <input 
                              type="text" 
                              className="chat-input" 
                              placeholder="Kocapp AI'ya sorunuzu yazın..."
                              style={{flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14}}
                            />
                            <button className="send-btn" style={{padding: '12px 24px', borderRadius: 10, border: 'none', background: '#6a1b9a', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14}}>
                              Gönder
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hızlı Komutlar */}
                    <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', height: 'fit-content'}}>
                      <h3 style={{fontSize: 18, fontWeight: 700, margin: '0 0 20px', color: '#111827'}}>Hızlı Komutlar</h3>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                        {['Son denemeyi özetle', 'Öncelikli konu öner', 'Günlük çalışma planı yaz', 'Motivasyon mesajı gönder', 'Zayıf derslere kaynak öner'].map((cmd, idx) => (
                          <button
                            key={idx}
                            onClick={() => {/* Handle quick command */}}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 10,
                              border: '1px solid #e5e7eb',
                              background: 'white',
                              color: '#374151',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 14,
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#f9fafb';
                              e.target.style.borderColor = '#6a1b9a';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'white';
                              e.target.style.borderColor = '#e5e7eb';
                            }}
                          >
                            {cmd}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                  {/* Akıllı Analiz Sekmesi */}
                  {activeTab === 'akilli-analiz' && (
                    <div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                        <h2 style={{fontSize: 28, fontWeight: 700, margin: 0, color: '#111827'}}>Akıllı Analiz</h2>
                        <button style={{
                          padding: '10px 20px',
                          borderRadius: 10,
                          border: '1px solid #6a1b9a',
                          background: 'white',
                          color: '#6a1b9a',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <FontAwesomeIcon icon={faChartLine} />
                          Analizi Yenile
                        </button>
                      </div>

                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24}}>
                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <h3 style={{fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: '#111827'}}>Öğrenme Profili</h3>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>Öğrenme Stili:</span>
                              <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Görsel + Pratik</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>Konsantrasyon:</span>
                              <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Yüksek (45-60 dk)</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>Hız:</span>
                              <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Orta-Hızlı</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>Zorluk Tercihi:</span>
                              <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Orta-Zor</span>
                            </div>
                          </div>
                        </div>

                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <h3 style={{fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: '#111827'}}>Güçlü Yönler</h3>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            {[
                              { icon: '💪', text: 'Matematik problem çözme' },
                              { icon: '🧠', text: 'Mantık yürütme' },
                              { icon: '⚡', text: 'Hızlı kavrama' },
                              { icon: '🎯', text: 'Hedef odaklılık' }
                            ].map((item, idx) => (
                              <div key={idx} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#ecfdf3', borderRadius: 8}}>
                                <span style={{fontSize: 20}}>{item.icon}</span>
                                <span style={{fontSize: 14, fontWeight: 600, color: '#065f46'}}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <h3 style={{fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: '#111827'}}>Gelişim Alanları</h3>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            {[
                              { icon: '🟦', text: 'Kimya formülleri' },
                              { icon: '⏱️', text: 'Zaman yönetimi' },
                              { icon: '🔍', text: 'Detay odaklılık' },
                              { icon: '📝', text: 'Not tutma' }
                            ].map((item, idx) => (
                              <div key={idx} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fef2f2', borderRadius: 8}}>
                                <span style={{fontSize: 20}}>{item.icon}</span>
                                <span style={{fontSize: 14, fontWeight: 600, color: '#991b1b'}}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <h3 style={{fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: '#111827'}}>AI Önerileri</h3>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                            <div style={{borderLeft: '4px solid #dc2626', paddingLeft: 16}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                                <span style={{fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: 4}}>YÜKSEK</span>
                                <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Türev Konusu</span>
                              </div>
                              <p style={{fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5}}>Türev konusunda %75 başarı. Haftalık 20-25 soru ile %90'a çıkarılabilir.</p>
                            </div>
                            <div style={{borderLeft: '4px solid #f59e0b', paddingLeft: 16}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                                <span style={{fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '4px 8px', borderRadius: 4}}>ORTA</span>
                                <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Zaman Yönetimi</span>
                              </div>
                              <p style={{fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5}}>Deneme sınavlarında zaman sıkıntısı yaşıyor. Pomodoro tekniği öneriliyor.</p>
                            </div>
                            <div style={{borderLeft: '4px solid #16a34a', paddingLeft: 16}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                                <span style={{fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: 4}}>DÜŞÜK</span>
                                <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>Kimya Formülleri</span>
                              </div>
                              <p style={{fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5}}>Formül ezberleme teknikleri ve görsel hafıza yöntemleri uygulanabilir.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Raporları Sekmesi */}
                  {activeTab === 'ai-raporlar' && (
                    <div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                        <h2 style={{fontSize: 28, fontWeight: 700, margin: 0, color: '#111827'}}>AI Raporları</h2>
                        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                          <select style={{
                            padding: '10px 16px',
                            borderRadius: 10,
                            border: '1px solid #d1d5db',
                            background: 'white',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#374151',
                            cursor: 'pointer'
                          }}>
                            <option>Son 1 Ay</option>
                            <option>Son 3 Ay</option>
                            <option>Bu Dönem</option>
                            <option>Tüm Zamanlar</option>
                          </select>
                          <button style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#6a1b9a',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <FontAwesomeIcon icon={faDownload} />
                            Rapor İndir
                          </button>
                        </div>
                      </div>

                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24}}>
                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                            <h3 style={{fontSize: 20, fontWeight: 700, margin: 0, color: '#111827'}}>Performans Tahmini</h3>
                            <span style={{fontSize: 12, color: '#6b7280'}}>18 Ekim 2024</span>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>TYT Tahmini:</span>
                              <span style={{fontSize: 16, fontWeight: 700, color: '#111827'}}>450-470</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>AYT Tahmini:</span>
                              <span style={{fontSize: 16, fontWeight: 700, color: '#111827'}}>380-400</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>YKS Tahmini:</span>
                              <span style={{fontSize: 16, fontWeight: 700, color: '#111827'}}>420-440</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: 14, color: '#6b7280'}}>Güvenilirlik:</span>
                              <span style={{fontSize: 16, fontWeight: 700, color: '#111827'}}>%87</span>
                            </div>
                          </div>
                        </div>

                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                            <h3 style={{fontSize: 20, fontWeight: 700, margin: 0, color: '#111827'}}>Hedef Analizi</h3>
                            <span style={{fontSize: 12, color: '#6b7280'}}>18 Ekim 2024</span>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                            {[
                              { uni: 'İTÜ Bilgisayar Mühendisliği', progress: 78 },
                              { uni: 'ODTÜ Elektrik Mühendisliği', progress: 85 },
                              { uni: 'Boğaziçi Matematik', progress: 65 }
                            ].map((item, idx) => (
                              <div key={idx}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                  <span style={{fontSize: 14, fontWeight: 600, color: '#111827'}}>{item.uni}</span>
                                  <span style={{fontSize: 14, fontWeight: 700, color: '#6a1b9a'}}>%{item.progress}</span>
                                </div>
                                <div style={{width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden'}}>
                                  <div style={{width: `${item.progress}%`, height: '100%', background: '#6a1b9a', borderRadius: 4}}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                            <h3 style={{fontSize: 20, fontWeight: 700, margin: 0, color: '#111827'}}>Risk Analizi</h3>
                            <span style={{fontSize: 12, color: '#6b7280'}}>18 Ekim 2024</span>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            {[
                              { label: 'Kimya Konuları:', risk: 'Orta Risk', color: '#f59e0b', bg: '#fef3c7' },
                              { label: 'Zaman Yönetimi:', risk: 'Yüksek Risk', color: '#dc2626', bg: '#fee2e2' },
                              { label: 'Motivasyon:', risk: 'Düşük Risk', color: '#16a34a', bg: '#dcfce7' },
                              { label: 'Genel Durum:', risk: 'Orta Risk', color: '#f59e0b', bg: '#fef3c7' }
                            ].map((item, idx) => (
                              <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{fontSize: 14, color: '#6b7280'}}>{item.label}</span>
                                <span style={{fontSize: 12, fontWeight: 700, color: item.color, background: item.bg, padding: '4px 12px', borderRadius: 12}}>{item.risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                            <h3 style={{fontSize: 20, fontWeight: 700, margin: 0, color: '#111827'}}>Önerilen Çalışma Planı</h3>
                            <span style={{fontSize: 12, color: '#6b7280'}}>18 Ekim 2024</span>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            {[
                              { gun: 'Pazartesi', konu: 'Matematik - Türev (2 saat)' },
                              { gun: 'Salı', konu: 'Fizik - Hareket (1.5 saat)' },
                              { gun: 'Çarşamba', konu: 'Kimya - Atom (1 saat)' },
                              { gun: 'Perşembe', konu: 'TYT Denemesi (3 saat)' },
                              { gun: 'Cuma', konu: 'AYT Denemesi (3 saat)' }
                            ].map((item, idx) => (
                              <div key={idx} style={{display: 'flex', gap: 16, alignItems: 'center'}}>
                                <span style={{fontSize: 14, fontWeight: 700, color: '#6a1b9a', minWidth: 100}}>{item.gun}</span>
                                <span style={{fontSize: 14, color: '#111827'}}>{item.konu}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeMenu === 'kaynak-onerileri' ? (
              <div className="kaynak-onerileri-content">
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Kaynak Önerileri - {selectedStudent.name}</h1>
                    <p className="welcome-subtitle">AI destekli kişiselleştirilmiş kaynak önerileri</p>
                  </div>
                  <div className="current-date">
                    {new Date().toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Kaynak Önerileri Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <div className="card-content">
                      <h3>Önerilen Kaynaklar</h3>
                      <div className="card-number">24</div>
                      <div className="card-subtitle">Kişiselleştirilmiş</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Uygunluk Skoru</h3>
                      <div className="card-number">%92</div>
                      <div className="card-subtitle">Öğrenci seviyesi</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '92%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faStickyNote} />
                    </div>
                    <div className="card-content">
                      <h3>Yeni Öneriler</h3>
                      <div className="card-number">8</div>
                      <div className="card-subtitle">Bu hafta</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Uygunluğu</h3>
                      <div className="card-number">%88</div>
                      <div className="card-subtitle">Üniversite hedefi</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '88%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'ai-oneriler' ? 'active' : ''}`}
                      onClick={() => setActiveTab('ai-oneriler')}
                    >
                      AI Önerileri
                    </button>
                    <button 
                      className={`tab ${activeTab === 'kategori-kaynaklar' ? 'active' : ''}`}
                      onClick={() => setActiveTab('kategori-kaynaklar')}
                    >
                      Kategori Kaynakları
                    </button>
                    <button 
                      className={`tab ${activeTab === 'kisisel-oneriler' ? 'active' : ''}`}
                      onClick={() => setActiveTab('kisisel-oneriler')}
                    >
                      Kişisel Öneriler
                    </button>
                  </div>
                </div>

                {/* AI Önerileri Sekmesi */}
                {activeTab === 'ai-oneriler' && (
                  <div className="ai-oneriler">
                    <div className="section-header">
                      <h2>AI Destekli Kaynak Önerileri</h2>
                      <button className="yenile-oneriler-btn">
                        <FontAwesomeIcon icon={faChartLine} />
                        Önerileri Yenile
                      </button>
                    </div>

                    <div className="ai-oneriler-grid">
                      <div className="ai-oneri-kart">
                        <div className="oneri-header">
                          <div className="oneri-bilgi">
                            <h3>Matematik - Türev Konusu</h3>
                            <p>Seviye: Orta-Zor | Öncelik: Yüksek</p>
                          </div>
                          <div className="oneri-puan">%95</div>
                        </div>
                        <div className="oneri-icerik">
                          <div className="oneri-kaynaklar">
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Apotemi Türev Soru Bankası</span>
                              <span className="kaynak-seviye">Orta-Zor</span>
                            </div>
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Karekök Türev Konu Anlatımı</span>
                              <span className="kaynak-seviye">Orta</span>
                            </div>
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Bilfen Türev Testleri</span>
                              <span className="kaynak-seviye">Zor</span>
                            </div>
                          </div>
                          <div className="oneri-aciklama">
                            <p><strong>AI Analizi:</strong> Türev konusunda %75 başarı gösteriyor. Orta seviyeden başlayıp zor seviyeye geçiş öneriliyor. Haftalık 20-25 soru ile %90'a çıkarılabilir.</p>
                          </div>
                        </div>
                        <div className="oneri-actions">
                          <button className="action-btn onayla">Öneriyi Onayla</button>
                          <button className="action-btn reddet">Reddet</button>
                        </div>
                      </div>

                      <div className="ai-oneri-kart">
                        <div className="oneri-header">
                          <div className="oneri-bilgi">
                            <h3>Fizik - Hareket Konusu</h3>
                            <p>Seviye: Orta | Öncelik: Orta</p>
                          </div>
                          <div className="oneri-puan">%87</div>
                        </div>
                        <div className="oneri-icerik">
                          <div className="oneri-kaynaklar">
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Palme Fizik Soru Bankası</span>
                              <span className="kaynak-seviye">Orta</span>
                            </div>
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Çözüm Fizik Konu Anlatımı</span>
                              <span className="kaynak-seviye">Orta</span>
                            </div>
                          </div>
                          <div className="oneri-aciklama">
                            <p><strong>AI Analizi:</strong> Hareket konusunda %87 başarı var. Pekiştirme amaçlı orta seviye kaynaklar öneriliyor.</p>
                          </div>
                        </div>
                        <div className="oneri-actions">
                          <button className="action-btn onayla">Öneriyi Onayla</button>
                          <button className="action-btn reddet">Reddet</button>
                        </div>
                      </div>

                      <div className="ai-oneri-kart">
                        <div className="oneri-header">
                          <div className="oneri-bilgi">
                            <h3>Kimya - Atom Teorisi</h3>
                            <p>Seviye: Kolay-Orta | Öncelik: Yüksek</p>
                          </div>
                          <div className="oneri-puan">%78</div>
                        </div>
                        <div className="oneri-icerik">
                          <div className="oneri-kaynaklar">
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Limit Kimya Konu Anlatımı</span>
                              <span className="kaynak-seviye">Kolay</span>
                            </div>
                            <div className="kaynak-item">
                              <span className="kaynak-adi">Apotemi Kimya Soru Bankası</span>
                              <span className="kaynak-seviye">Orta</span>
                            </div>
                          </div>
                          <div className="oneri-aciklama">
                            <p><strong>AI Analizi:</strong> Atom teorisi konusunda temel eksiklikler var. Kolay seviyeden başlayıp orta seviyeye geçiş öneriliyor.</p>
                          </div>
                        </div>
                        <div className="oneri-actions">
                          <button className="action-btn onayla">Öneriyi Onayla</button>
                          <button className="action-btn reddet">Reddet</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kategori Kaynakları Sekmesi */}
                {activeTab === 'kategori-kaynaklar' && (
                  <div className="kategori-kaynaklar">
                    <div className="section-header">
                      <h2>Kategori Bazlı Kaynaklar</h2>
                      <div className="kategori-filtreler">
                        <select className="filter-select">
                          <option>Tüm Kategoriler</option>
                          <option>Matematik</option>
                          <option>Fizik</option>
                          <option>Kimya</option>
                          <option>Biyoloji</option>
                        </select>
                        <select className="filter-select">
                          <option>Tüm Seviyeler</option>
                          <option>Kolay</option>
                          <option>Orta</option>
                          <option>Zor</option>
                        </select>
                      </div>
                    </div>

                    <div className="kategori-grid">
                      <div className="kategori-kart">
                        <div className="kategori-header">
                          <h3>Matematik Kaynakları</h3>
                          <span className="kategori-sayi">12 kaynak</span>
                        </div>
                        <div className="kaynak-listesi">
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Apotemi Matematik Soru Bankası</h4>
                              <p>Yayın: Apotemi | Seviye: Orta-Zor | Sayfa: 450</p>
                            </div>
                            <div className="kaynak-puan">%94</div>
                          </div>
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Karekök Matematik Konu Anlatımı</h4>
                              <p>Yayın: Karekök | Seviye: Orta | Sayfa: 320</p>
                            </div>
                            <div className="kaynak-puan">%89</div>
                          </div>
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Bilfen Matematik Testleri</h4>
                              <p>Yayın: Bilfen | Seviye: Zor | Sayfa: 280</p>
                            </div>
                            <div className="kaynak-puan">%92</div>
                          </div>
                        </div>
                        <div className="kategori-actions">
                          <button className="action-btn view">Tümünü Gör</button>
                          <button className="action-btn oner">Öner</button>
                        </div>
                      </div>

                      <div className="kategori-kart">
                        <div className="kategori-header">
                          <h3>Fizik Kaynakları</h3>
                          <span className="kategori-sayi">8 kaynak</span>
                        </div>
                        <div className="kaynak-listesi">
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Palme Fizik Soru Bankası</h4>
                              <p>Yayın: Palme | Seviye: Orta | Sayfa: 380</p>
                            </div>
                            <div className="kaynak-puan">%87</div>
                          </div>
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Çözüm Fizik Konu Anlatımı</h4>
                              <p>Yayın: Çözüm | Seviye: Orta | Sayfa: 290</p>
                            </div>
                            <div className="kaynak-puan">%85</div>
                          </div>
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Limit Fizik Testleri</h4>
                              <p>Yayın: Limit | Seviye: Zor | Sayfa: 220</p>
                            </div>
                            <div className="kaynak-puan">%91</div>
                          </div>
                        </div>
                        <div className="kategori-actions">
                          <button className="action-btn view">Tümünü Gör</button>
                          <button className="action-btn oner">Öner</button>
                        </div>
                      </div>

                      <div className="kategori-kart">
                        <div className="kategori-header">
                          <h3>Kimya Kaynakları</h3>
                          <span className="kategori-sayi">6 kaynak</span>
                        </div>
                        <div className="kaynak-listesi">
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Limit Kimya Konu Anlatımı</h4>
                              <p>Yayın: Limit | Seviye: Kolay | Sayfa: 250</p>
                            </div>
                            <div className="kaynak-puan">%82</div>
                          </div>
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Apotemi Kimya Soru Bankası</h4>
                              <p>Yayın: Apotemi | Seviye: Orta | Sayfa: 320</p>
                            </div>
                            <div className="kaynak-puan">%88</div>
                          </div>
                          <div className="kaynak-item-detay">
                            <div className="kaynak-bilgi">
                              <h4>Karekök Kimya Testleri</h4>
                              <p>Yayın: Karekök | Seviye: Zor | Sayfa: 180</p>
                            </div>
                            <div className="kaynak-puan">%90</div>
                          </div>
                        </div>
                        <div className="kategori-actions">
                          <button className="action-btn view">Tümünü Gör</button>
                          <button className="action-btn oner">Öner</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kişisel Öneriler Sekmesi */}
                {activeTab === 'kisisel-oneriler' && (
                  <div className="kisisel-oneriler">
                    <div className="section-header">
                      <h2>Kişiselleştirilmiş Öneriler</h2>
                      <button className="kisisel-analiz-btn">
                        <FontAwesomeIcon icon={faRobot} />
                        Kişisel Analiz Yap
                      </button>
                    </div>

                    <div className="kisisel-grid">
                      <div className="kisisel-kart">
                        <h3>Öğrenme Stiline Göre Öneriler</h3>
                        <div className="stil-onerileri">
                          <div className="stil-item">
                            <span className="stil-tipi">Görsel Öğrenme</span>
                            <div className="stil-kaynaklar">
                              <span className="kaynak-oneri">Grafik ve şema içeren kaynaklar</span>
                              <span className="kaynak-oneri">Video destekli konu anlatımları</span>
                              <span className="kaynak-oneri">Renkli diyagramlar</span>
                            </div>
                          </div>
                          <div className="stil-item">
                            <span className="stil-tipi">Pratik Öğrenme</span>
                            <div className="stil-kaynaklar">
                              <span className="kaynak-oneri">Çok sorulu kaynaklar</span>
                              <span className="kaynak-oneri">Uygulama odaklı kitaplar</span>
                              <span className="kaynak-oneri">Test ve deneme sınavları</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="kisisel-kart">
                        <h3>Hedef Üniversiteye Göre Öneriler</h3>
                        <div className="hedef-onerileri">
                          <div className="hedef-item">
                            <span className="hedef-uni">İTÜ Bilgisayar Mühendisliği</span>
                            <div className="hedef-kaynaklar">
                              <span className="kaynak-oneri">Matematik: Apotemi + Karekök</span>
                              <span className="kaynak-oneri">Fizik: Palme + Çözüm</span>
                              <span className="kaynak-oneri">TYT: ÖSYM format denemeler</span>
                            </div>
                          </div>
                          <div className="hedef-item">
                            <span className="hedef-uni">ODTÜ Elektrik Mühendisliği</span>
                            <div className="hedef-kaynaklar">
                              <span className="kaynak-oneri">Matematik: Bilfen + Limit</span>
                              <span className="kaynak-oneri">Fizik: Apotemi + Palme</span>
                              <span className="kaynak-oneri">AYT: ÖSYM format denemeler</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="kisisel-kart">
                        <h3>Zayıf Konulara Göre Öneriler</h3>
                        <div className="zayif-onerileri">
                          <div className="zayif-item">
                            <span className="zayif-konu">Türev Konusu</span>
                            <div className="zayif-kaynaklar">
                              <span className="kaynak-oneri">Karekök Türev Konu Anlatımı</span>
                              <span className="kaynak-oneri">Apotemi Türev Soru Bankası</span>
                              <span className="kaynak-oneri">Bilfen Türev Testleri</span>
                            </div>
                          </div>
                          <div className="zayif-item">
                            <span className="zayif-konu">Kimya Formülleri</span>
                            <div className="zayif-kaynaklar">
                              <span className="kaynak-oneri">Limit Kimya Konu Anlatımı</span>
                              <span className="kaynak-oneri">Çözüm Kimya Formül Kitabı</span>
                              <span className="kaynak-oneri">Apotemi Kimya Soru Bankası</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="kisisel-kart">
                        <h3>Çalışma Planına Göre Öneriler</h3>
                        <div className="plan-onerileri">
                          <div className="plan-item">
                            <span className="plan-donem">1. Dönem (Ekim-Aralık)</span>
                            <div className="plan-kaynaklar">
                              <span className="kaynak-oneri">Temel konular: Karekök + Limit</span>
                              <span className="kaynak-oneri">Orta seviye: Apotemi + Palme</span>
                              <span className="kaynak-oneri">Test: Haftalık deneme sınavları</span>
                            </div>
                          </div>
                          <div className="plan-item">
                            <span className="plan-donem">2. Dönem (Ocak-Mart)</span>
                            <div className="plan-kaynaklar">
                              <span className="kaynak-oneri">İleri konular: Bilfen + Çözüm</span>
                              <span className="kaynak-oneri">Zor seviye: Apotemi + Karekök</span>
                              <span className="kaynak-oneri">Test: Günlük mini testler</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="student-detail-content">
                <h1 className="page-title">{selectedStudent.name} - Öğrenci Detayları</h1>
                
                {/* Öğrenci Genel Bilgileri */}
                <div className="student-overview">
                  <div className="overview-card">
                    <div className="student-avatar-large">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div className="student-basic-info">
                      <h2>{selectedStudent.name}</h2>
                      <p className="student-class">{selectedStudent.class}</p>
                      <div className="status-badge">
                        <div className={`status-dot ${selectedStudent.online ? 'online' : 'offline'}`}></div>
                        <span>{selectedStudent.online ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                      </div>
                    </div>
                    <div className="student-stats">
                      <div className="stat-item">
                        <span className="stat-label">Tamamlanan Etüt</span>
                        <span className="stat-value">{selectedStudent.completed}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Geçen Etüt</span>
                        <span className="stat-value">{selectedStudent.overdue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detaylı İstatistikler */}
                <div className="detailed-stats">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faBook} />
                      </div>
                      <div className="stat-content">
                        <h3>Toplam Etüt</h3>
                        <div className="stat-number">24</div>
                        <div className="stat-subtitle">Bu ay</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <div className="stat-content">
                        <h3>Başarı Oranı</h3>
                        <div className="stat-number">%{selectedStudent.completed}</div>
                        <div className="stat-subtitle">Genel performans</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faClock} />
                      </div>
                      <div className="stat-content">
                        <h3>Geçen Etüt</h3>
                        <div className="stat-number">{selectedStudent.overdue}</div>
                        <div className="stat-subtitle">Dikkat gerekli</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faBullseye} />
                      </div>
                      <div className="stat-content">
                        <h3>Hedef İlerleme</h3>
                        <div className="stat-number">%72</div>
                        <div className="stat-subtitle">Müfredat takibi</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Son Aktiviteler */}
                <div className="recent-activities">
                  <h2 className="section-title">Son Aktiviteler</h2>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon">
                        <FontAwesomeIcon icon={faBook} />
                      </div>
                      <div className="activity-content">
                        <h4>Matematik Etütü Tamamlandı</h4>
                        <p>Fonksiyonlar konusu başarıyla tamamlandı</p>
                        <span className="activity-time">2 saat önce</span>
                      </div>
                    </div>

                    <div className="activity-item">
                      <div className="activity-icon">
                        <FontAwesomeIcon icon={faStickyNote} />
                      </div>
                      <div className="activity-content">
                        <h4>Ödev Teslim Edildi</h4>
                        <p>Fizik ödevi zamanında teslim edildi</p>
                        <span className="activity-time">1 gün önce</span>
                      </div>
                    </div>

                    <div className="activity-item">
                      <div className="activity-icon">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <div className="activity-content">
                        <h4>Quiz Tamamlandı</h4>
                        <p>Kimya quiz'i %85 başarı ile tamamlandı</p>
                        <span className="activity-time">2 gün önce</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Öğretmen Aksiyonları */}
                <div className="teacher-actions">
                  <h2 className="section-title">Öğretmen Aksiyonları</h2>
                  <div className="action-buttons">
                    <button className="action-button primary">
                      <FontAwesomeIcon icon={faPhone} />
                      Arama Yap
                    </button>
                    <button className="action-button secondary">
                      <FontAwesomeIcon icon={faComments} />
                      Mesaj Gönder
                    </button>
                    <button className="action-button secondary">
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Bildirim Gönder
                    </button>
                    <button className="action-button secondary">
                      <FontAwesomeIcon icon={faStickyNote} />
                      Not Ekle
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
          <div className="user-role">Öğretmen</div>
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
        {/* Üst Header */}
        <div className="top-header">
          <div className="search-section">
            <input type="text" placeholder="Ara" className="search-input" />
          </div>
          <div className="header-icons">
            <div className="header-icon">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <div className="header-icon">
              <FontAwesomeIcon icon={faBellIcon} />
            </div>
            <div className="header-icon">
              <FontAwesomeIcon icon={faCommentsIcon} />
            </div>
            <div className="header-icon" onClick={() => setActiveMenu('profil')}>
              <FontAwesomeIcon icon={faUser} />
            </div>
          </div>
        </div>

        {/* İçerik Alanı */}
        <div className="content-area">
          {/* ANA SAYFA KODLARI - YORUM SATIRINDA (İLERİDE GEREKEBİLİR)
          {activeMenu === 'anasayfa' ? (
            <div className="dashboard-content">
              <div className="welcome-section">
                <div className="welcome-text">
                  <h1 className="welcome-title">Hoşgeldin, Öğretmen!</h1>
                  <p className="welcome-subtitle">Öğretmen portalınızda her zaman güncel kalın</p>
                </div>
                <div className="current-date">
                  {new Date().toLocaleDateString('tr-TR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faBook} />
                  </div>
                  <div className="card-content">
                    <h3>Bu Hafta Anlattığım Ders</h3>
                    <div className="card-number">12</div>
                    <div className="card-subtitle">3 sınıfta tamamlandı</div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div className="card-content">
                    <h3>Sınıf Ortalaması</h3>
                    <div className="card-number">%78</div>
                    <div className="card-subtitle">+2.1% geçen haftaya göre</div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <div className="card-content">
                    <h3>Yaptırılan Etüt</h3>
                    <div className="card-number">28</div>
                    <div className="card-subtitle">Bu ay</div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">
                    <FontAwesomeIcon icon={faBullseye} />
                  </div>
                  <div className="card-content">
                    <h3>Hedeflenen Müfredat</h3>
                    <div className="card-number">%64</div>
                    <div className="card-subtitle">Hedef %85</div>
                  </div>
                </div>
              </div>

              <div className="tabs-section">
                <div className="tabs">
                  <button 
                    className={`tab ${activeTab === 'genel' ? 'active' : ''}`}
                    onClick={() => setActiveTab('genel')}
                  >
                    Genel Bakış
                  </button>
                  <button 
                    className={`tab ${activeTab === 'haftalik' ? 'active' : ''}`}
                    onClick={() => setActiveTab('haftalik')}
                  >
                    Haftalık Program
                  </button>
                  <button 
                    className={`tab ${activeTab === 'ilerleme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ilerleme')}
                  >
                    İlerleme Analizi
                  </button>
                </div>
              </div>

              <div className="deneme-takibi">
                <div className="deneme-card">
                  <h3>Deneme Analizi</h3>
                  <div className="deneme-content">
                    <div className="deneme-info">
                      <h4>11. Sınıf TYT Matematik Denemesi #5</h4>
                      <p className="deneme-date">Sınıf kırılımı hazır</p>
                    </div>
                    <button className="deneme-btn">Analizi Aç</button>
                  </div>
                </div>
              </div>

              <div className="bottom-widgets">
                <div className="widget purple-widget">
                  <h3>Ödev Kontrolleri</h3>
                  <p>Bekleyen 8 ödev değerlendirmesi</p>
                  <button className="widget-btn">Listeyi Aç</button>
                </div>

                <div className="widget purple-widget">
                  <h3>Quiz / Sınav Planı</h3>
                  <p>Bu hafta 2 sınav planlandı</p>
                  <button className="widget-btn">Planı Gör</button>
                </div>

                <div className="widget white-widget">
                  <div className="widget-header">
                    <h3>Güncel Bildirimler</h3>
                    <a href="#" className="see-all-link">Tümünü Gör</a>
                  </div>
                  <div className="notes-list">
                    <div className="note-item">
                      <p>10A - Proje teslim hatırlatması</p>
                      <a href="#" className="see-more-link">Detay</a>
                    </div>
                    <div className="note-item">
                      <p>12B - Fizik sınavı duyurusu</p>
                      <a href="#" className="see-more-link">Detay</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeMenu === 'bildirimler' ? (
          */}

          {activeMenu === 'profil' ? (
            <OgretmenProfilTab />
          ) : activeMenu === 'bildirimler' ? (
            <Bildirimler students={students} />
          ) : activeMenu === 'muhasebe' ? (
            <div className="muhasebe-content">
              {/* Üst özet kutuları */}
              <div className="summary-pills">
                <div className="summary-pill">
                  <div className="pill-title">{now.toLocaleString('tr-TR', { month: 'long' })} ayı toplam gelir</div>
                  <div className="pill-amount">₺ {monthIncome.toLocaleString('tr-TR')}</div>
                </div>
                <div className="summary-pill">
                  <div className="pill-title">{now.getFullYear()} Toplam gelir</div>
                  <div className="pill-amount">₺ {yearIncome.toLocaleString('tr-TR')}</div>
                </div>
                <div className="summary-pill">
                  <div className="pill-title">Ödenmeyen toplam gelir</div>
                  <div className="pill-amount">₺ {unpaidTotal.toLocaleString('tr-TR')}</div>
                </div>
              </div>

              {/* Başlık ve toplam */}
              <div className="accounting-header">
                <div className="header-right">
                  <div className="header-actions">
                    <button className="export-btn">Excel Dışa Aktar</button>
                    <button className="export-btn">PDF İndir</button>
                  </div>
                </div>
              </div>

              {/* Filtreler */}
              <div className="accounting-filters">
                <div className="filter-group">
                  <label>Arama</label>
                  <input
                    className="filter-input"
                    placeholder="Öğrenci ara..."
                    value={accountingFilters.search}
                    onChange={(e) =>
                      setAccountingFilters({ ...accountingFilters, search: e.target.value })
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>Ay</label>
                  <select
                    className="filter-select"
                    value={accountingFilters.month}
                    onChange={(e) =>
                      setAccountingFilters({ ...accountingFilters, month: e.target.value })
                    }
                  >
                    <option value="">Tümü</option>
                    <option value="1">Ocak</option>
                    <option value="2">Şubat</option>
                    <option value="3">Mart</option>
                    <option value="4">Nisan</option>
                    <option value="5">Mayıs</option>
                    <option value="6">Haziran</option>
                    <option value="7">Temmuz</option>
                    <option value="8">Ağustos</option>
                    <option value="9">Eylül</option>
                    <option value="10">Ekim</option>
                    <option value="11">Kasım</option>
                    <option value="12">Aralık</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Yıl</label>
                  <select
                    className="filter-select"
                    value={accountingFilters.year}
                    onChange={(e) =>
                      setAccountingFilters({ ...accountingFilters, year: e.target.value })
                    }
                  >
                    <option value="">Tümü</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Durum</label>
                  <select
                    className="filter-select"
                    value={accountingFilters.status}
                    onChange={(e) =>
                      setAccountingFilters({ ...accountingFilters, status: e.target.value })
                    }
                  >
                    <option value="">Tümü</option>
                    <option value="odemesi-gecen">Ödemesi Geçen</option>
                    <option value="odeme-tamam">Ödemesi Tamam</option>
                  </select>
                </div>
                <button className="filter-btn">
                  <FontAwesomeIcon icon={faFilter} />
                  Filtrele
                </button>
              </div>

              {/* Kare kartlar */}
              <div className="overdue-grid">
                {filteredAccounting.map((item) => (
                  <div key={item.id} className="overdue-tile">
                    <div className="tile-head">
                      <div className="tile-title">Öğrenci Profili</div>
                      <div className="tile-status">Çevrimiçi</div>
                    </div>
                    <div className="tile-body">
                      <div className="tile-avatar">{item.gender === 'f' ? '👩' : '👨'}</div>
                      <div className="tile-name">{item.name}</div>
                      <div className="tile-sub">GEÇEN ÖDEME: <span className="overdue-count">{item.overdueCount}</span></div>
                    </div>
                    <div className="tile-footer">
                      <button onClick={() => openAccountModal(item)} className="tile-detail">Detay</button>
                    </div>
                  </div>
                ))}
                {studentsLoading ? (
                  <div className="empty-state">Yükleniyor...</div>
                ) : filteredAccounting.length === 0 && students.length === 0 ? (
                  <div className="empty-state">Henüz öğrenci eklenmemiş.</div>
                ) : filteredAccounting.length === 0 ? (
                  <div className="empty-state">Arama kriterlerinize uygun kayıt bulunamadı.</div>
                ) : null}
              </div>

              {/* Alt aksiyonlar */}
              <div className="muhasebe-actions">
                <button className="action-button primary">
                  <FontAwesomeIcon icon={faDownload} /> Excel Dışa Aktar
                </button>
                <button className="action-button secondary">
                  <FontAwesomeIcon icon={faDownload} /> PDF İndir
                </button>
              </div>

              {isAccountModalOpen && selectedAccount && (
                <div className="modal-overlay" onClick={closeAccountModal}>
                  <div className="modal-content student-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-topbar">
                      <button className="back-btn" onClick={closeAccountModal}>Geri</button>
                      <div className="top-actions">
                        <button className="pill-btn">PDF</button>
                      </div>
                    </div>

                    <div className="student-header">
                      <div className="avatar-lg">{selectedAccount.gender === 'f' ? '👩' : '👨'}</div>
                      <div className="student-head-info">
                        <div className="student-name-lg">{selectedAccount.name}</div>
                        <div className="student-meta">Sınıf: {selectedAccount.className} · Kayıt Tarih: {new Date(selectedAccount.registeredAt).toLocaleDateString('tr-TR')}</div>
                      </div>
                      <div className="header-buttons">
                        <button className="pill-btn">Düzenle</button>
                        <button className="pill-btn">Mesaj Gönder</button>
                      </div>
                    </div>

                    {/* Modal Sekmeleri */}
                    <div className="student-modal-tabs">
                      <button 
                        className={`modal-tab ${accountModalTab === 'muhasebe' ? 'active' : ''}`}
                        onClick={() => setAccountModalTab('muhasebe')}
                      >
                        Muhasebe
                      </button>
                      <button 
                        className={`modal-tab ${accountModalTab === 'program' ? 'active' : ''}`}
                        onClick={() => setAccountModalTab('program')}
                      >
                        Haftalık Program
                      </button>
                    </div>

                    {/* Muhasebe Sekmesi */}
                    {accountModalTab === 'muhasebe' && (
                      <>
                    <div className="student-modal-grid">
                      <div className="card white">
                        <div className="card-title">Ödeme Bilgileri</div>
                        <div className="status-chip success">Ödemeler Tamamlandı</div>
                        <div className="payment-row"><span>Son Ödeme:</span><strong>{new Date(selectedAccount.lastPayment).toLocaleDateString('tr-TR')}</strong></div>
                        <div className="payment-row"><span>Geçen Ödeme Sayısı:</span><strong>{selectedAccount.overdueCount}</strong></div>
                        <div className="split-actions">
                          <button className="primary-sm">+ Ödeme Ekle</button>
                          <button className="ghost-sm">Makbuz</button>
                        </div>
                      </div>

                      <div className="card white">
                        <div className="card-title">Öğretmen Notları</div>
                        <div className="note-row">
                          <input className="note-input" placeholder="Yeni not ekle..." />
                          <button className="primary-sm">Kaydet</button>
                        </div>
                        <div className="note-item">10/03/2024: Derste çok basarılıydı.</div>
                        <div className="note-item">05/002: Veli ile görüşüldü</div>
                      </div>
                    </div>

                    <div className="card white full">
                      <div className="card-title">Ödeme Geçmişi</div>
                      <ul className="history-list">
                        {selectedAccount.history.map((h, idx) => (
                          <li key={idx} className="history-item">
                            <span>{new Date(h.date).toLocaleDateString('tr-TR')}</span>
                            <span>₺{h.amount.toLocaleString('tr-TR')}</span>
                            <span className={h.status === 'paid' ? 'status-paid' : 'status-pending'}>
                              {h.status === 'paid' ? 'Ödendi' : 'Beklemede'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                      </>
                    )}

                    {/* Program Sekmesi */}
                    {accountModalTab === 'program' && (
                      <div className="student-modal-program">
                        <OgrenciProgramTab 
                          student={{
                            id: selectedAccount.id,
                            name: selectedAccount.name,
                            className: selectedAccount.className
                          }} 
                          teacherId={JSON.parse(localStorage.getItem('user'))?.id}
                        />
                      </div>
                    )}

                    <div className="modal-bottom">
                      <button className="danger-btn">Çıkış Yap</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeMenu === 'kaynaklar' ? (
            <Kaynaklar />
          ) : activeMenu === 'notlar' ? (
            <div className="notlar-content">
              <h1 className="page-title">Notlar</h1>
              
              {/* Notlar Filtreleri */}
              <div className="notlar-filters">
                <div className="filter-group">
                  <label>Sınıf:</label>
                  <select className="filter-select">
                    <option value="">Tüm Sınıflar</option>
                    <option value="10A">10A</option>
                    <option value="10B">10B</option>
                    <option value="11A">11A</option>
                    <option value="11B">11B</option>
                    <option value="12A">12A</option>
                    <option value="12B">12B</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ders:</label>
                  <select className="filter-select">
                    <option value="">Tüm Dersler</option>
                    <option value="matematik">Matematik</option>
                    <option value="fizik">Fizik</option>
                    <option value="kimya">Kimya</option>
                    <option value="biyoloji">Biyoloji</option>
                    <option value="turkce">Türkçe</option>
                    <option value="tarih">Tarih</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Tarih:</label>
                  <select className="filter-select">
                    <option value="">Tüm Tarihler</option>
                    <option value="bugun">Bugün</option>
                    <option value="bu-hafta">Bu Hafta</option>
                    <option value="bu-ay">Bu Ay</option>
                    <option value="gecen-ay">Geçen Ay</option>
                  </select>
                </div>
                <button className="filter-btn">
                  <FontAwesomeIcon icon={faSearch} />
                  Filtrele
                </button>
              </div>

              {/* Notlar Tablosu */}
              <div className="notlar-table-container">
                <table className="notlar-table">
                  <thead>
                    <tr>
                      <th>Öğrenci</th>
                      <th>Sınıf</th>
                      <th>Ders</th>
                      <th>Sınav Türü</th>
                      <th>Not</th>
                      <th>Tarih</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar"><img src={studentImg} alt="Zeynep Yılmaz" /></div>
                          <span>Zeynep Yılmaz</span>
                        </div>
                      </td>
                      <td>11A</td>
                      <td>Matematik</td>
                      <td><span className="exam-type quiz">Quiz</span></td>
                      <td><span className="grade excellent">95</span></td>
                      <td>15 Ekim 2024</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit">
                            <FontAwesomeIcon icon={faStickyNote} />
                          </button>
                          <button className="action-btn delete">
                            <FontAwesomeIcon icon={faBell} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar"><img src={studentImg} alt="Ahmet Yıldız" /></div>
                          <span>Ahmet Yıldız</span>
                        </div>
                      </td>
                      <td>11A</td>
                      <td>Fizik</td>
                      <td><span className="exam-type exam">Sınav</span></td>
                      <td><span className="grade good">78</span></td>
                      <td>14 Ekim 2024</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit">
                            <FontAwesomeIcon icon={faStickyNote} />
                          </button>
                          <button className="action-btn delete">
                            <FontAwesomeIcon icon={faBell} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar"><img src={studentImg} alt="Elif Kaya" /></div>
                          <span>Elif Kaya</span>
                        </div>
                      </td>
                      <td>11B</td>
                      <td>Kimya</td>
                      <td><span className="exam-type homework">Ödev</span></td>
                      <td><span className="grade average">65</span></td>
                      <td>13 Ekim 2024</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit">
                            <FontAwesomeIcon icon={faStickyNote} />
                          </button>
                          <button className="action-btn delete">
                            <FontAwesomeIcon icon={faBell} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar"><img src={studentImg} alt="Mehmet Korkmaz" /></div>
                          <span>Mehmet Korkmaz</span>
                        </div>
                      </td>
                      <td>10A</td>
                      <td>Biyoloji</td>
                      <td><span className="exam-type exam">Sınav</span></td>
                      <td><span className="grade poor">45</span></td>
                      <td>12 Ekim 2024</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit">
                            <FontAwesomeIcon icon={faStickyNote} />
                          </button>
                          <button className="action-btn delete">
                            <FontAwesomeIcon icon={faBell} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar"><img src={studentImg} alt="Selin Arslan" /> </div>
                          <span>Selin Arslan</span>
                        </div>
                      </td>
                      <td>12A</td>
                      <td>Türkçe</td>
                      <td><span className="exam-type quiz">Quiz</span></td>
                      <td><span className="grade excellent">92</span></td>
                      <td>11 Ekim 2024</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit">
                            <FontAwesomeIcon icon={faStickyNote} />
                          </button>
                          <button className="action-btn delete">
                            <FontAwesomeIcon icon={faBell} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notlar Aksiyonları */}
              <div className="notlar-actions">
                <button className="action-button primary">
                  <FontAwesomeIcon icon={faStickyNote} />
                  Yeni Not Ekle
                </button>
                <button className="action-button secondary">
                  <FontAwesomeIcon icon={faChartLine} />
                  Not Raporu
                </button>
                <button className="action-button secondary">
                  <FontAwesomeIcon icon={faCreditCard} />
                  Excel'e Aktar
                </button>
              </div>
            </div>
          ) : activeMenu === 'yapayzeka' ? (
            <div className="yapayzeka-content">
              <h1 className="page-title">Yapay Zeka Asistanı</h1>
              
              {/* AI Özet Kartları */}
              <div className="ai-summary">
                <div className="ai-card">
                  <div className="ai-icon">
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                  <div className="ai-content">
                    <h3>AI Analiz Raporu</h3>
                    <div className="ai-number">15</div>
                    <div className="ai-subtitle">Bu ay oluşturulan rapor</div>
                  </div>
                </div>

                <div className="ai-card">
                  <div className="ai-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div className="ai-content">
                    <h3>Öğrenci Performansı</h3>
                    <div className="ai-number">%87</div>
                    <div className="ai-subtitle">Ortalama başarı oranı</div>
                  </div>
                </div>

                <div className="ai-card">
                  <div className="ai-icon">
                    <FontAwesomeIcon icon={faBullseye} />
                  </div>
                  <div className="ai-content">
                    <h3>Hedef Önerileri</h3>
                    <div className="ai-number">23</div>
                    <div className="ai-subtitle">Kişiselleştirilmiş öneri</div>
                  </div>
                </div>

                <div className="ai-card">
                  <div className="ai-icon">
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <div className="ai-content">
                    <h3>Zaman Tasarrufu</h3>
                    <div className="ai-number">12h</div>
                    <div className="ai-subtitle">Bu hafta kazanılan süre</div>
                  </div>
                </div>
              </div>

              {/* AI Chat Bölümü */}
              <div className="ai-chat-section">
                <div className="chat-container">
                  <div className="chat-header">
                    <div className="chat-title">
                      <FontAwesomeIcon icon={faRobot} />
                      <span>AI Asistan</span>
                    </div>
                    <div className="chat-status">
                      <div className="status-dot online"></div>
                      <span>Çevrimiçi</span>
                    </div>
                  </div>
                  
                  <div className="chat-messages">
                    <div className="message ai-message">
                      <div className="message-avatar">
                        <FontAwesomeIcon icon={faRobot} />
                      </div>
                      <div className="message-content">
                        <p>Merhaba! Size nasıl yardımcı olabilirim? Öğrenci analizi, ders planlaması veya performans değerlendirmesi konularında destek sağlayabilirim.</p>
                        <span className="message-time">Şimdi</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="chat-input-container">
                    <input 
                      type="text" 
                      placeholder="AI'ya soru sorun..." 
                      className="chat-input"
                    />
                    <button className="send-btn">
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Özellikleri */}
              <div className="ai-features">
                <div className="feature-card">
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div className="feature-content">
                    <h3>Öğrenci Analizi</h3>
                    <p>AI, öğrenci performanslarını analiz ederek kişiselleştirilmiş öneriler sunar.</p>
                    <button className="feature-btn">Analiz Başlat</button>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faBook} />
                  </div>
                  <div className="feature-content">
                    <h3>Ders Planlaması</h3>
                    <p>Yapay zeka, müfredat ve öğrenci ihtiyaçlarına göre ders planları oluşturur.</p>
                    <button className="feature-btn">Plan Oluştur</button>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faStickyNote} />
                  </div>
                  <div className="feature-content">
                    <h3>Soru Üretimi</h3>
                    <p>AI, konuya uygun sınav soruları ve quiz'ler otomatik olarak üretir.</p>
                    <button className="feature-btn">Soru Üret</button>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="feature-content">
                    <h3>Sınıf Yönetimi</h3>
                    <p>Öğrenci grupları ve etkileşimlerini analiz ederek sınıf yönetimi önerileri sunar.</p>
                    <button className="feature-btn">Analiz Et</button>
                  </div>
                </div>
              </div>

              {/* AI Raporları */}
              <div className="ai-reports">
                <h2 className="section-title">Son AI Raporları</h2>
                <div className="reports-grid">
                  <div className="report-card">
                    <div className="report-header">
                      <h3>11A Sınıfı Performans Analizi</h3>
                      <span className="report-date">2 gün önce</span>
                    </div>
                    <div className="report-content">
                      <p>Matematik dersinde öğrencilerin %78'i hedeflenen seviyede. 3 öğrenci için ek destek öneriliyor.</p>
                      <div className="report-actions">
                        <button className="report-btn primary">Raporu Gör</button>
                        <button className="report-btn secondary">PDF İndir</button>
                      </div>
                    </div>
                  </div>

                  <div className="report-card">
                    <div className="report-header">
                      <h3>Bireysel Öğrenci Profili - Zeynep Y.</h3>
                      <span className="report-date">1 hafta önce</span>
                    </div>
                    <div className="report-content">
                      <p>Öğrencinin güçlü yönleri: Analitik düşünme. Geliştirilmesi gereken: Problem çözme hızı.</p>
                      <div className="report-actions">
                        <button className="report-btn primary">Raporu Gör</button>
                        <button className="report-btn secondary">PDF İndir</button>
                      </div>
                    </div>
                  </div>

                  <div className="report-card">
                    <div className="report-header">
                      <h3>Ders Planı Önerisi - Fizik</h3>
                      <span className="report-date">3 gün önce</span>
                    </div>
                    <div className="report-content">
                      <p>Momentum konusu için 4 haftalık detaylı plan. İnteraktif aktiviteler ve değerlendirme önerileri dahil.</p>
                      <div className="report-actions">
                        <button className="report-btn primary">Raporu Gör</button>
                        <button className="report-btn secondary">PDF İndir</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeMenu === 'mesajlar' ? (
            <div className="mesajlar-content">
              <h1 className="page-title">Mesajlar</h1>
              
              {/* Mesaj Filtreleri */}
              <div className="mesaj-filters">
                <div className="filter-group">
                  <label>Gönderen:</label>
                  <select className="filter-select">
                    <option value="">Tüm Mesajlar</option>
                    <option value="veli">Veliler</option>
                    <option value="ogrenci">Öğrenciler</option>
                    <option value="yonetim">Yönetim</option>
                    <option value="ogretmen">Öğretmenler</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Durum:</label>
                  <select className="filter-select">
                    <option value="">Tüm Durumlar</option>
                    <option value="okunmadi">Okunmamış</option>
                    <option value="okundu">Okundu</option>
                    <option value="cevaplandi">Cevaplandı</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Tarih:</label>
                  <select className="filter-select">
                    <option value="">Tüm Tarihler</option>
                    <option value="bugun">Bugün</option>
                    <option value="bu-hafta">Bu Hafta</option>
                    <option value="bu-ay">Bu Ay</option>
                  </select>
                </div>
                <button className="filter-btn">
                  <FontAwesomeIcon icon={faSearch} />
                  Filtrele
                </button>
              </div>

              {/* Mesaj Listesi */}
              <div className="mesajlar-container">
                <div className="mesaj-item unread">
                  <div className="mesaj-avatar">
                    <div className="avatar-circle">AY</div>
                    <div className="online-indicator"></div>
                  </div>
                  <div className="mesaj-content">
                    <div className="mesaj-header">
                      <h3>Ahmet Yıldız (Veli)</h3>
                      <span className="mesaj-time">2 saat önce</span>
                    </div>
                    <p className="mesaj-preview">Merhaba, oğlumun matematik dersindeki performansı hakkında konuşmak istiyorum...</p>
                    <div className="mesaj-meta">
                      <span className="mesaj-status unread">Okunmamış</span>
                      <span className="mesaj-priority high">Yüksek Öncelik</span>
                    </div>
                  </div>
                  <div className="mesaj-actions">
                    <button className="action-btn reply">
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="action-btn archive">
                      <FontAwesomeIcon icon={faBell} />
                    </button>
                  </div>
                </div>

                <div className="mesaj-item read">
                  <div className="mesaj-avatar">
                    <div className="avatar-circle">ZY</div>
                  </div>
                  <div className="mesaj-content">
                    <div className="mesaj-header">
                      <h3>Zeynep Yılmaz (Öğrenci)</h3>
                      <span className="mesaj-time">4 saat önce</span>
                    </div>
                    <p className="mesaj-preview">Öğretmenim, yarınki sınav için hangi konulara odaklanmalıyım?</p>
                    <div className="mesaj-meta">
                      <span className="mesaj-status read">Okundu</span>
                      <span className="mesaj-priority normal">Normal</span>
                    </div>
                  </div>
                  <div className="mesaj-actions">
                    <button className="action-btn reply">
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="action-btn archive">
                      <FontAwesomeIcon icon={faBell} />
                    </button>
                  </div>
                </div>

                <div className="mesaj-item read">
                  <div className="mesaj-avatar">
                    <div className="avatar-circle">MK</div>
                  </div>
                  <div className="mesaj-content">
                    <div className="mesaj-header">
                      <h3>Müdürlük</h3>
                      <span className="mesaj-time">1 gün önce</span>
                    </div>
                    <p className="mesaj-preview">Bu hafta sonu yapılacak veli toplantısı hakkında bilgilendirme...</p>
                    <div className="mesaj-meta">
                      <span className="mesaj-status replied">Cevaplandı</span>
                      <span className="mesaj-priority high">Yüksek Öncelik</span>
                    </div>
                  </div>
                  <div className="mesaj-actions">
                    <button className="action-btn reply">
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="action-btn archive">
                      <FontAwesomeIcon icon={faBell} />
                    </button>
                  </div>
                </div>

                <div className="mesaj-item unread">
                  <div className="mesaj-avatar">
                    <div className="avatar-circle">EK</div>
                    <div className="online-indicator"></div>
                  </div>
                  <div className="mesaj-content">
                    <div className="mesaj-header">
                      <h3>Elif Kaya (Veli)</h3>
                      <span className="mesaj-time">2 gün önce</span>
                    </div>
                    <p className="mesaj-preview">Kızımın ödevlerini kontrol etmek için nasıl bir sistem kullanabiliriz?</p>
                    <div className="mesaj-meta">
                      <span className="mesaj-status unread">Okunmamış</span>
                      <span className="mesaj-priority normal">Normal</span>
                    </div>
                  </div>
                  <div className="mesaj-actions">
                    <button className="action-btn reply">
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="action-btn archive">
                      <FontAwesomeIcon icon={faBell} />
                    </button>
                  </div>
                </div>

                <div className="mesaj-item read">
                  <div className="mesaj-avatar">
                    <div className="avatar-circle">SA</div>
                  </div>
                  <div className="mesaj-content">
                    <div className="mesaj-header">
                      <h3>Selin Arslan (Öğrenci)</h3>
                      <span className="mesaj-time">3 gün önce</span>
                    </div>
                    <p className="mesaj-preview">Proje ödevim için ek kaynak önerileriniz var mı?</p>
                    <div className="mesaj-meta">
                      <span className="mesaj-status read">Okundu</span>
                      <span className="mesaj-priority low">Düşük Öncelik</span>
                    </div>
                  </div>
                  <div className="mesaj-actions">
                    <button className="action-btn reply">
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="action-btn archive">
                      <FontAwesomeIcon icon={faBell} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mesaj Aksiyonları */}
              <div className="mesajlar-actions">
                <button className="action-button primary">
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Yeni Mesaj Gönder
                </button>
                <button className="action-button secondary">
                  <FontAwesomeIcon icon={faBell} />
                  Tümünü Okundu İşaretle
                </button>
                <button className="action-button secondary">
                  <FontAwesomeIcon icon={faStickyNote} />
                  Arşivle
                </button>
              </div>
            </div>
          ) : activeMenu === 'bildirim-gonder' ? (
            <div className="bildirim-gonder-content">
              <h1 className="page-title">Veli/Öğrenci Bildirim Gönder</h1>
              
              {/* Bildirim Türü Seçimi */}
              <div className="bildirim-type-selection">
                <h2 className="section-title">Bildirim Türü Seçin</h2>
                <div className="type-cards">
                  <div className="type-card active">
                    <div className="type-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <h3>Veli Bildirimi</h3>
                    <p>Velilere öğrenci durumu hakkında bilgi gönderin</p>
                  </div>
                  <div className="type-card">
                    <div className="type-icon">
                      <FontAwesomeIcon icon={faBell} />
                    </div>
                    <h3>Öğrenci Bildirimi</h3>
                    <p>Öğrencilere ders ve ödev hakkında bilgi gönderin</p>
                  </div>
                  <div className="type-card">
                    <div className="type-icon">
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </div>
                    <h3>Toplu Bildirim</h3>
                    <p>Birden fazla kişiye aynı anda bildirim gönderin</p>
                  </div>
                </div>
              </div>

              {/* Alıcı Seçimi */}
              <div className="alici-selection">
                <h2 className="section-title">Alıcıları Seçin</h2>
                <div className="selection-tabs">
                  <button className="tab-btn active">Sınıf Seç</button>
                  <button className="tab-btn">Bireysel Seç</button>
                  <button className="tab-btn">Grup Seç</button>
                </div>
                
                <div className="selection-content">
                  <div className="class-selection">
                    <div className="class-grid">
                      <div className="class-item">
                        <input type="checkbox" id="class-10a" />
                        <label htmlFor="class-10a">
                          <span className="class-name">10A Sınıfı</span>
                          <span className="class-count">25 öğrenci</span>
                        </label>
                      </div>
                      <div className="class-item">
                        <input type="checkbox" id="class-10b" />
                        <label htmlFor="class-10b">
                          <span className="class-name">10B Sınıfı</span>
                          <span className="class-count">23 öğrenci</span>
                        </label>
                      </div>
                      <div className="class-item">
                        <input type="checkbox" id="class-11a" />
                        <label htmlFor="class-11a">
                          <span className="class-name">11A Sınıfı</span>
                          <span className="class-count">28 öğrenci</span>
                        </label>
                      </div>
                      <div className="class-item">
                        <input type="checkbox" id="class-11b" />
                        <label htmlFor="class-11b">
                          <span className="class-name">11B Sınıfı</span>
                          <span className="class-count">26 öğrenci</span>
                        </label>
                      </div>
                      <div className="class-item">
                        <input type="checkbox" id="class-12a" />
                        <label htmlFor="class-12a">
                          <span className="class-name">12A Sınıfı</span>
                          <span className="class-count">24 öğrenci</span>
                        </label>
                      </div>
                      <div className="class-item">
                        <input type="checkbox" id="class-12b" />
                        <label htmlFor="class-12b">
                          <span className="class-name">12B Sınıfı</span>
                          <span className="class-count">27 öğrenci</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bildirim İçeriği */}
              <div className="bildirim-content">
                <h2 className="section-title">Bildirim İçeriği</h2>
                <div className="content-form">
                  <div className="form-group">
                    <label>Başlık:</label>
                    <input 
                      type="text" 
                      placeholder="Bildirim başlığını girin..."
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>İçerik:</label>
                    <textarea 
                      placeholder="Bildirim içeriğini girin..."
                      className="form-textarea"
                      rows="6"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label>Öncelik:</label>
                    <select className="form-select">
                      <option value="normal">Normal</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Gönderim Zamanı:</label>
                    <div className="time-selection">
                      <input type="radio" id="immediate" name="time" defaultChecked />
                      <label htmlFor="immediate">Hemen Gönder</label>
                      
                      <input type="radio" id="scheduled" name="time" />
                      <label htmlFor="scheduled">Zamanlanmış Gönderim</label>
                    </div>
                    <input 
                      type="datetime-local" 
                      className="form-input"
                      style={{marginTop: '10px'}}
                    />
                  </div>
                </div>
              </div>

              {/* Ek Seçenekler */}
              <div className="ek-secenekler">
                <h2 className="section-title">Ek Seçenekler</h2>
                <div className="options-grid">
                  <div className="option-item">
                    <input type="checkbox" id="sms" />
                    <label htmlFor="sms">
                      <FontAwesomeIcon icon={faBell} />
                      <span>SMS Bildirimi</span>
                    </label>
                  </div>
                  <div className="option-item">
                    <input type="checkbox" id="email" />
                    <label htmlFor="email">
                      <FontAwesomeIcon icon={faPaperPlane} />
                      <span>E-posta Bildirimi</span>
                    </label>
                  </div>
                  <div className="option-item">
                    <input type="checkbox" id="push" />
                    <label htmlFor="push">
                      <FontAwesomeIcon icon={faBell} />
                      <span>Push Bildirimi</span>
                    </label>
                  </div>
                  <div className="option-item">
                    <input type="checkbox" id="whatsapp" />
                    <label htmlFor="whatsapp">
                      <FontAwesomeIcon icon={faComments} />
                      <span>WhatsApp Bildirimi</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Önizleme ve Gönder */}
              <div className="preview-send">
                <div className="preview-section">
                  <h3>Önizleme</h3>
                  <div className="preview-card">
                    <div className="preview-header">
                      <h4>Başlık Önizlemesi</h4>
                      <span className="preview-priority">Normal</span>
                    </div>
                    <p className="preview-content">
                      Bildirim içeriği burada görünecek...
                    </p>
                    <div className="preview-meta">
                      <span>Gönderen: Öğretmen</span>
                      <span>Alıcı: 0 kişi</span>
                    </div>
                  </div>
                </div>
                
                <div className="send-actions">
                  <button className="action-button secondary">
                    <FontAwesomeIcon icon={faStickyNote} />
                    Taslak Kaydet
                  </button>
                  <button className="action-button primary">
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Bildirim Gönder
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="students-content">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                <h1 className="page-title" style={{margin: 0}}>Öğrenciler</h1>
                <button 
                  className="edit-btn" 
                  onClick={() => setShowAddStudentModal(true)}
                  style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Öğrenci Ekle
                </button>
              </div>
              
              {studentsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Yükleniyor...</div>
              ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>👨‍🎓</div>
                  <h2 style={{ fontSize: '24px', color: '#374151', marginBottom: '12px', fontWeight: 600 }}>Henüz Öğrenci Eklememişsiniz</h2>
                  <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                    Aşağıdaki butona tıklayarak öğrenci ekleyebilirsiniz.
                  </p>
                  <button 
                    className="edit-btn" 
                    onClick={() => setShowAddStudentModal(true)}
                    style={{ padding: '12px 30px', fontSize: '16px' }}
                  >
                    ➕ Öğrenci Ekle
                  </button>
                </div>
              ) : (
              <div className="students-grid">
                {students.map((student) => (
                  <div key={student.id} className="student-card" onClick={(e) => {
                    // Eğer menü butonuna tıklanmışsa, kart tıklamasını engelle
                    if (e.target.closest('.card-menu')) return;
                    handleStudentClick(student);
                  }}>
                    <div className="card-header">
                      <div className={`status-indicator ${student.online ? 'online-badge' : 'offline-badge'}`}>
                        <div className={`status-dot ${student.online ? 'online' : 'offline'}`}></div>
                        <span className="status-text">
                          {student.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                        </span>
                      </div>
                      <div className="card-menu" style={{position: 'relative'}}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === student.id ? null : student.id);
                          }}
                          style={{background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280'}}
                        >
                    <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                        {openMenuId === student.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            minWidth: 120,
                            marginTop: 4
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStudent(student);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: '#374151'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(student.id);
                              }}
                              disabled={deletingStudentId === student.id}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: deletingStudentId === student.id ? 'not-allowed' : 'pointer',
                                fontSize: 14,
                                color: deletingStudentId === student.id ? '#9ca3af' : '#dc2626',
                                borderTop: '1px solid #e5e7eb'
                              }}
                              onMouseEnter={(e) => {
                                if (deletingStudentId !== student.id) {
                                  e.target.style.background = '#fef2f2';
                                }
                              }}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              {deletingStudentId === student.id ? 'Siliniyor...' : 'Sil'}
                            </button>
                          </div>
                        )}
                  </div>
                    </div>

                    <div className="student-info">
                      <div className="student-photo">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} />
                        ) : (
                          <div className="photo-placeholder"><img src={studentImg} alt={student.name} /></div>
                        )}
                      </div>
                      <div className="student-details">
                        <h3 className="student-name">{student.name}</h3>
                        <p className="student-class">
                          {student.class}
                          {student.alan && (
                            <>
                              {' • '}
                              {formatAreaLabel(student.alan)}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="performance-metrics">
                      <div className="metric metric-overdue">
                        <span className="metric-label">Zamanı Geçen Etüt :</span>
                        <span className="metric-value">{student.overdue}</span>
                      </div>
                      <div className="metric metric-progress " style={{padding: '12px 14px', borderRadius: 10, border: '1px solid rgb(229, 231, 235)', background: 'rgb(249, 250, 251)'}}> 
                        <span className="metric-label">Haftalık Biten Etüt :</span>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${student.completed ?? 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {studentsEtutLoading && (student.completed == null)
                              ? 'Yükleniyor...'
                              : `${student.completed ?? 0}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Öğrenci Ekleme Modalı */}
      {showAddStudentModal && (
        <div className="profile-modal-bg" onClick={() => setShowAddStudentModal(false)}>
          <div className="profile-modal" onClick={e=>e.stopPropagation()}>
            <form className="profile-update-form" onSubmit={handleStudentSubmit}>
              <div className="form-row">
                <div><label>Ad</label>
                  <input name="firstName" value={studentForm.firstName} onChange={handleStudentFormChange} required />
                </div>
                <div><label>Soyad</label>
                  <input name="lastName" value={studentForm.lastName} onChange={handleStudentFormChange} required />
                </div>
              </div>
              <div className="form-row">
                <div><label>Email</label>
                  <input name="email" type="email" value={studentForm.email} onChange={handleStudentFormChange} required />
                </div>
                <div><label>Telefon</label>
                  <input name="phone" value={studentForm.phone} onChange={handleStudentFormChange} />
                </div>
              </div>
              <div className="form-row">
                <div><label>Sınıf</label>
                  <input name="className" value={studentForm.className} onChange={handleStudentFormChange} required />
                </div>
                <div><label>Alan</label>
                  <select name="alan" value={studentForm.alan} onChange={handleStudentFormChange} required>
                    <option value="">Seçiniz</option>
                    {EXAM_CATEGORY_OPTIONS.map((group) => (
                      <optgroup key={group.label} label={`SINAVLAR · ${group.label}`}>
                        {group.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Görüşme Tarihi</label>
                  <input
                    type="date"
                    name="meetingDate"
                    value={studentForm.meetingDate}
                    onChange={handleStudentFormChange}
                    required
                  />
                </div>
                <div><label>Fotoğraf</label>
                  <input name="photoFile" type="file" accept="image/*" onChange={handleStudentPhotoUpload} />
                  {stuUploading && <span style={{color:'#8e24aa'}}>Yükleniyor...</span>}
                  {studentForm.profilePhoto && <img src={studentForm.profilePhoto} alt="" style={{maxWidth: 48, borderRadius: 8, marginTop: 6}} />}
                  {addError && <div style={{ color: '#b91c1c' }}>{addError}</div>}
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Şifre</label>
                  <input name="password" value={studentForm.password} onChange={handleStudentFormChange} type="password" autoComplete="new-password" required />
                </div>
                <div>
                  <label>Şifre Tekrar</label>
                  <input name="passwordConfirm" value={studentForm.passwordConfirm} onChange={handleStudentFormChange} type="password" autoComplete="new-password" required />
                </div>
              </div>
              {addError && <div style={{ color: '#b91c1c', marginTop: 10 }}>{addError}</div>}
              {addSuccess && <div style={{ color: '#16a34a', marginTop: 10 }}>{addSuccess}</div>}
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button type="button" className="edit-btn ghost" style={{marginRight:10}} onClick={()=>setShowAddStudentModal(false)}>Vazgeç</button>
                <button type="submit" className="edit-btn" disabled={adding}>{adding ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Öğrenci Düzenleme Modalı */}
      {showEditStudentModal && editingStudent && (
        <div className="profile-modal-bg" onClick={() => {setShowEditStudentModal(false); setEditingStudent(null);}}>
          <div className="profile-modal" onClick={e=>e.stopPropagation()}>
            <form className="profile-update-form" onSubmit={handleUpdateStudent}>
              <h2 style={{marginTop: 0, marginBottom: 20}}>Öğrenci Düzenle</h2>
              <div className="form-row">
                <div><label>Ad</label>
                  <input name="firstName" value={editStudentForm.firstName} onChange={handleEditStudentFormChange} required />
                </div>
                <div><label>Soyad</label>
                  <input name="lastName" value={editStudentForm.lastName} onChange={handleEditStudentFormChange} required />
                </div>
              </div>
              <div className="form-row">
                <div><label>Email</label>
                  <input name="email" type="email" value={editStudentForm.email} onChange={handleEditStudentFormChange} required />
                </div>
                <div><label>Telefon</label>
                  <input name="phone" value={editStudentForm.phone} onChange={handleEditStudentFormChange} />
                </div>
              </div>
              <div className="form-row">
                <div><label>Sınıf</label>
                  <input name="className" value={editStudentForm.className} onChange={handleEditStudentFormChange} required />
                </div>
                <div><label>Alan</label>
                  <select name="alan" value={editStudentForm.alan} onChange={handleEditStudentFormChange} required>
                    <option value="">Seçiniz</option>
                    {EXAM_CATEGORY_OPTIONS.map((group) => (
                      <optgroup key={group.label} label={`SINAVLAR · ${group.label}`}>
                        {group.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Görüşme Günü (ilk seans tarihi)</label>
                  <input
                    name="meetingDate"
                    type="date"
                    value={editStudentForm.meetingDate}
                    onChange={handleEditStudentFormChange}
                  />
                  <small style={{ display: 'block', marginTop: 4, color: '#6b7280' }}>
                    Bu tarih, haftalık programın başlangıç günü olacaktır.
                  </small>
                </div>
              </div>
              <div className="form-row">
                <div><label>Fotoğraf</label>
                  <input name="photoFile" type="file" accept="image/*" onChange={handleEditStudentPhotoUpload} />
                  {editStuUploading && <span style={{color:'#8e24aa'}}>Yükleniyor...</span>}
                  {editStudentForm.profilePhoto && <img src={editStudentForm.profilePhoto} alt="" style={{maxWidth: 48, borderRadius: 8, marginTop: 6}} />}
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)</label>
                  <input name="password" value={editStudentForm.password} onChange={handleEditStudentFormChange} type="password" autoComplete="new-password" />
                </div>
                <div>
                  <label>Şifre Tekrar</label>
                  <input name="passwordConfirm" value={editStudentForm.passwordConfirm} onChange={handleEditStudentFormChange} type="password" autoComplete="new-password" />
                </div>
              </div>
              {updateError && <div style={{ color: '#b91c1c', marginTop: 10 }}>{updateError}</div>}
              {updateSuccess && <div style={{ color: '#16a34a', marginTop: 10 }}>{updateSuccess}</div>}
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button type="button" className="edit-btn ghost" style={{marginRight:10}} onClick={() => {setShowEditStudentModal(false); setEditingStudent(null);}}>Vazgeç</button>
                <button type="submit" className="edit-btn" disabled={updating}>{updating ? 'Güncelleniyor...' : 'Güncelle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OgretmenPanel;

