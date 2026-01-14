import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faPlus,
  faEdit,
  faTrash,
  faCalendarAlt,
  faBook,
  faFileAlt,
  faClipboardList,
  faCopy,
  faClock,
  faArrowLeft,
  faRobot,
  faChartLine,
  faFileExport,
  faFileImport,
  faPrint,
  faSave,
  faHistory,
  faTimes,
  faGripLines,
  faExpandArrowsAlt,
  faCheck,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './OgrenciProgramTab.css';

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

const DAY_OPTIONS = [
  { value: 1, label: 'Pazartesi', short: 'Pzt' },
  { value: 2, label: 'Salı', short: 'Sal' },
  { value: 3, label: 'Çarşamba', short: 'Çar' },
  { value: 4, label: 'Perşembe', short: 'Per' },
  { value: 5, label: 'Cuma', short: 'Cum' },
  { value: 6, label: 'Cumartesi', short: 'Cmt' },
  { value: 7, label: 'Pazar', short: 'Paz' }
];

const DAY_LABELS_SHORT = DAY_OPTIONS.reduce((acc, day) => {
  acc[day.value] = day.short;
  return acc;
}, {});

// Modern, yüksek kontrastlı ve birbirinden net ayrılan renk paleti
const SUBJECT_COLOR_PALETTE = [
  '#FF6B6B', // Canlı kırmızı
  '#06D6A0', // Mint
  '#FF914D', // Mandalina
  '#3A86FF', // Kobalt mavi
  '#FFD166', // Amber
  '#8338EC', // Mor
  '#FFE156', // Sarı
  '#118AB2', // Gökyüzü mavisi
  '#8AC926', // Lime
  '#FF006E', // Fuşya
  '#1DD3B0', // Turkuaz
  '#C77DFF', // Lavanta
  '#2EC4B6', // Camgöbeği
  '#F15BB5', // Magenta
  '#577590', // Çelik mavi
  '#9B5DE5'  // Menekşe
];

// TYT & AYT ders renklerini eşleştirmek için özel renk haritası
const SUBJECT_COLOR_OVERRIDES = {
  'tyt matematik': '#7E57C2',
  'ayt matematik': '#7E57C2',
  'tyt fizik': '#F06292',
  'ayt fizik': '#F06292',
  'tyt kimya': '#26C6DA',
  'ayt kimya': '#26C6DA',
  'tyt biyoloji': '#9CCC65',
  'ayt biyoloji': '#9CCC65',
  'tyt geometri': '#F4B400',
  'ayt geometri': '#F4B400',
  'tyt türkçe': '#546E7A',
  'ayt türkçe': '#546E7A',
  'tyt coğrafya': '#2196F3',
  'ayt coğrafya': '#2196F3',
  'tyt tarih': '#FF7043',
  'ayt tarih': '#FF7043',
  'tyt din': '#EF5350',
  'ayt din': '#EF5350',
  'tyt felsefe': '#00838F',
  'ayt felsefe': '#00838F',
  'türkçe': '#546E7A',
  'matematik': '#7E57C2',
  'geometri': '#F4B400',
  'fizik': '#F06292',
  'kimya': '#26C6DA',
  'biyoloji': '#9CCC65',
  'tarih': '#FF7043',
  'tarih-1': '#FF7043',
  'tarih-2': '#FF8A65',
  'coğrafya': '#2196F3',
  'coğrafya-1': '#2196F3',
  'coğrafya-2': '#64B5F6',
  'felsefe': '#00838F',
  'felsefe grubu': '#00838F',
  'din kültürü ve ahlak bilgisi': '#8E24AA',
  'türk dili ve edebiyatı': '#6A1B9A',
  'psikoloji': '#EC4899',
  'sosyoloji': '#0EA5E9',
  'mantık': '#8B5CF6',
  'fen bilimleri': '#059669',
  't.c. inkılap tarihi ve atatürkçülük': '#EA580C',
  'ingilizce': '#2563EB',
  'vatandaşlık': '#0EA5E9',
  'gelişim psikolojisi': '#F472B6',
  'öğrenme psikolojisi': '#A855F7',
  'rehberlik ve psikolojik danışma': '#7C3AED',
  'öğretim ilke ve yöntemleri': '#14B8A6',
  'ölçme ve değerlendirme': '#6366F1',
  'alan bilgisi': '#9333EA'
};

const LEGACY_AREA_FALLBACKS = {
  sayisal: 'yks_say',
  sozel: 'yks_soz',
  esit_agirlik: 'yks_ea',
  dil: 'yks_tyt',
  yks_say: 'yks_say',
  yks_soz: 'yks_soz',
  yks_ea: 'yks_ea',
  yks_tyt: 'yks_tyt'
};

// Alan bazlı ders listeleri
const getDersListesi = (alan) => {
  if (!alan) return [];
  // alan dizi gelirse ilk elemanı al
  const baseAlan = Array.isArray(alan) ? alan[0] : alan;
  const resolvedArea = LEGACY_AREA_FALLBACKS[baseAlan] || baseAlan;
  return []; // Dinamik sisteme geçildi, artik API'den geliyor
};

 

const getEtutDurationStorageKey = (teacherId) =>
  teacherId ? `etutDuration_${teacherId}` : 'etutDuration_default';

const loadStoredEtutDuration = (teacherId) => {
  if (typeof window === 'undefined') return 40;
  const stored = window.localStorage.getItem(getEtutDurationStorageKey(teacherId));
  const parsed = parseInt(stored, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 40;
};

const persistEtutDuration = (teacherId, duration) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getEtutDurationStorageKey(teacherId), String(duration));
};

const addMinutesToTime = (time, minutes) => {
  if (!time || !minutes) return '';
  const [hours, mins] = time.split(':').map((part) => parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(mins)) return '';
  const totalMinutes = hours * 60 + mins + Number(minutes);
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const endHour = Math.floor(normalized / 60);
  const endMinute = normalized % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

const calculateDurationBetweenTimes = (start, end) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map((v) => parseInt(v, 10));
  const [eh, em] = end.split(':').map((v) => parseInt(v, 10));
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return null;
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const diff = endTotal - startTotal;
  return diff > 0 ? diff : null;
};

const createEmptyRoutineForm = () => ({
  gunler: [],
  saat: '',
  bitisSaati: '',
  programTipi: 'soru_cozum',
  ders: '',
  konu: '',
  kaynak: '',
  aciklama: '',
  soruSayisi: ''
});

const OgrenciProgramTab = ({ student, teacherId, isStudentPanel = false, readOnly = false }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingProgramDay, setAddingProgramDay] = useState(null); // Hangi güne program ekleniyor (Date object veya null)
  const [editingProgram, setEditingProgram] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // { id, name, description, programs }
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [draggedProgram, setDraggedProgram] = useState(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [routineForm, setRoutineForm] = useState(() => createEmptyRoutineForm());
  const [routineError, setRoutineError] = useState('');
  const [routineSaving, setRoutineSaving] = useState(false);
  const [routineModalMode, setRoutineModalMode] = useState('list');
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [teacherAnalysis, setTeacherAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [teacherAnalysisSaving, setTeacherAnalysisSaving] = useState(false);
  const [teacherAnalysisMessage, setTeacherAnalysisMessage] = useState('');
  const [teacherAnalysisMessageType, setTeacherAnalysisMessageType] = useState('success');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportImportMessage, setExportImportMessage] = useState('');
  const [exportImportMessageType, setExportImportMessageType] = useState('success');
  const [expandedAciklama, setExpandedAciklama] = useState(new Set());
  const [statusInputs, setStatusInputs] = useState({}); // { programId: { dogru: '', yanlis: '', bos: '' } }
  const [calendarScale, setCalendarScale] = useState(1);
  const [defaultEtutDuration, setDefaultEtutDuration] = useState(() => loadStoredEtutDuration(teacherId));
  const [clearingWeek, setClearingWeek] = useState(false);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [showTopicAnalysisModal, setShowTopicAnalysisModal] = useState(false);
  const [topicAnalysisDateFilter, setTopicAnalysisDateFilter] = useState('3_ay');
  const [topicAnalysisDateRange, setTopicAnalysisDateRange] = useState({ start: null, end: null });
  const [topicAnalysisSubject, setTopicAnalysisSubject] = useState('');
  const [resultPopupProgram, setResultPopupProgram] = useState(null);
  const [resultPopupInputs, setResultPopupInputs] = useState({ dogru: '', yanlis: '', bos: '' });
  const [shakeStatusProgramId, setShakeStatusProgramId] = useState(null);
  const [validationPopup, setValidationPopup] = useState({ visible: false, message: '' });
  
  // Dinamik ders ve konular için state
  const [dynamicSubjects, setDynamicSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [dynamicTopics, setDynamicTopics] = useState([]);
  const [isDersLoading, setIsDersLoading] = useState(false);
  const [isKonuLoading, setIsKonuLoading] = useState(false);

  const normalizeSubjectNameHelper = (name) => {
    if (!name) return '';
    let n = String(name).toLowerCase().trim();
    n = n.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
    n = n
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    n = n.replace(/-\d+$/, '');
    return n;
  };

  const findSubjectRecordHelper = (ders) => {
    const target = normalizeSubjectNameHelper(ders);
    let subject = dynamicSubjects.find(s => normalizeSubjectNameHelper(s.ders_adi) === target);
    if (subject) return subject;
    subject = dynamicSubjects.find(s => {
      const sn = normalizeSubjectNameHelper(s.ders_adi);
      return sn.includes(target) || target.includes(sn);
    });
    return subject || null;
  };

  const getSubjectIconHelper = (ders) => {
    if (!ders) return null;
    const subject = findSubjectRecordHelper(ders);
    if (subject && subject.icon_url) {
      const u = String(subject.icon_url);
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith('/')) return `${API_BASE}${u}`;
      return `${API_BASE}/${u}`;
    }
    const normalized = normalizeSubjectNameHelper(ders);
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
  const normalizeSubjectName = (name) => {
    if (!name) return '';
    let n = String(name).toLowerCase().trim();
    n = n.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
    n = n
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    n = n.replace(/-\d+$/, '');
    return n;
  };

  const findSubjectRecord = (ders) => {
    const target = normalizeSubjectName(ders);
    const pool = [...dynamicSubjects, ...allSubjects];
    let subject = pool.find(s => normalizeSubjectName(s.ders_adi) === target);
    if (subject) return subject;
    // Esnek eşleşme: kapsama kontrolü
    subject = pool.find(s => {
      const sn = normalizeSubjectName(s.ders_adi);
      return sn.includes(target) || target.includes(sn);
    });
    return subject || null;
  };

  const resolveIconUrl = (url) => {
    if (!url) return null;
    const u = String(url);
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${API_BASE}${u}`;
    return `${API_BASE}/${u}`;
  };

  const getSubjectIcon = (ders) => {
    if (!ders) return null;
    const subject = findSubjectRecord(ders);
    if (subject && subject.icon_url) return resolveIconUrl(subject.icon_url);
    const normalized = normalizeSubjectName(ders);
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

  const [programForm, setProgramForm] = useState({
    programTipi: 'soru_cozum',
    ders: '',
    konu: '',
    kaynak: '',
    aciklama: '',
    hasYoutubeLinki: false,
    youtubeLinki: '',
    soruSayisi: '',
    baslangicSaati: '',
    bitisSaati: '',
    etutSuresi: loadStoredEtutDuration(teacherId),
    isManualKonu: false
  });

  const subjectColorMapRef = useRef({});
  const subjectColorIndexRef = useRef(0);
  const teacherAnalysisRef = useRef(null);
  const aiAnalysisRef = useRef(null);
  const exportMenuRef = useRef(null);
  const exportButtonRef = useRef(null);
  const importFileInputRef = useRef(null);
  const addProgramFormRef = useRef(null);
  const addFormEndTimeInputRef = useRef(null);
  const editFormEndTimeInputRef = useRef(null);
  const editProgramFormRef = useRef(null);
  const topicAnalysisModalRef = useRef(null);
  const topicAnalysisModalHeaderRef = useRef(null);
  const topicAnalysisModalResizeRef = useRef(null);
  const editKaynakInputRef = useRef(null);
  const addKaynakInputRef = useRef(null);
  const routineKaynakInputRef = useRef(null);
  const routineFormRef = useRef(null);
  const [focusedKaynakContext, setFocusedKaynakContext] = useState(null);

  useEffect(() => {
    if (focusedKaynakContext === 'edit' && editKaynakInputRef.current) {
      editKaynakInputRef.current.focus();
    }
  }, [programForm.kaynak, editingProgram]);

  useEffect(() => {
    if (focusedKaynakContext === 'add' && addKaynakInputRef.current) {
      addKaynakInputRef.current.focus();
    }
  }, [programForm.kaynak, addingProgramDay]);

  useEffect(() => {
    if (focusedKaynakContext === 'routine' && routineKaynakInputRef.current) {
      routineKaynakInputRef.current.focus();
    }
  }, [routineForm.kaynak, showRoutineModal, routineModalMode]);

  const effectiveStudentId = useMemo(() => {
    return (
      student?.id ||
      student?.student_id ||
      student?.ogrenci_id ||
      student?.userId ||
      student?.user_id ||
      null
    );
  }, [student]);

  const getSubjectColor = (ders) => {
    if (!ders) return null;
    const subject = findSubjectRecord(ders);
    if (subject && subject.color) return subject.color;
    const key = normalizeSubjectName(ders);
    if (SUBJECT_COLOR_OVERRIDES[key]) return SUBJECT_COLOR_OVERRIDES[key];
    if (!subjectColorMapRef.current[key]) {
      const paletteIndex = subjectColorIndexRef.current % SUBJECT_COLOR_PALETTE.length;
      subjectColorMapRef.current[key] = SUBJECT_COLOR_PALETTE[paletteIndex];
      subjectColorIndexRef.current += 1;
    }
    return subjectColorMapRef.current[key];
  };

  useEffect(() => {
    subjectColorMapRef.current = {};
    subjectColorIndexRef.current = 0;
  }, [effectiveStudentId]);

  useEffect(() => {
    const handleDocumentClick = () => setOpenStatusDropdown(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    setOpenStatusDropdown(null);
  }, [programs]);

  useEffect(() => {
    setDefaultEtutDuration(loadStoredEtutDuration(teacherId));
  }, [teacherId]);

  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_subjects.php?alan=all`);
        if (data.success) {
          setAllSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error('Tüm dersler yüklenemedi:', error);
      }
    };
    fetchAllSubjects();
  }, []);

  // Dinamik dersleri çek
  const studentAlan = useMemo(() => {
    if (!student?.alan) return '';
    if (Array.isArray(student.alan)) return student.alan.join(',');
    return String(student.alan);
  }, [student?.alan]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!studentAlan) {
        setDynamicSubjects([]);
        return;
      }
      setIsDersLoading(true);
      try {
        const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_subjects.php?alan=${encodeURIComponent(studentAlan)}`);
        if (data.success) {
          setDynamicSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error('Dersler yüklenemedi:', error);
      } finally {
        setIsDersLoading(false);
      }
    };
    fetchSubjects();
  }, [studentAlan]);

  // Seçili ders değiştiğinde konuları çek
  const fetchTopicsForSubject = async (subjectName) => {
    if (!subjectName) {
      setDynamicTopics([]);
      return;
    }

    // Ders adından ID'yi bul (Önce tam eşleşme, sonra kısmi eşleşme dene)
    const normalizedSearch = subjectName.trim().toLowerCase();
    let subject = [...dynamicSubjects, ...allSubjects].find(s => 
      s.ders_adi.trim().toLowerCase() === normalizedSearch
    );

    // Tam eşleşme yoksa, TYT/AYT gibi önekleri görmezden gelerek ara
    if (!subject) {
      const searchWithoutPrefix = normalizedSearch.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
      subject = [...dynamicSubjects, ...allSubjects].find(s => {
        const normalizedDers = s.ders_adi.trim().toLowerCase();
        const dersWithoutPrefix = normalizedDers.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
        return dersWithoutPrefix === searchWithoutPrefix;
      });
    }
    if (!subject || !subject.id) {
      setDynamicTopics([]);
      return;
    }

    setIsKonuLoading(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_subject_topics.php?dersId=${encodeURIComponent(subject.id)}`);
      if (data.success) {
        setDynamicTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Konular yüklenemedi:', error);
    } finally {
      setIsKonuLoading(false);
    }
  };

  useEffect(() => {
    if (!addingProgramDay && !editingProgram) {
      setProgramForm((prev) => ({
        ...prev,
        etutSuresi: defaultEtutDuration
      }));
    }
  }, [defaultEtutDuration, addingProgramDay, editingProgram]);

  const dersOptions = useMemo(() => {
    const dynamicDersNames = dynamicSubjects.map(s => s.ders_adi);
    
    // Sadece dinamik dersleri kullan
    let combined = [...new Set(dynamicDersNames)];
    
    // Eğer hala ders bulunamadıysa (alan yoksa veya API boş döndüyse), 
    // tüm dersler listesinden (allSubjects) yararlan
    if (combined.length === 0 && allSubjects.length > 0) {
      combined = allSubjects.map(s => s.ders_adi);
    }
    
    // Eğer hiçbir ders bulunamadıysa ve alan varsa, bir uyarı dersi ekleme
    if (combined.length === 0 && (student?.alan || studentAlan)) {
      return ['Ders bulunamadı'];
    }
    
    return combined.sort((a, b) => a.localeCompare(b, 'tr'));
  }, [studentAlan, dynamicSubjects, allSubjects]);

  // Öğrencinin derslerini programs verisinden çıkar
  const studentSubjects = useMemo(() => {
    const subjectsSet = new Set();
    programs.forEach(prog => {
      if (prog.ders && prog.ders.trim()) {
        subjectsSet.add(prog.ders.trim());
      }
    });
    return Array.from(subjectsSet).sort();
  }, [programs]);

  // Öğrencinin konularını programs verisinden çıkar (seçili derse göre filtrele)
  const studentTopics = useMemo(() => {
    const topicsSet = new Set();
    programs.forEach(prog => {
      // Eğer ders seçilmişse, sadece o derse ait konuları göster
      if (topicAnalysisSubject && prog.ders !== topicAnalysisSubject) return;
      if (prog.konu && prog.konu.trim()) {
        topicsSet.add(prog.konu.trim());
      }
    });
    return Array.from(topicsSet).sort();
  }, [programs, topicAnalysisSubject]);

  // Konu başarı istatistiklerini hesapla ve sırala
  const sortedTopicStats = useMemo(() => {
    if (!studentTopics.length) return [];

    const stats = studentTopics.map(topic => {
      // Bu konuya ait programları bul
      const topicPrograms = programs.filter(p => 
        p.konu && p.konu.trim() === topic && 
        (!topicAnalysisSubject || p.ders === topicAnalysisSubject) &&
        (p.dogru || p.yanlis || p.bos) // Sadece sonucu olanlar
      );

      // Başarı hesaplama
      let weightedSum = 0;
      let totalWeight = 0;
      let last3MonthsSum = 0;
      let last3MonthsCount = 0;
      let totalQuestions = 0;
      let totalCorrect = 0;

      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);

      topicPrograms.forEach(prog => {
        const dogru = parseFloat(prog.dogru) || 0;
        const yanlis = parseFloat(prog.yanlis) || 0;
        const bos = parseFloat(prog.bos) || 0;
        const total = dogru + yanlis + bos;
        
        if (total === 0) return;

        totalQuestions += total;
        totalCorrect += dogru;

        const successRate = (dogru / total) * 100;
        const progDate = new Date(prog.tarih);
        
        // Dinamik ağırlıklandırma
        // Son 1 hafta: 3x, Son 1 ay: 2x, Daha eski: 1x
        let weight = 1;
        const diffDays = (now - progDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 7) weight = 3;
        else if (diffDays <= 30) weight = 2;

        weightedSum += successRate * weight;
        totalWeight += weight;

        // Son 3 ay
        if (progDate >= threeMonthsAgo) {
          last3MonthsSum += successRate;
          last3MonthsCount++;
        }
      });

      return {
        topic,
        dynamicPercent: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0,
        last3MonthsPercent: last3MonthsCount > 0 ? Math.round(last3MonthsSum / last3MonthsCount) : 0,
        totalQuestions,
        overallPercent: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
      };
    });

    // Başarı puanına göre artan sıralama (Düşükten yükseğe)
    return stats.sort((a, b) => a.overallPercent - b.overallPercent);
  }, [studentTopics, programs, topicAnalysisSubject]);

  // Modal açıldığında ilk dersi otomatik seç
  useEffect(() => {
    if (showTopicAnalysisModal && studentSubjects.length > 0 && !topicAnalysisSubject) {
      setTopicAnalysisSubject(studentSubjects[0]);
    }
  }, [showTopicAnalysisModal, studentSubjects, topicAnalysisSubject]);

  const preferredWeekStart = useMemo(() => {
    let raw =
      student?.meetingDay ??
      student?.meeting_day ??
      student?.gorusmeGunu ??
      student?.gorusme_gunu;

    // Eğer explicit gün yoksa ama meetingDate varsa, onun gününü kullan
    if (!raw && (student?.meetingDate || student?.meeting_date)) {
      const d = new Date(student?.meetingDate || student?.meeting_date);
      if (!Number.isNaN(d.getTime())) {
        const jsDay = d.getDay();
        raw = jsDay === 0 ? 7 : jsDay;
      }
    }

    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 7) {
      return parsed;
    }
    return 1;
  }, [student]);

  // Öğrenci değiştiğinde haftayı bugüne hizala
  useEffect(() => {
    setCurrentWeek(new Date());
  }, [student?.id]);

  // Haftanın günlerini hesapla (öğrencinin görüşme gününü baz alarak)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Tercih edilen haftabaşı gününe (örneğin Pazartesi) hizala
    const currentJsDay = startOfWeek.getDay() === 0 ? 7 : startOfWeek.getDay();
    
    // Calculate how many days we need to go BACK to hit the most recent preferredWeekStart
    // This uses modulo arithmetic to ensure we always go back 0-6 days
    // (current - target + 7) % 7 gives the distance backwards
    const daysToGoBack = (currentJsDay - preferredWeekStart + 7) % 7;
    
    startOfWeek.setDate(startOfWeek.getDate() - daysToGoBack);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeek, preferredWeekStart]);

  const weekStartIso = useMemo(() => {
    if (!weekDays.length) return null;
    return weekDays[0].toISOString().split('T')[0];
  }, [weekDays]);

  const firstPrintDays = weekDays.slice(0, 4);
  const secondPrintDays = weekDays.slice(4);

  // Öğrenci programını yükle
  useEffect(() => {
    if (effectiveStudentId) {
      fetchStudentProgram();
    }
  }, [effectiveStudentId, currentWeek, weekDays]);

  // Şablonları yükle
  useEffect(() => {
    if (teacherId) {
      fetchTemplates();
    }
  }, [teacherId]);

  useEffect(() => {
    if (effectiveStudentId) {
      fetchStudentRoutines();
    } else {
      setRoutines([]);
    }
  }, [effectiveStudentId]);

  const fetchStudentProgram = async () => {
    setLoading(true);
    try {
      const startDate = weekDays[0].toISOString().split('T')[0];
      const endDate = weekDays[6].toISOString().split('T')[0];
      
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_program.php?studentId=${effectiveStudentId}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (data.success && data.programs) {
        setPrograms(data.programs);
        // Programlar yüklendiğinde initial input değerlerini set et
        // Her zaman veritabanından gelen değerleri kullan (0 değeri de geçerli)
        const initialInputs = {};
        data.programs.forEach(prog => {
          if (prog.program_tipi === 'soru_cozum' && prog.id) {
            // 0 değeri de geçerli, bu yüzden sadece null/undefined kontrolü yapıyoruz
            const dogruVal = (prog.dogru !== null && prog.dogru !== undefined && prog.dogru !== '') ? String(prog.dogru) : '';
            const yanlisVal = (prog.yanlis !== null && prog.yanlis !== undefined && prog.yanlis !== '') ? String(prog.yanlis) : '';
            const bosVal = (prog.bos !== null && prog.bos !== undefined && prog.bos !== '') ? String(prog.bos) : '';
            
            console.log(`Program ${prog.id} - Dogru: ${prog.dogru} (${typeof prog.dogru}), Yanlis: ${prog.yanlis} (${typeof prog.yanlis}), Bos: ${prog.bos} (${typeof prog.bos})`);
            console.log(`Program ${prog.id} - Dogru String: ${dogruVal}, Yanlis String: ${yanlisVal}, Bos String: ${bosVal}`);
            
            initialInputs[prog.id] = {
              dogru: dogruVal,
              yanlis: yanlisVal,
              bos: bosVal
            };
          }
        });
        console.log('Initial inputs:', initialInputs);
        // Veritabanından gelen değerleri kullan, mevcut input değerlerini override et
        setStatusInputs(initialInputs);
      }
    } catch (error) {
      console.error('Program yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRoutines = async () => {
    if (!effectiveStudentId) return;
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_routines.php?studentId=${effectiveStudentId}`
      );
      if (data.success && Array.isArray(data.routines)) {
        const normalized = data.routines.map((routine) => {
          const days = Array.isArray(routine.gunler)
            ? routine.gunler.map((d) => parseInt(d, 10)).filter((d) => d >= 1 && d <= 7)
            : [];
          const startTime = routine.baslangic_saati || routine.saat || '';
          const endTime = routine.bitis_saati || routine.bitisSaati || '';
          return {
            id: routine.id,
            gunler: days.sort((a, b) => a - b),
            saat: startTime ? startTime.substring(0, 5) : '',
            baslangicSaati: startTime,
            bitisSaati: endTime ? endTime.substring(0, 5) : '',
            bitis_saati: endTime,
            programTipi: routine.program_tipi || routine.programTipi || 'soru_cozum',
            ders: routine.ders || '',
            konu: routine.konu || '',
            kaynak: routine.kaynak || '',
            aciklama: routine.aciklama || '',
            soruSayisi: routine.soru_sayisi ?? routine.soruSayisi ?? null,
            aktif: routine.aktif !== undefined ? Number(routine.aktif) : 1
          };
        });
        setRoutines(normalized);
      }
    } catch (error) {
      console.error('Rutinler yüklenemedi:', error);
    }
  };

  const fetchTeacherAnalysis = useCallback(async () => {
    if (!student?.id || !teacherId || !weekStartIso) {
      setTeacherAnalysis('');
      setAiAnalysis('');
      return;
    }

    setAnalysisLoading(true);
    setTeacherAnalysisMessageType('success');
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_student_analysis.php?studentId=${student.id}&teacherId=${teacherId}&weekStart=${weekStartIso}`
      );
      if (data.success) {
        setTeacherAnalysis(data.teacherComment || '');
        setAiAnalysis(data.aiComment || '');
      } else {
        setTeacherAnalysis('');
        setAiAnalysis('');
      }
    } catch (error) {
      console.error('Analiz yorumları yüklenemedi:', error);
      setTeacherAnalysis('');
      setAiAnalysis('');
    } finally {
      setAnalysisLoading(false);
    }
  }, [student?.id, teacherId, weekStartIso]);

  useEffect(() => {
    setTeacherAnalysisMessage('');
    setTeacherAnalysisMessageType('success');
    fetchTeacherAnalysis();
  }, [fetchTeacherAnalysis]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target) &&
        exportButtonRef.current &&
        !exportButtonRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  useEffect(() => {
    if (!exportImportMessage) return;
    const timer = setTimeout(() => {
      setExportImportMessage('');
      setExportImportMessageType('success');
    }, 5000);
    return () => clearTimeout(timer);
  }, [exportImportMessage]);

  const fetchTemplates = async () => {
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/get_program_templates.php?teacherId=${teacherId}`
      );
      
      if (data.success && data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error);
    }
  };

  const handlePrevWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  const handleYapildiClick = (prog) => {
    // Öğretmen veya öğrenci fark etmeksizin, soru çözümü veya konu anlatımı ise sonuç kontrolü yap
    if (prog?.program_tipi === 'soru_cozum' || prog?.program_tipi === 'konu_anlatim') {
      const originalInputs = {
        dogru: (prog.dogru !== null && prog.dogru !== undefined && prog.dogru !== '') ? parseInt(prog.dogru) || 0 : 0,
        yanlis: (prog.yanlis !== null && prog.yanlis !== undefined && prog.yanlis !== '') ? parseInt(prog.yanlis) || 0 : 0,
        bos: (prog.bos !== null && prog.bos !== undefined && prog.bos !== '') ? parseInt(prog.bos) || 0 : 0
      };
      const currentInputs = statusInputs[prog.id] || {};
      const d = currentInputs.dogru !== undefined && currentInputs.dogru !== '' ? parseInt(currentInputs.dogru) || 0 : originalInputs.dogru;
      const y = currentInputs.yanlis !== undefined && currentInputs.yanlis !== '' ? parseInt(currentInputs.yanlis) || 0 : originalInputs.yanlis;
      const b = currentInputs.bos !== undefined && currentInputs.bos !== '' ? parseInt(currentInputs.bos) || 0 : originalInputs.bos;
      const toplam = (d || 0) + (y || 0) + (b || 0);
      
      if (toplam === 0) {
        setValidationPopup({ visible: true, message: 'Veri girin' });
        setShakeStatusProgramId(prog.id);
        setTimeout(() => setShakeStatusProgramId(null), 700);
        return;
      }
    }
    handleStatusUpdate(prog, 'yapildi');
  };

  const openResultPopup = (prog) => {
    const originalInputs = {
      dogru: (prog.dogru !== null && prog.dogru !== undefined && prog.dogru !== '') ? String(prog.dogru) : '',
      yanlis: (prog.yanlis !== null && prog.yanlis !== undefined && prog.yanlis !== '') ? String(prog.yanlis) : '',
      bos: (prog.bos !== null && prog.bos !== undefined && prog.bos !== '') ? String(prog.bos) : ''
    };
    const currentInputs = statusInputs[prog.id] || originalInputs;
    setResultPopupProgram(prog);
    setResultPopupInputs(currentInputs);
  };

  const closeResultPopup = () => {
    setResultPopupProgram(null);
    setResultPopupInputs({ dogru: '', yanlis: '', bos: '' });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedAciklama.size > 0) {
        setExpandedAciklama(new Set());
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expandedAciklama]);

  const toggleAciklama = (programId) => {
    setExpandedAciklama(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const handleZoomIn = () => {
    setCalendarScale(prev => Math.min(1.4, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setCalendarScale(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))));
  };

  const handleResultChange = (programId, field, value) => {
    // Allow only numbers
    if (value && !/^\d*$/.test(value)) return;
    
    setStatusInputs(prev => ({
      ...prev,
      [programId]: {
        ...(prev[programId] || { 
            dogru: programs.find(p => p.id === programId)?.dogru || '',
            yanlis: programs.find(p => p.id === programId)?.yanlis || '',
            bos: programs.find(p => p.id === programId)?.bos || ''
        }),
        [field]: value
      }
    }));
  };

  const handleResultBlur = (program) => {
    const inputs = statusInputs[program.id];
    if (!inputs) return; // No changes made
    
    const dogru = inputs.dogru !== undefined ? inputs.dogru : program.dogru;
    const yanlis = inputs.yanlis !== undefined ? inputs.yanlis : program.yanlis;
    const bos = inputs.bos !== undefined ? inputs.bos : program.bos;
    
    // Calculate new status locally
    const tempProg = { ...program, dogru, yanlis, bos };
    const newStatus = calculateStatus(tempProg);
    
    handleStatusUpdate(program, newStatus, dogru, yanlis, bos);
  };

  const handleAddProgramClick = (day) => {
    setAddingProgramDay(day);
    setProgramForm({
      programTipi: 'soru_cozum',
      ders: '',
      konu: '',
      kaynak: '',
      aciklama: '',
      hasYoutubeLinki: false,
      youtubeLinki: '',
      soruSayisi: '',
      baslangicSaati: '',
      bitisSaati: '',
      etutSuresi: defaultEtutDuration,
      isManualKonu: false
    });
  };

  useEffect(() => {
    if (addingProgramDay && addProgramFormRef.current) {
      addProgramFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [addingProgramDay]);

  useEffect(() => {
    if (editingProgram && editProgramFormRef.current) {
      editProgramFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [editingProgram]);

  const handleCancelAddProgram = () => {
    setAddingProgramDay(null);
    setProgramForm({
      programTipi: 'soru_cozum',
      ders: '',
      konu: '',
      kaynak: '',
      aciklama: '',
      hasYoutubeLinki: false,
      youtubeLinki: '',
      soruSayisi: '',
      baslangicSaati: '',
      bitisSaati: '',
      etutSuresi: defaultEtutDuration,
      isManualKonu: false
    });
  };

  const handleEtutDurationChange = (value, { persistDefault = true } = {}) => {
    const parsed = parseInt(value, 10);
    setProgramForm((prev) => {
      const durationValue = Number.isFinite(parsed) && parsed > 0 ? parsed : '';
      const updated = {
        ...prev,
        etutSuresi: durationValue
      };
      if (prev.baslangicSaati && durationValue) {
        updated.bitisSaati = addMinutesToTime(prev.baslangicSaati, durationValue);
      }
      return updated;
    });
    if (persistDefault && Number.isFinite(parsed) && parsed > 0) {
      setDefaultEtutDuration(parsed);
      persistEtutDuration(teacherId, parsed);
    }
  };

  const handleStartTimeChange = (value) => {
    setProgramForm((prev) => {
      const updated = {
        ...prev,
        baslangicSaati: value
      };
      if (value && prev.etutSuresi) {
        updated.bitisSaati = addMinutesToTime(value, prev.etutSuresi);
      } else if (!value) {
        updated.bitisSaati = '';
      }
      return updated;
    });
  };

  const handleStartTimeBlur = (targetRef) => {
    if (targetRef?.current && programForm.baslangicSaati && programForm.baslangicSaati.length === 5) {
      targetRef.current.focus();
    }
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    
    if (!addingProgramDay) return;

    try {
      const programData = {
        studentId: student.id,
        teacherId: teacherId,
        tarih: addingProgramDay.toISOString().split('T')[0],
        programTipi: programForm.programTipi,
        ders: programForm.ders,
        konu: programForm.konu || null,
        kaynak: programForm.kaynak || null,
        aciklama: programForm.aciklama || null,
        youtubeLinki: programForm.hasYoutubeLinki && programForm.youtubeLinki ? programForm.youtubeLinki.trim() : null,
        soruSayisi: programForm.soruSayisi ? parseInt(programForm.soruSayisi) : null,
        baslangicSaati: programForm.baslangicSaati,
        bitisSaati: programForm.bitisSaati
      };

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/save_student_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(programData)
        }
      );
      
      if (data.success) {
        handleCancelAddProgram();
        fetchStudentProgram();
      } else {
        alert(data.message || 'Program kaydedilemedi');
      }
    } catch (error) {
      console.error('Program kaydedilemedi:', error);
      alert('Program kaydedilemedi');
    }
  };

  const handleDeleteProgram = async (
    programId,
    isRoutineInstance = false,
    targetDate = null,
    routineId = null,
    studentId = null
  ) => {
    const confirmMessage = isRoutineInstance
      ? 'Bu rutin görev sadece bu haftadan kaldırılacak. Devam etmek istiyor musunuz?'
      : 'Bu programı silmek istediğinize emin misiniz?';
    if (!window.confirm(confirmMessage)) return;

    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/delete_student_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            isRoutineInstance && targetDate && routineId && studentId
              ? {
                  programId,
                  isRoutineInstance: true,
                  targetDate,
                  routineId,
                  ogrenciId: studentId
                }
              : { programId }
          )
        }
      );
      
      if (data.success) {
        fetchStudentProgram();
      } else {
        alert(data.message || 'Program silinemedi');
      }
    } catch (error) {
      console.error('Program silinemedi:', error);
      alert('Program silinemedi');
    }
  };

  const handleEditProgram = (program) => {
    if (program?.is_routine) {
      alert('Rutin görevler program üzerinden düzenlenemez. Rutin listesi üzerinden güncelleyin.');
      return;
    }
    setEditingProgram(program);
    const startTime = (program.baslangic_saati || '').substring(0, 5);
    const endTime = (program.bitis_saati || '').substring(0, 5);
    const programDuration = calculateDurationBetweenTimes(startTime, endTime) || defaultEtutDuration;
    const youtubeLinki = program.youtube_linki || '';
    setProgramForm({
      programTipi: program.program_tipi,
      ders: program.ders,
      konu: program.konu || '',
      kaynak: program.kaynak || '',
      aciklama: program.aciklama || '',
      hasYoutubeLinki: !!youtubeLinki,
      youtubeLinki: youtubeLinki,
      soruSayisi: program.soru_sayisi || '',
      baslangicSaati: startTime,
      bitisSaati: endTime,
      etutSuresi: programDuration,
      isManualKonu: false
    });
    
    // Konuları çek
    if (program.ders) {
      fetchTopicsForSubject(program.ders);
    }
  };

  const handleCancelEdit = () => {
    setEditingProgram(null);
    setProgramForm({
      programTipi: 'soru_cozum',
      ders: '',
      konu: '',
      kaynak: '',
      aciklama: '',
      hasYoutubeLinki: false,
      youtubeLinki: '',
      soruSayisi: '',
      baslangicSaati: '',
      bitisSaati: '',
      etutSuresi: defaultEtutDuration,
      isManualKonu: false
    });
  };

  const handleStatusUpdate = async (program, newStatus, dogru = null, yanlis = null, bos = null) => {
    if (!program?.id || !student?.id) return;

    const payload = {
      programId: program.id,
      status: newStatus
    };

    // Soru çözümü veya konu anlatımı için doğru/yanlış/boş değerlerini ekle
    if (program.program_tipi === 'soru_cozum' || program.program_tipi === 'konu_anlatim') {
      // Değerler her zaman gönderilmeli (0 değeri de geçerli)
      payload.dogru = dogru !== null && dogru !== undefined ? parseInt(dogru) : 0;
      payload.yanlis = yanlis !== null && yanlis !== undefined ? parseInt(yanlis) : 0;
      payload.bos = bos !== null && bos !== undefined ? parseInt(bos) : 0;
    }

    if (program.is_routine) {
      payload.isRoutineInstance = true;
      payload.targetDate = program.tarih;
      payload.routineId = program.routine_id;
      payload.ogrenciId = program.ogrenci_id;
    }

    console.log('Gönderilen payload:', payload);
    console.log('Program tipi:', program.program_tipi);
    console.log('Dogru/Yanlis/Bos:', dogru, yanlis, bos);

    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/update_student_program_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (data.success) {
        // Programları yeniden yükle - fetchStudentProgram zaten statusInputs'i güncelleyecek
        fetchStudentProgram();
        setOpenStatusDropdown(null);
      } else {
        alert(data.message || 'Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      alert('Durum güncellenemedi');
    }
  };

  // Durum hesaplama fonksiyonu
  const calculateStatus = (program) => {
    // Eğer soru çözümü veya konu anlatımı değilse, direkt durumu döndür
    if ((program.program_tipi !== 'soru_cozum' && program.program_tipi !== 'konu_anlatim') || !program.soru_sayisi) {
      return program.durum || 'yapilmadi';
    }

    // Doğru, yanlış ve boş değerlerini al
    const dogru = program.dogru !== null && program.dogru !== undefined ? parseInt(program.dogru) || 0 : 0;
    const yanlis = program.yanlis !== null && program.yanlis !== undefined ? parseInt(program.yanlis) || 0 : 0;
    const bos = program.bos !== null && program.bos !== undefined ? parseInt(program.bos) || 0 : 0;
    const soruSayisi = parseInt(program.soru_sayisi) || 0;

    // Toplam hesapla
    const toplam = dogru + yanlis + bos;

    // Validasyon: Toplam soru sayısını geçemez
    if (toplam > soruSayisi) {
      // Eğer toplam soru sayısını geçiyorsa, durumu koru veya eksik yapıldı olarak işaretle
      return program.durum || 'eksik_yapildi';
    }

    // 1. Doğru + Yanlış + Boş = Soru Sayısı → Yapıldı
    if (toplam === soruSayisi && soruSayisi > 0) {
      return 'yapildi';
    }

    // 2. Doğru + Yanlış + Boş < Soru Sayısı (ama > 0) → Eksik Yapıldı
    if (toplam > 0 && toplam < soruSayisi) {
      return 'eksik_yapildi';
    }

    // 3. Hiç girilmemişse (toplam = 0) → Yapılmadı
    if (toplam === 0) {
      return 'yapilmadi';
    }

    // Varsayılan durum
    return program.durum || 'yapilmadi';
  };

  const handleClearWeekProgram = async () => {
    if (!programs.length) {
      alert('Silinecek haftalık program bulunamadı.');
      return;
    }

    if (!window.confirm('Bu haftadaki tüm programları silmek istediğinize emin misiniz?')) {
      return;
    }

    setClearingWeek(true);
    try {
      await Promise.all(
        programs.map((prog) => {
          const isRoutine = !!prog.is_routine;
          const payload = isRoutine && prog.routine_id && prog.tarih && prog.ogrenci_id
            ? {
                programId: prog.id,
                isRoutineInstance: true,
                targetDate: prog.tarih,
                routineId: prog.routine_id,
                ogrenciId: prog.ogrenci_id
              }
            : { programId: prog.id };
          
          return safeFetchJson(`${API_BASE}/php-backend/api/delete_student_program.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        })
      );
      fetchStudentProgram();
    } catch (error) {
      console.error('Programlar silinemedi:', error);
      alert('Programlar silinemedi');
    } finally {
      setClearingWeek(false);
    }
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    
    if (!editingProgram) return;

    try {
      const programData = {
        programId: editingProgram.id,
        tarih: editingProgram.tarih,
        programTipi: programForm.programTipi,
        ders: programForm.ders,
        konu: programForm.konu || null,
        kaynak: programForm.kaynak || null,
        aciklama: programForm.aciklama ? programForm.aciklama.trim() : null,
        youtubeLinki: programForm.hasYoutubeLinki && programForm.youtubeLinki ? programForm.youtubeLinki.trim() : null,
        soruSayisi: programForm.soruSayisi ? parseInt(programForm.soruSayisi) : null,
        baslangicSaati: programForm.baslangicSaati,
        bitisSaati: programForm.bitisSaati
      };

      console.log('Güncellenecek program verisi:', programData);

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/update_student_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(programData)
        }
      );
      
      console.log('API yanıtı:', data);
      
      if (data.success) {
        handleCancelEdit();
        fetchStudentProgram();
      } else {
        console.error('Güncelleme hatası:', data.message);
        alert(data.message || 'Program güncellenemedi');
      }
    } catch (error) {
      console.error('Program güncellenemedi:', error);
      alert('Program güncellenemedi');
    }
  };

  const handleCopyProgram = async (program) => {
    try {
      const programData = {
        studentId: student.id,
        teacherId: teacherId,
        tarih: program.tarih,
        programTipi: program.program_tipi,
        ders: program.ders,
        konu: program.konu || null,
        kaynak: program.kaynak || null,
        aciklama: program.aciklama || null,
        youtubeLinki: program.youtube_linki || null,
        soruSayisi: program.soru_sayisi || null,
        baslangicSaati: program.baslangic_saati,
        bitisSaati: program.bitis_saati
      };

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/save_student_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(programData)
        }
      );
      
      if (data.success) {
        fetchStudentProgram();
      } else {
        alert(data.message || 'Program kopyalanamadı');
      }
    } catch (error) {
      console.error('Program kopyalanamadı:', error);
      alert('Program kopyalanamadı');
    }
  };

  const formatRoutineDays = (days = []) => {
    if (!days.length) return 'Gün seçilmedi';
    return days
      .slice()
      .sort((a, b) => a - b)
      .map((day) => DAY_LABELS_SHORT[day] || day)
      .join(', ');
  };

  const openRoutineModal = () => {
    setRoutineForm(createEmptyRoutineForm());
    setRoutineError('');
    setRoutineModalMode('list');
    setEditingRoutine(null);
    setShowRoutineModal(true);
  };

  const closeRoutineModal = () => {
    setShowRoutineModal(false);
    setRoutineError('');
    setRoutineModalMode('list');
    setEditingRoutine(null);
    setRoutineForm(createEmptyRoutineForm());
  };

  const startRoutineCreation = () => {
    setRoutineForm(createEmptyRoutineForm());
    setRoutineError('');
    setEditingRoutine(null);
    setRoutineModalMode('form');
  };

  const startRoutineEdit = (routine) => {
    if (!routine) return;
    setEditingRoutine(routine);
    setRoutineForm({
      gunler: routine.gunler || [],
      saat: (routine.saat || routine.baslangic_saati || '').substring(0, 5),
      bitisSaati: (routine.bitisSaati || routine.bitis_saati || '').substring(0, 5),
      programTipi: routine.programTipi || routine.program_tipi || 'soru_cozum',
      ders: routine.ders || '',
      konu: routine.konu || '',
      kaynak: routine.kaynak || '',
      aciklama: routine.aciklama || '',
      soruSayisi: routine.soruSayisi || routine.soru_sayisi ? String(routine.soruSayisi || routine.soru_sayisi) : ''
    });
    setRoutineError('');
    setRoutineModalMode('form');
  };

  const returnToRoutineList = () => {
    setRoutineModalMode('list');
    setEditingRoutine(null);
    setRoutineError('');
    setRoutineForm(createEmptyRoutineForm());
  };

  const handleRoutineDayToggle = (dayValue) => {
    setRoutineForm((prev) => {
      const exists = prev.gunler.includes(dayValue);
      const updated = exists
        ? prev.gunler.filter((day) => day !== dayValue)
        : [...prev.gunler, dayValue];
      return {
        ...prev,
        gunler: updated.sort((a, b) => a - b)
      };
    });
  };

  const handleRoutineFormChange = (e) => {
    const { name, value } = e.target;
    setRoutineForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'ders') {
      fetchTopicsForSubject(value);
    }
  };

  const handleRoutineSubmit = async (e) => {
    e.preventDefault();
    // effectiveStudentId kullan, yoksa student.id'ye fallback yap
    const targetStudentId = effectiveStudentId || student?.id;
    
    if (!targetStudentId || !teacherId) {
      setRoutineError('Öğrenci veya öğretmen bilgisi bulunamadı.');
      return;
    }

    if (!routineForm.gunler.length) {
      setRoutineError('En az bir gün seçmelisiniz.');
      return;
    }

    if (!routineForm.saat) {
      setRoutineError('Başlangıç saati seçmelisiniz.');
      return;
    }

    if (!routineForm.bitisSaati) {
      setRoutineError('Bitiş saati seçmelisiniz.');
      return;
    }

    const routineDuration = calculateDurationBetweenTimes(routineForm.saat, routineForm.bitisSaati);
    if (!routineDuration) {
      setRoutineError('Bitiş saati başlangıç saatinden sonra olmalı.');
      return;
    }

    if (!routineForm.ders) {
      setRoutineError('Bir ders seçmelisiniz.');
      return;
    }

    setRoutineSaving(true);
    setRoutineError('');

    try {
      // Rutin mantığı değiştirildi: Artık kalıcı bir rutin kaydı oluşturmak yerine,
      // sadece BU HAFTA için seçilen günlere tekil programlar ekleniyor.
      // Bu sayede "Rutin eklendiğinde sadece o haftaya özel olacak" isteği karşılanıyor.

      // Seçilen günlerin bu haftadaki tarihlerini bul
      const selectedDates = [];
      weekDays.forEach(date => {
        let jsDay = date.getDay();
        if (jsDay === 0) jsDay = 7; // Pazar: 0 -> 7
        if (routineForm.gunler.includes(jsDay)) {
          selectedDates.push(date);
        }
      });

      if (selectedDates.length === 0) {
        setRoutineError('Seçilen günler bu haftada bulunamadı.');
        setRoutineSaving(false);
        return;
      }

      const promises = selectedDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const payload = {
          studentId: targetStudentId,
          teacherId,
          tarih: dateStr,
          baslangicSaati: routineForm.saat,
          bitisSaati: routineForm.bitisSaati,
          programTipi: routineForm.programTipi,
          ders: routineForm.ders,
          konu: routineForm.konu || null,
          kaynak: routineForm.kaynak || null,
          aciklama: routineForm.aciklama || null,
          soruSayisi: routineForm.soruSayisi ? parseInt(routineForm.soruSayisi, 10) : null
        };
        
        return safeFetchJson(`${API_BASE}/php-backend/api/save_student_program.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        await fetchStudentProgram();
        setRoutineForm(createEmptyRoutineForm());
        setEditingRoutine(null);
        // Modalı kapat çünkü listeye eklenecek bir rutin kaydı oluşmadı
        setShowRoutineModal(false);
        alert('Programlar bu hafta için eklendi.');
      } else {
        setRoutineError('Bazı programlar kaydedilemedi.');
      }
    } catch (error) {
      console.error('Rutin (Toplu Program) kaydedilemedi:', error);
      setRoutineError('Programlar kaydedilemedi.');
    } finally {
      setRoutineSaving(false);
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    if (!window.confirm('Bu rutini silmek istediğinize emin misiniz?')) return;
    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/delete_student_routine.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ routineId })
        }
      );
      if (data.success) {
        fetchStudentRoutines();
        fetchStudentProgram();
        if (editingRoutine?.id === routineId) {
          returnToRoutineList();
          setRoutineForm(createEmptyRoutineForm());
        }
        setRoutineError('');
      } else {
        const message = data.message || 'Rutin silinemedi.';
        if (showRoutineModal) {
          setRoutineError(message);
        } else {
          alert(message);
        }
      }
    } catch (error) {
      console.error('Rutin silinemedi:', error);
      if (showRoutineModal) {
        setRoutineError('Rutin silinemedi.');
      } else {
      alert('Rutin silinemedi.');
      }
    }
  };

  const handleDragStart = (e, program) => {
    if (readOnly) return;
    setDraggedProgram(program);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetDay) => {
    if (readOnly) return;
    e.preventDefault();
    
    if (!draggedProgram) return;

    const targetDate = targetDay.toISOString().split('T')[0];
    
    // Eğer aynı güne bırakılıyorsa, sadece tarihi güncelle
    if (draggedProgram.tarih === targetDate) {
      setDraggedProgram(null);
      return;
    }

    try {
      const programData = {
        programId: draggedProgram.id,
        tarih: targetDate,
        programTipi: draggedProgram.program_tipi,
        ders: draggedProgram.ders,
        konu: draggedProgram.konu || null,
        soruSayisi: draggedProgram.soru_sayisi || null,
        baslangicSaati: draggedProgram.baslangic_saati,
        bitisSaati: draggedProgram.bitis_saati
      };

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/update_student_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(programData)
        }
      );

      if (data.success) {
        fetchStudentProgram();
      } else {
        alert(data.message || 'Program taşınamadı');
      }
    } catch (error) {
      console.error('Program taşınamadı:', error);
      alert('Program taşınamadı');
    }
    
    setDraggedProgram(null);
  };

  const handleApplyTemplate = async (templateId) => {
    if (!window.confirm('Bu şablonu öğrenciye uygulamak istediğinize emin misiniz? Mevcut programlar korunacak.')) return;

    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/apply_template_to_student.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            templateId,
            studentId: student.id,
            teacherId: teacherId,
            startDate: weekDays[0].toISOString().split('T')[0]
          })
        }
      );

      if (data.success) {
        setShowTemplateList(false);
        await fetchStudentProgram();
        await fetchStudentRoutines();
        alert('Şablon başarıyla uygulandı');
      } else {
        alert(data.message || 'Şablon uygulanamadı');
      }
    } catch (error) {
      console.error('Şablon uygulanamadı:', error);
      alert('Şablon uygulanamadı');
    }
  };

  const handleSaveCurrentProgramAsTemplate = async () => {
    const templateName = prompt('Şablon adını girin:');
    if (!templateName || !templateName.trim()) {
      return;
    }

    const templateDescription = prompt('Şablon açıklaması (isteğe bağlı):') || '';

    try {
      const startDate = weekDays[0].toISOString().split('T')[0];
      const endDate = weekDays[6].toISOString().split('T')[0];
      
      // Normal programları filtrele (rutin olmayanlar)
      const currentPrograms = programs.filter(p => 
        p.tarih >= startDate && p.tarih <= endDate && !p.is_routine
      );

      // Aktif rutin görevleri al
      const activeRoutines = routines.filter(r => r.aktif === 1 || r.aktif === true);

      if (currentPrograms.length === 0 && activeRoutines.length === 0) {
        alert('Kaydedilecek program veya rutin görev bulunamadı.');
        return;
      }

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/save_current_program_as_template.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teacherId: teacherId,
            templateName: templateName.trim(),
            templateDescription: templateDescription.trim(),
            programs: currentPrograms.map(prog => ({
              gunNo: weekDays.findIndex(d => d.toISOString().split('T')[0] === prog.tarih) + 1,
              programTipi: prog.program_tipi,
              ders: prog.ders,
              konu: prog.konu || null,
              kaynak: prog.kaynak || null,
              aciklama: prog.aciklama || null,
              soruSayisi: prog.soru_sayisi || null,
              baslangicSaati: prog.baslangic_saati,
              bitisSaati: prog.bitis_saati
            })),
            routines: activeRoutines.map(routine => ({
              gunler: routine.gunler || [],
              baslangicSaati: routine.baslangic_saati || routine.saat || null,
              bitisSaati: routine.bitis_saati || routine.bitisSaati || null,
              programTipi: routine.program_tipi || routine.programTipi,
              ders: routine.ders,
              konu: routine.konu || null,
              kaynak: routine.kaynak || null,
              aciklama: routine.aciklama || null,
              soruSayisi: routine.soru_sayisi || routine.soruSayisi || null
            }))
          })
        }
      );

      if (data.success) {
        setShowTemplateList(false);
        fetchTemplates();
        alert('Mevcut program şablon olarak kaydedildi');
      } else {
        alert(data.message || 'Şablon kaydedilemedi');
      }
    } catch (error) {
      console.error('Şablon kaydedilemedi:', error);
      alert('Şablon kaydedilemedi');
    }
  };

  const handleLoadPreviousWeekProgram = async () => {
    if (!window.confirm('Geçen haftanın programını bu haftaya kopyalamak istediğinize emin misiniz? Mevcut programlar korunacak.')) {
      return;
    }

    try {
      const previousWeekStart = new Date(weekDays[0]);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/copy_previous_week_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: student.id,
            teacherId: teacherId,
            previousWeekStart: previousWeekStart.toISOString().split('T')[0],
            previousWeekEnd: previousWeekEnd.toISOString().split('T')[0],
            currentWeekStart: weekDays[0].toISOString().split('T')[0]
          })
        }
      );

      if (data.success) {
        setShowTemplateList(false);
        fetchStudentProgram();
        alert('Geçen haftanın programı bu haftaya kopyalandı');
      } else {
        alert(data.message || 'Program kopyalanamadı');
      }
    } catch (error) {
      console.error('Program kopyalanamadı:', error);
      alert('Program kopyalanamadı');
    }
  };

  const handleSaveTeacherAnalysis = async () => {
    if (!student?.id || !teacherId || !weekStartIso) return;

    setTeacherAnalysisSaving(true);
    setTeacherAnalysisMessage('');
    setTeacherAnalysisMessageType('success');

    try {
      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/save_student_analysis.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: student.id,
            teacherId,
            weekStart: weekStartIso,
            teacherComment: teacherAnalysis
          })
        }
      );

      if (data.success) {
        setTeacherAnalysisMessage('Yorum kaydedildi.');
        setTeacherAnalysisMessageType('success');
        await fetchTeacherAnalysis();
      } else {
        setTeacherAnalysisMessage(data.message || 'Yorum kaydedilemedi.');
        setTeacherAnalysisMessageType('error');
      }
    } catch (error) {
      console.error('Öğretmen analizi kaydedilemedi:', error);
      setTeacherAnalysisMessage('Yorum kaydedilemedi.');
      setTeacherAnalysisMessageType('error');
    } finally {
      setTeacherAnalysisSaving(false);
      setTimeout(() => {
        setTeacherAnalysisMessage('');
        setTeacherAnalysisMessageType('success');
      }, 4000);
    }
  };

  const handleOpenAiAnalysis = () => {
    if (!student) return;

    // Öğrenciyi benzersiz tanımlamak için id / _id / email / name sırasıyla kullan
    const key =
      student.id ||
      student._id ||
      student.email ||
      student.name ||
      (student.firstName && student.lastName
        ? `${student.firstName}_${student.lastName}`
        : 'unknown');

    // Bu haftanın başarı yüzdesini hesapla
    const thisWeekStart = new Date(currentWeek);
    const day = thisWeekStart.getDay();
    const diff = thisWeekStart.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    thisWeekStart.setDate(diff);
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);

    let total = 0;
    let completed = 0;
    let partial = 0;

    programs.forEach((prog) => {
      if (!prog.tarih) return;
      const d = new Date(prog.tarih);
      if (Number.isNaN(d.getTime())) return;
      if (d < thisWeekStart || d > thisWeekEnd) return;

      total += 1;
      const status = prog.durum || prog.status || 'yapilmadi';
      if (status === 'yapildi') completed += 1;
      else if (status === 'eksik_yapildi') partial += 1;
    });

    let weeklyGoal = 0;
    if (total > 0) {
      const score = (completed + partial * 0.5) / total;
      weeklyGoal = Math.round(score * 100);
    }

    const aiStudent = {
      ...student,
      weeklyGoal
    };

    try {
      localStorage.setItem(`student_ai_${key}`, JSON.stringify(aiStudent));
    } catch (e) {
      // localStorage hatasını sessizce yut
    }

    // Yeni sekmede AI panelini aç
    window.open(`/ogrenci-ai/${encodeURIComponent(key)}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenTeacherAnalysis = () => {
    setShowTopicAnalysisModal(true);
  };

  // Draggable modal için
  useEffect(() => {
    if (!showTopicAnalysisModal || !topicAnalysisModalRef.current || !topicAnalysisModalHeaderRef.current) return;

    const modal = topicAnalysisModalRef.current;
    const header = topicAnalysisModalHeaderRef.current;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e) => {
      // İlk sürüklemede merkezden konumlanan transform'u kaldır
      if (modal.style.transform) {
        const rect = modal.getBoundingClientRect();
        modal.style.transform = 'none';
        modal.style.left = `${rect.left}px`;
        modal.style.top = `${rect.top}px`;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = modal.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      modal.style.left = `${initialX + deltaX}px`;
      modal.style.top = `${initialY + deltaY}px`;
      modal.style.right = 'auto';
      modal.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    header.addEventListener('mousedown', handleMouseDown);

    return () => {
      header.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showTopicAnalysisModal]);

  // Resizable modal için
  useEffect(() => {
    if (!showTopicAnalysisModal || !topicAnalysisModalRef.current || !topicAnalysisModalResizeRef.current) return;

    const modal = topicAnalysisModalRef.current;
    const resizeHandle = topicAnalysisModalResizeRef.current;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const handleMouseDown = (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(window.getComputedStyle(modal).width, 10);
      startHeight = parseInt(window.getComputedStyle(modal).height, 10);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(600, startWidth + deltaX);
      const newHeight = Math.max(400, startHeight + deltaY);
      modal.style.width = `${newWidth}px`;
      modal.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    resizeHandle.addEventListener('mousedown', handleMouseDown);

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
  };
  }, [showTopicAnalysisModal]);

  const handleToggleExportMenu = () => {
    setShowExportMenu((prev) => !prev);
  };

  const handleExportProgram = async () => {
    if (!student?.id || !teacherId || weekDays.length < 1) {
      setExportImportMessageType('error');
      setExportImportMessage('Öğrenci veya hafta bilgisi bulunamadı.');
      return;
    }

    const startDate = weekDays[0].toISOString().split('T')[0];
    const endDate = weekDays[weekDays.length - 1].toISOString().split('T')[0];

    setExportLoading(true);
    setExportImportMessage('');

    try {
      const response = await fetch(
        `${API_BASE}/php-backend/api/export_student_program.php?studentId=${student.id}&teacherId=${teacherId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        let message = 'Program dışa aktarılamadı.';
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || message;
        } catch (jsonError) {
          if (text) message = text;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeStudentId = student.id.slice(0, 8);
      link.href = downloadUrl;
      link.download = `ogrenci_program_${safeStudentId}_${startDate}_${endDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportImportMessageType('success');
      setExportImportMessage('Program başarıyla dışa aktarıldı.');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Program dışa aktarılamadı:', error);
      setExportImportMessageType('error');
      setExportImportMessage(error.message || 'Program dışa aktarılamadı.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportClick = () => {
    if (importLoading) return;
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!student?.id || !teacherId) {
      setExportImportMessageType('error');
      setExportImportMessage('Öğrenci veya öğretmen bilgisi bulunamadı.');
      event.target.value = '';
      return;
    }

    setImportLoading(true);
    setExportImportMessage('');

    try {
      const fileContent = await file.text();
      const parsedData = JSON.parse(fileContent);

      const data = await safeFetchJson(
        `${API_BASE}/php-backend/api/import_student_program.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: student.id,
            teacherId,
            replaceExisting: true,
            importData: parsedData
          })
        }
      );

      if (data.success) {
        setExportImportMessageType('success');
        setExportImportMessage('Program başarıyla içe aktarıldı.');
        setShowExportMenu(false);
        fetchStudentProgram();
        fetchStudentRoutines();
      } else {
        throw new Error(data.message || 'Program içe aktarılamadı.');
      }
    } catch (error) {
      console.error('Program içe aktarılamadı:', error);
      setExportImportMessageType('error');
      setExportImportMessage(error.message || 'Program içe aktarılamadı.');
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Günün programlarını getir
  const getDayPrograms = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return programs.filter(p => p.tarih === dateStr);
  };

  const getStatusLabel = (status) => {
    if (status === 'yapildi') return 'Yapıldı';
    if (status === 'eksik_yapildi') return 'Eksik Yapıldı';
    if (status === 'yapilmadi') return 'Yapılmadı';
    return 'Yapılacak';
  };

  const renderPrintProgramCard = (prog, idx) => {
    const startTime = (prog.baslangic_saati || '').substring(0, 5);
    const endTime = prog.bitis_saati ? prog.bitis_saati.substring(0, 5) : '';
    const status = prog.durum || 'yapilmadi';
    const ders = prog.ders || '';
    const konu = prog.konu;
    const kaynak = prog.kaynak;
    const aciklama = prog.aciklama;
    const youtubeLinki = prog.youtube_linki;
    const soruSayisi = prog.soru_sayisi || prog.soruSayisi;
    const programTipi = prog.program_tipi || prog.programTipi || 'soru_cozum';
    const isRoutine = !!prog.is_routine;

    return (
      <div
        key={`print-${prog.id || idx}-${prog.tarih}-${startTime}-${endTime}`}
        className={`program-item program-item-print${isRoutine ? ' program-item-routine' : ''}`}
        style={{
          background: getGradientBackground(getProgramColor(prog))
        }}
      >
        <div className="program-item-time">
          {startTime}
          {endTime ? ` - ${endTime}` : ''}
        </div>
        <div className="program-item-subject">
          <div className="program-item-ders-row">
            {(() => {
              const iconSrc = getSubjectIcon(ders);
              return iconSrc ? (
                <img 
                  src={iconSrc} 
                  alt="" 
                  className="program-item-ders-icon"
                  onError={(e) => {
                    console.error('Görsel yüklenemedi:', iconSrc, ders);
                    e.target.style.display = 'none';
                  }}
                />
              ) : null;
            })()}
            <span className="program-item-ders">{ders}</span>
          </div>
          {konu && <span className="program-item-konu">{konu}</span>}
        </div>
        <div className="program-item-details">
          <div className="program-item-type">
            <div className="program-item-type-title">
              <span>
                {isRoutine ? 'Rutin · ' : ''}
                {programTipi === 'deneme'
                  ? 'Deneme'
                  : programTipi === 'konu_anlatim'
                  ? 'Konu Anlatımı'
                  : 'Soru Çözümü'}
              </span>
            </div>
            {soruSayisi && (
              <span className="program-item-type-count">{soruSayisi} soru</span>
            )}
          </div>
          {kaynak && (
            <div className="program-item-kaynak">
              <FontAwesomeIcon icon={faBook} />
              {kaynak}
            </div>
          )}
          {aciklama && (
            <div className="program-item-aciklama">
              {aciklama}
            </div>
          )}
          {youtubeLinki && (
            <div className="program-item-youtube-link" style={{marginTop: 6}}>
              <a 
                href={youtubeLinki} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#dc2626',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                ▶️ YouTube Video
              </a>
            </div>
          )}
        </div>
        <div className={`program-item-durum durum-${status}`}>
          {getStatusLabel(status)}
        </div>
      </div>
    );
  };

  const renderPrintDayColumn = (day) => {
    const dayPrograms = getDayPrograms(day);
    const dayName = day.toLocaleDateString('tr-TR', { weekday: 'short' });
    const dayNumber = day.toLocaleDateString('tr-TR', { day: 'numeric' });

    return (
      <div key={`print-day-${day.toISOString()}`} className="print-day-column">
        <div className="print-day-header">
          <span className="print-day-name">{dayName}</span>
          <span className="print-day-number">{dayNumber}</span>
        </div>
        <div className="print-day-programs">
          {dayPrograms.length
            ? dayPrograms.map((prog, index) => renderPrintProgramCard(prog, index))
            : <div className="print-empty-day">Program bulunamadı</div>}
        </div>
      </div>
    );
  };

  // Program tipi ikonunu getir
  const getProgramIcon = (tip) => {
    switch (tip) {
      case 'soru_cozum':
        return faClipboardList;
      case 'konu_anlatim':
        return faBook;
      case 'deneme':
        return faFileAlt;
      default:
        return faCalendarAlt;
    }
  };

  // Program tipi rengini getir
  const getProgramColor = (program) => {
    if (!program) return '#6b7280';

    const dersColor = getSubjectColor(program.ders);
    if (dersColor) {
      return dersColor;
    }

    switch (program.program_tipi) {
      case 'soru_cozum':
        return '#3b82f6'; // Mavi
      case 'konu_anlatim':
        return '#10b981'; // Yeşil
      case 'deneme':
        return '#f59e0b'; // Turuncu
      default:
        return '#6b7280';
    }
  };

  // Hex color'ı rgba'ya çevir
  const hexToRgba = (hex, alpha = 0.7) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Gradyan arkaplan oluştur - çok belirgin gradyan (açık renkten koyu renge)
  const getGradientBackground = (color) => {
    // Renk tonlarını ayarla - daha açık ve daha koyu versiyonlar
    const rgb = {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16)
    };
    
    // Açık ton (başlangıç) - rengi %20 açıkla ve opacity 0.75
    const lightR = Math.min(255, rgb.r + (255 - rgb.r) * 0.2);
    const lightG = Math.min(255, rgb.g + (255 - rgb.g) * 0.2);
    const lightB = Math.min(255, rgb.b + (255 - rgb.b) * 0.2);
    const lightColor = `rgba(${Math.round(lightR)}, ${Math.round(lightG)}, ${Math.round(lightB)}, 0.75)`;
    
    // Orta-açık ton - rengi %10 açıkla ve opacity 0.85
    const midLightR = Math.min(255, rgb.r + (255 - rgb.r) * 0.1);
    const midLightG = Math.min(255, rgb.g + (255 - rgb.g) * 0.1);
    const midLightB = Math.min(255, rgb.b + (255 - rgb.b) * 0.1);
    const midLightColor = `rgba(${Math.round(midLightR)}, ${Math.round(midLightG)}, ${Math.round(midLightB)}, 0.85)`;
    
    // Orta ton - orijinal renk, opacity 0.9
    const midColor = hexToRgba(color, 0.9);
    
    // Koyu ton - rengi %15 koyulaştır ve opacity 0.95
    const darkR = Math.max(0, rgb.r * 0.85);
    const darkG = Math.max(0, rgb.g * 0.85);
    const darkB = Math.max(0, rgb.b * 0.85);
    const darkColor = `rgba(${Math.round(darkR)}, ${Math.round(darkG)}, ${Math.round(darkB)}, 0.95)`;
    
    return `linear-gradient(135deg, ${lightColor} 0%, ${midLightColor} 25%, ${midColor} 60%, ${darkColor} 100%)`;
  };

  // Program tipi adını getir
  const getProgramTypeName = (tip) => {
    switch (tip) {
      case 'soru_cozum':
        return 'Soru Çözümü';
      case 'konu_anlatim':
        return 'Konu Anlatımı';
      case 'deneme':
        return 'Deneme';
      default:
        return tip;
    }
  };
  
  // TemplateCreatorModal için helper fonksiyonlar (export edilmeli veya component içinde tanımlanmalı)
  // Bu fonksiyonlar TemplateCreatorModal içinde de kullanılacak

  // Saat slotları (30 dakikalık aralıklar)
  const timeSlots = [];
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + 30;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`;
      timeSlots.push({ start: startTime, end: endTime });
    }
  }

  return (
    <div className="ogrenci-program-tab">
      <div className="program-header">
        <div className="week-navigation">
          <button className="nav-btn" onClick={handlePrevWeek}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="today-btn" onClick={handleToday}>Bugün</button>
          <button className="nav-btn" onClick={handleNextWeek}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <div className="week-range">
            {weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="program-actions">
          <input
            type="file"
            accept="application/json"
            ref={importFileInputRef}
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          {!isStudentPanel && !readOnly ? (
            <>
              <button type="button" className="program-action-btn btn-ai" onClick={handleOpenAiAnalysis}>
                <FontAwesomeIcon icon={faRobot} /> Yapay Zeka AI
              </button>
              <button type="button" className="program-action-btn btn-analysis" onClick={handleOpenTeacherAnalysis}>
                <FontAwesomeIcon icon={faChartLine} /> Konu Başarı Analizi
              </button>
              <button type="button" className="program-action-btn btn-routine" onClick={openRoutineModal}>
                <FontAwesomeIcon icon={faClipboardList} /> Rutin Görevler
              </button>
              <button
                type="button"
                className="program-action-btn btn-template"
                onClick={() => setShowTemplateList(true)}
              >
                <FontAwesomeIcon icon={faCalendarAlt} /> Hazır Şablonlar
              </button>
              <div className="export-import-group" ref={exportMenuRef}>
                <button
                  type="button"
                  className={`program-action-btn btn-export ${showExportMenu ? 'active' : ''}`}
                  onClick={handleToggleExportMenu}
                  ref={exportButtonRef}
                >
                  <span className="export-icons">
                    <FontAwesomeIcon icon={faFileExport} />
                    <FontAwesomeIcon icon={faFileImport} />
                  </span>
                  Dışarı Aktar / İçeri Aktar
                </button>
                {showExportMenu && (
                  <div className="export-dropdown">
                    <button
                      type="button"
                      className="export-dropdown-item"
                      onClick={handleExportProgram}
                      disabled={exportLoading}
                    >
                      {exportLoading ? 'Dışa Aktarılıyor...' : 'Dışarı Aktar'}
                    </button>
                    <button
                      type="button"
                      className="export-dropdown-item"
                      onClick={handleImportClick}
                      disabled={importLoading}
                    >
                      {importLoading ? 'İçe Aktarılıyor...' : 'İçeri Aktar'}
                    </button>
                  </div>
                )}
              </div>
              <button type="button" className="program-action-btn btn-print" onClick={handlePrint}>
                <FontAwesomeIcon icon={faPrint} /> Yazdır
              </button>
              <button
                type="button"
                className="program-action-btn btn-clear-week"
                onClick={handleClearWeekProgram}
                disabled={clearingWeek}
              >
                <FontAwesomeIcon icon={faTrash} />{' '}
                {clearingWeek ? 'Siliniyor...' : 'Haftalık Programı Temizle'}
              </button>
            </>
          ) : (
            <button type="button" className="program-action-btn btn-print" onClick={handlePrint}>
              <FontAwesomeIcon icon={faPrint} /> Yazdır
            </button>
          )}
        </div>
      </div>
      {exportImportMessage && (
        <div className={`export-import-message ${exportImportMessageType}`}>
          {exportImportMessage}
        </div>
      )}
      {validationPopup.visible && (
        <div
          onClick={() => setValidationPopup({ visible: false, message: '' })}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 360,
              padding: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              {validationPopup.message || 'Veri girin'}
            </div>
            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
              Lütfen Doğru / Yanlış / Boş değerlerini giriniz.
            </div>
            <button
              type="button"
              onClick={() => setValidationPopup({ visible: false, message: '' })}
              style={{
                padding: '8px 12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
      {resultPopupProgram && (
        <div
          onClick={closeResultPopup}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 420,
              padding: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Soru Sonuçları · Toplam: {parseInt(resultPopupProgram.soru_sayisi) || 0}
              </div>
              <button
                type="button"
                onClick={closeResultPopup}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 16
                }}
                title="Kapat"
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Doğru</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={resultPopupInputs.dogru}
                  disabled={readOnly}
                  readOnly={readOnly}
                  onChange={(e) => {
                    if (readOnly) return;
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setResultPopupInputs(prev => ({ ...prev, dogru: value }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Yanlış</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={resultPopupInputs.yanlis}
                  disabled={readOnly}
                  readOnly={readOnly}
                  onChange={(e) => {
                    if (readOnly) return;
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setResultPopupInputs(prev => ({ ...prev, yanlis: value }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Boş</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={resultPopupInputs.bos}
                  disabled={readOnly}
                  readOnly={readOnly}
                  onChange={(e) => {
                    if (readOnly) return;
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setResultPopupInputs(prev => ({ ...prev, bos: value }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={closeResultPopup}
                style={{
                  padding: '8px 12px',
                  background: '#E5E7EB',
                  color: '#111827',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const dogru = resultPopupInputs.dogru === '' ? 0 : (parseInt(resultPopupInputs.dogru) || 0);
                  const yanlis = resultPopupInputs.yanlis === '' ? 0 : (parseInt(resultPopupInputs.yanlis) || 0);
                  const bos = resultPopupInputs.bos === '' ? 0 : (parseInt(resultPopupInputs.bos) || 0);
                  const soruSayisi = parseInt(resultPopupProgram.soru_sayisi) || 0;
                  const toplam = dogru + yanlis + bos;
                  let newStatus;
                  if (soruSayisi > 0 && toplam >= soruSayisi) {
                    newStatus = 'yapildi';
                  } else if (toplam > 0 && toplam < soruSayisi) {
                    newStatus = 'eksik_yapildi';
                  } else {
                    newStatus = 'yapilmadi';
                  }
                  await handleStatusUpdate(resultPopupProgram, newStatus, dogru, yanlis, bos);
                  setStatusInputs(prev => ({
                    ...prev,
                    [resultPopupProgram.id]: {
                      dogru: String(resultPopupInputs.dogru),
                      yanlis: String(resultPopupInputs.yanlis),
                      bos: String(resultPopupInputs.bos)
                    }
                  }));
                  closeResultPopup();
                }}
                style={{
                  padding: '8px 12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="program-calendar-container program-print-area">
        <div className="screen-calendar">
          <div className="program-calendar">
        <div className="calendar-header">
          {weekDays.map((day, index) => {
            const dayPrograms = getDayPrograms(day);
            const totalPrograms = dayPrograms.length;
            const completedPrograms = dayPrograms.filter(p => calculateStatus(p) === 'yapildi').length;
            
            // Pasta grafiği için yüzde hesaplama
            const completedPercent = totalPrograms > 0 ? (completedPrograms / totalPrograms) * 100 : 0;
            
            // SVG pasta grafiği için stroke-dasharray hesaplama
            const radius = 12;
            const circumference = 2 * Math.PI * radius;
            const completedStrokeDasharray = totalPrograms > 0 ? `${(completedPercent / 100) * circumference} ${circumference}` : '0';
            
            return (
              <div key={index} className="day-header">
                <div className="calendar-day-label">
                  <div className="day-name">
                    {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </div>
                  <div className="day-number">
                    {day.toLocaleDateString('tr-TR', { day: 'numeric' })}
                  </div>
                </div>
                {totalPrograms > 0 && (
                  <div className="day-progress-chart" style={{
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="14"
                        cy="14"
                        r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="3"
                      />
                      {completedPercent > 0 && (
                        <circle
                          cx="14"
                          cy="14"
                          r={radius}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray={completedStrokeDasharray}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dasharray 0.3s ease'
                          }}
                        />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="calendar-body-wrapper"
          style={{
            transform: `scale(${calendarScale})`,
            transformOrigin: 'top left',
            width: `${(1 / calendarScale) * 100}%`
          }}
        >
          <div className="calendar-body">
            {weekDays.map((day, dayIndex) => {
              const dayPrograms = getDayPrograms(day);
              
              return (
                <div 
                  key={dayIndex} 
                  className="day-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className="programs-list">
                    {dayPrograms.map((prog) => {
                      const isRoutine = !!prog.is_routine;
                      const startTime = (prog.baslangic_saati || '').substring(0, 5);
                      const endTime = prog.bitis_saati ? prog.bitis_saati.substring(0, 5) : '';
                      const isEditing = editingProgram?.id === prog.id;

                      if (isEditing) {
                        return (
                          <div
                            key={`edit-${prog.id}`}
                            className="inline-program-form"
                          >
                            <form onSubmit={handleUpdateProgram} ref={editProgramFormRef}>
                              <div className="inline-form-group">
                                <label>Etüt Süresi (dakika)</label>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  value={programForm.etutSuresi ?? ''}
                                  onChange={(e) => handleEtutDurationChange(e.target.value)}
                                  placeholder="Örn: 40"
                                />
                              </div>
                              <div className="inline-form-row">
                                <div className="inline-form-group">
                                  <label>Başlangıç Saati</label>
                                  <input
                                    type="time"
                                    value={programForm.baslangicSaati}
                                    onChange={(e) => handleStartTimeChange(e.target.value)}
                                    onBlur={() => handleStartTimeBlur(editFormEndTimeInputRef)}
                                    required
                                  />
                                </div>
                                <div className="inline-form-group">
                                  <label>Bitiş Saati</label>
                                  <input
                                    type="time"
                                    value={programForm.bitisSaati}
                                    onChange={(e) => setProgramForm({ ...programForm, bitisSaati: e.target.value })}
                                    required
                                    ref={editFormEndTimeInputRef}
                                  />
                                </div>
                              </div>
                              <div className="inline-form-group">
                                <label>Ders</label>
                                <select
                                  value={programForm.ders}
                                  onChange={(e) => {
                                    const newDers = e.target.value;
                                    setProgramForm({ ...programForm, ders: newDers, konu: '' });
                                    fetchTopicsForSubject(newDers);
                                  }}
                                  required
                                >
                                  <option value="">{isDersLoading ? 'Yükleniyor...' : 'Seçiniz'}</option>
                                  {dersOptions.map((ders, index) => (
                                    <option key={index} value={ders}>{ders}</option>
                                  ))}
                                </select>
                              </div>
                              {programForm.programTipi !== 'deneme' && (
                                <div className="inline-form-group">
                                <label>Konu</label>
                                {(dynamicTopics.length > 0 || isKonuLoading) ? (
                                  <>
                                    <select
                                      value={(programForm.isManualKonu || (programForm.konu && !dynamicTopics.some(t => t.konu_adi === programForm.konu))) ? 'other' : programForm.konu}
                                      onChange={(e) => {
                                        if (e.target.value === 'other') {
                                          setProgramForm({ ...programForm, isManualKonu: true, konu: '' });
                                        } else {
                                          setProgramForm({ ...programForm, isManualKonu: false, konu: e.target.value });
                                        }
                                      }}
                                    >
                                      <option value="">{isKonuLoading ? 'Yükleniyor...' : 'Konu Seçiniz'}</option>
                                      {dynamicTopics.map((topic, index) => (
                                        <option key={index} value={topic.konu_adi}>{topic.konu_adi}</option>
                                      ))}
                                      {!isKonuLoading && <option value="other">Diğer (Manuel Gir)</option>}
                                    </select>
                                    {(programForm.isManualKonu || (programForm.konu && !dynamicTopics.some(t => t.konu_adi === programForm.konu))) && (
                                      <input
                                        type="text"
                                        style={{marginTop: 8}}
                                        placeholder="Konu adını giriniz"
                                        value={programForm.konu}
                                        onChange={(e) => setProgramForm({ ...programForm, konu: e.target.value })}
                                      />
                                    )}
                                  </>
                                ) : (
                                    <input
                                      type="text"
                                      value={programForm.konu}
                                      onChange={(e) => setProgramForm({ ...programForm, konu: e.target.value })}
                                      placeholder={isKonuLoading ? 'Yükleniyor...' : "Örn: Türev"}
                                    />
                                  )}
                                </div>
                              )}
                              <div className="inline-form-group">
                                <label>Program Tipi</label>
                                <select
                                  value={programForm.programTipi}
                                  onChange={(e) => setProgramForm({ ...programForm, programTipi: e.target.value })}
                                  required
                                >
                                  <option value="soru_cozum">Soru Çözümü</option>
                                  <option value="konu_anlatim">Konu Anlatımı</option>
                                  <option value="deneme">Deneme</option>
                                </select>
                              </div>
                              <div className="inline-form-row">
                                {programForm.programTipi === 'soru_cozum' && (
                                  <div className="inline-form-group">
                                    <label>Soru Sayısı</label>
                                    <input
                                      type="number"
                                      value={programForm.soruSayisi}
                                      onChange={(e) => setProgramForm({ ...programForm, soruSayisi: e.target.value })}
                                      min="1"
                                      placeholder="Örn: 70"
                                    />
                                  </div>
                                )}
                                <div className="inline-form-group">
                                <label>Kaynak</label>
                                <input
                    type="text"
                    value={programForm.kaynak}
                    onChange={(e) => { e.stopPropagation(); setProgramForm({ ...programForm, kaynak: e.target.value }); }}
                    onKeyDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    autoComplete="off"
                    ref={editKaynakInputRef}
                    onFocus={() => setFocusedKaynakContext('edit')}
                    placeholder="Örn: 3-4-5"
                  />
                </div>
                              </div>
                              <div className="inline-form-group">
                                <label>Açıklama</label>
                                <textarea
                                  value={programForm.aciklama}
                                  onChange={(e) => setProgramForm({ ...programForm, aciklama: e.target.value })}
                                  rows="2"
                                  placeholder="İsteğe bağlı açıklama..."
                                />
                              </div>
                              <div className="inline-form-group">
                                <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
                                  <input
                                    type="checkbox"
                                    checked={programForm.hasYoutubeLinki}
                                    onChange={(e) => setProgramForm({ ...programForm, hasYoutubeLinki: e.target.checked, youtubeLinki: e.target.checked ? programForm.youtubeLinki : '' })}
                                    style={{cursor: 'pointer'}}
                                  />
                                  <span>Youtube Linki</span>
                                </label>
                                {programForm.hasYoutubeLinki && (
                                  <input
                                    type="url"
                                    value={programForm.youtubeLinki}
                                    onChange={(e) => setProgramForm({ ...programForm, youtubeLinki: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    style={{marginTop: 8}}
                                  />
                                )}
                              </div>
                              <div className="inline-form-actions">
                                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                                  İptal
                                </button>
                                <button type="submit" className="save-btn">
                                  Güncelle
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={prog.id}
                            className={`program-item${isRoutine ? ' program-item-routine' : ''}${
                              openStatusDropdown === prog.id ? ' program-item-status-open' : ''
                            }`}
                          style={{ 
                            background: getGradientBackground(getProgramColor(prog))
                          }}
                          draggable={!isRoutine}
                          onDragStart={(e) => {
                            if (isRoutine) return;
                            handleDragStart(e, prog);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Header with time + actions */}
                          <div className="program-item-header">
                            <div className="program-item-time">
                              {startTime}
                              {endTime ? ` - ${endTime}` : ''}
                            </div>
                              
                          </div>
                          <div className="program-item-actions">
                              {!isStudentPanel && !readOnly && !isRoutine && (
                                <>
                                <button
                                  className="edit-program-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProgram(prog);
                                  }}
                                  title="Düzenle"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className="copy-program-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyProgram(prog);
                                  }}
                                  title="Kopyala"
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                                </>
                              )}
                              {!isStudentPanel && !readOnly && (
                                <button
                                  className="delete-program-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  handleDeleteProgram(
                                    prog.id,
                                    isRoutine,
                                    prog.tarih,
                                    prog.routine_id,
                                    prog.ogrenci_id
                                  )
                                  }}
                                title={isRoutine ? 'Bu haftadan kaldır' : 'Sil'}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                              </div>
                          {/* Subject - Topic */}
                          <div className="program-item-subject">
                            <div className="program-item-ders-row">
                              {(() => {
                                const iconSrc = getSubjectIcon(prog.ders);
                                return iconSrc ? (
                                  <img 
                                    src={iconSrc} 
                                    alt="" 
                                    className="program-item-ders-icon"
                                    onError={(e) => {
                                      console.error('Görsel yüklenemedi:', iconSrc, prog.ders);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : null;
                              })()}
                              <span className="program-item-ders">{prog.ders}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginTop: 2 }}>
                              {prog.konu && (
                                <span className="program-item-konu" style={{ flexShrink: 0, maxWidth: prog.kaynak ? '35%' : '100%' }}>{prog.konu}</span>
                              )}
                              {prog.kaynak && (
                                <span className="program-item-kaynak-inline" title={prog.kaynak} style={{
                                    fontSize: '11px', 
                                    opacity: 0.8, 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    flex: 1,
                                    minWidth: 0
                                }}>
                                   📚 {prog.kaynak}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Program type + soru sayısı */}
                          <div className="program-item-type">
                            <div className="program-item-type-title">
                              <span>
                                {getProgramTypeName(prog.program_tipi)}
                                {prog.soru_sayisi ? ` - ${prog.soru_sayisi} soru` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Details section: Kaynak, Açıklama, Soru Sayısı */}
                          <div className="program-item-details">
                            <div className="program-item-kaynak-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: 4, minHeight: 24 }}>
                                {(prog.program_tipi === 'soru_cozum' || prog.program_tipi === 'konu_anlatim') && (
                                  <div className="result-inputs" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      className="result-box correct"
                                      placeholder="D"
                                      value={statusInputs[prog.id]?.dogru ?? prog.dogru ?? ''}
                                      onChange={(e) => handleResultChange(prog.id, 'dogru', e.target.value)}
                                      onBlur={() => handleResultBlur(prog)}
                                      title="Doğru"
                                    />
                                    <input 
                                      className="result-box incorrect"
                                      placeholder="Y"
                                      value={statusInputs[prog.id]?.yanlis ?? prog.yanlis ?? ''}
                                      onChange={(e) => handleResultChange(prog.id, 'yanlis', e.target.value)}
                                      onBlur={() => handleResultBlur(prog)}
                                      title="Yanlış"
                                    />
                                    <input 
                                      className="result-box empty"
                                      placeholder="B"
                                      value={statusInputs[prog.id]?.bos ?? prog.bos ?? ''}
                                      onChange={(e) => handleResultChange(prog.id, 'bos', e.target.value)}
                                      onBlur={() => handleResultBlur(prog)}
                                      title="Boş"
                                    />
                                  </div>
                                )}
                            </div>
                            
                            {prog.aciklama ? (
                              <div 
                                className={`program-item-aciklama ${expandedAciklama.has(prog.id) ? 'expanded' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAciklama(prog.id);
                                }}
                                title="Tıklayarak genişlet/küçült"
                              >
                                <span className="aciklama-icon">💬</span>
                                <span className="aciklama-text">{prog.aciklama}</span>
                              </div>
                            ) : (
                              <div style={{ height: '28px' }}></div>
                            )}
                            {prog.youtube_linki && (
                              <div className="program-item-youtube-link" style={{marginTop: 6}}>
                                <a 
                                  href={prog.youtube_linki} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    color: '#dc2626',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontWeight: 600,
                                    fontSize: '13px'
                                  }}
                                >
                                  ▶️ YouTube Video
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {/* Status */}
                          {(() => {
                            const calculatedStatus = calculateStatus(prog);
                            const status = calculatedStatus;
                            const statusLabel =
                              status === 'yapildi'
                                ? '✓ Yapıldı'
                                : status === 'eksik_yapildi'
                                ? '⚠ Eksik Yapıldı'
                                : '✗ Yapılmadı';
                            const displayLabel = isRoutine ? `${statusLabel}` : statusLabel;

                            return (
                              <div className="program-item-status-wrapper">
                                <div
                                  className={`program-item-durum durum-${status}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusDropdown((prev) =>
                                      prev === prog.id ? null : prog.id
                                    );
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <span>{displayLabel}</span>
                                  <FontAwesomeIcon
                                    icon={
                                      openStatusDropdown === prog.id ? faChevronUp : faChevronDown
                                    }
                                    className="status-dropdown-caret"
                                  />
                              </div>
                                {openStatusDropdown === prog.id && (
                                  <div
                                    className="status-dropdown-menu"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ minWidth: '200px', zIndex: 1000 }}
                                >
                                    <button
                                      type="button"
                                      className={`status-dropdown-item ${status === 'yapildi' ? 'active' : ''} ${shakeStatusProgramId === prog.id ? 'shake' : ''}`}
                                      onClick={() => handleYapildiClick(prog)}
                                    >
                                      ✓ Yapıldı
                                    </button>
                                    <button
                                      type="button"
                                      className={`status-dropdown-item ${
                                        status === 'eksik_yapildi' ? 'active' : ''
                                      }`}
                                      onClick={() => handleStatusUpdate(prog, 'eksik_yapildi')}
                                    >
                                      ⚠ Eksik Yapıldı
                                    </button>
                                    <button
                                      type="button"
                                      className={`status-dropdown-item ${
                                        status === 'yapilmadi' ? 'active' : ''
                                      }`}
                                      onClick={() => handleStatusUpdate(prog, 'yapilmadi')}
                                    >
                                      ✗ Yapılmadı
                                    </button>
                            </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                    
                    {/* Görev Ekle Butonu - Sadece öğretmen panelinde göster */}
                    {!isStudentPanel && !readOnly && addingProgramDay?.getTime() !== day.getTime() && (
                      <button
                        className="add-program-inline-btn"
                        onClick={() => handleAddProgramClick(day)}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Görev Ekle
                      </button>
                    )}
                    
                      {/* Inline Program Ekleme Formu - Sadece öğretmen panelinde göster */}
                      {!isStudentPanel && !readOnly && addingProgramDay?.getTime() === day.getTime() && (
                        <div
                          className="inline-program-form"
                        >
                          <form onSubmit={handleProgramSubmit} ref={addProgramFormRef}>
                              <div className="inline-form-group">
                                <label>Etüt Süresi (dakika)</label>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  value={programForm.etutSuresi ?? ''}
                                  onChange={(e) => handleEtutDurationChange(e.target.value)}
                                  placeholder="Örn: 40"
                                />
                              </div>
                          <div className="inline-form-row">
                            <div className="inline-form-group">
                              <label>Başlangıç Saati</label>
                              <input
                                type="time"
                                value={programForm.baslangicSaati}
                                    onChange={(e) => handleStartTimeChange(e.target.value)}
                                    onBlur={() => handleStartTimeBlur(addFormEndTimeInputRef)}
                                required
                              />
                            </div>
                            <div className="inline-form-group">
                              <label>Bitiş Saati</label>
                              <input
                                type="time"
                                value={programForm.bitisSaati}
                                onChange={(e) => setProgramForm({ ...programForm, bitisSaati: e.target.value })}
                                required
                                    ref={addFormEndTimeInputRef}
                              />
                            </div>
                            </div>
                            <div className="inline-form-group">
                              <label>Ders</label>
                              <select
                                value={programForm.ders}
                                onChange={(e) => {
                                  const newDers = e.target.value;
                                  setProgramForm({ ...programForm, ders: newDers, konu: '' });
                                  fetchTopicsForSubject(newDers);
                                }}
                                required
                              >
                                <option value="">{isDersLoading ? 'Yükleniyor...' : 'Seçiniz'}</option>
                                {dersOptions.map((ders, index) => (
                                  <option key={index} value={ders}>{ders}</option>
                                ))}
                              </select>
                          </div>
                          {programForm.programTipi !== 'deneme' && (
                            <div className="inline-form-group">
                              <label>Konu</label>
                              {(dynamicTopics.length > 0 || isKonuLoading) ? (
                                <>
                                  <select
                                    value={(programForm.isManualKonu || (programForm.konu && !dynamicTopics.some(t => t.konu_adi === programForm.konu))) ? 'other' : programForm.konu}
                                    onChange={(e) => {
                                      if (e.target.value === 'other') {
                                        setProgramForm({ ...programForm, isManualKonu: true, konu: '' });
                                      } else {
                                        setProgramForm({ ...programForm, isManualKonu: false, konu: e.target.value });
                                      }
                                    }}
                                  >
                                    <option value="">{isKonuLoading ? 'Yükleniyor...' : 'Konu Seçiniz'}</option>
                                    {dynamicTopics.map((topic, index) => (
                                      <option key={index} value={topic.konu_adi}>{topic.konu_adi}</option>
                                    ))}
                                    {!isKonuLoading && <option value="other">Diğer (Manuel Gir)</option>}
                                  </select>
                                  {(programForm.isManualKonu || (programForm.konu && !dynamicTopics.some(t => t.konu_adi === programForm.konu))) && (
                                    <input
                                      type="text"
                                      style={{marginTop: 8}}
                                      placeholder="Konu adını giriniz"
                                      value={programForm.konu}
                                      onChange={(e) => setProgramForm({ ...programForm, konu: e.target.value })}
                                    />
                                  )}
                                </>
                              ) : (
                                <input
                                  type="text"
                                  value={programForm.konu}
                                  onChange={(e) => setProgramForm({ ...programForm, konu: e.target.value })}
                                  placeholder={isKonuLoading ? 'Yükleniyor...' : "Örn: Türev"}
                                />
                              )}
                            </div>
                          )}
                            <div className="inline-form-group">
                            <label>Program Tipi</label>
                            <select
                              value={programForm.programTipi}
                              onChange={(e) => setProgramForm({ ...programForm, programTipi: e.target.value })}
                              required
                            >
                              <option value="soru_cozum">Soru Çözümü</option>
                              <option value="konu_anlatim">Konu Anlatımı</option>
                              <option value="deneme">Deneme</option>
                            </select>
                            </div>
                          <div className="inline-form-row">
                            {programForm.programTipi === 'soru_cozum' && (
                              <div className="inline-form-group">
                                <label>Soru Sayısı</label>
                                <input
                                  type="number"
                                  value={programForm.soruSayisi}
                                  onChange={(e) => setProgramForm({ ...programForm, soruSayisi: e.target.value })}
                                  min="1"
                                  placeholder="Örn: 70"
                                />
                              </div>
                            )}
                            <div className="inline-form-group">
                              <label>Kaynak</label>
                              <input
                                type="text"
                                value={programForm.kaynak}
                                onChange={(e) => { e.stopPropagation(); setProgramForm({ ...programForm, kaynak: e.target.value }); }}
                                onKeyDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                autoComplete="off"
                                ref={addKaynakInputRef}
                                onFocus={() => setFocusedKaynakContext('add')}
                                placeholder="Örn: 3-4-5"
                              />
                            </div>
                          </div>
                          <div className="inline-form-group">
                            <label>Açıklama</label>
                            <textarea
                              value={programForm.aciklama}
                              onChange={(e) => setProgramForm({ ...programForm, aciklama: e.target.value })}
                              rows="2"
                              placeholder="İsteğe bağlı açıklama..."
                            />
                          </div>
                          <div className="inline-form-group">
                            <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
                              <input
                                type="checkbox"
                                checked={programForm.hasYoutubeLinki}
                                onChange={(e) => setProgramForm({ ...programForm, hasYoutubeLinki: e.target.checked, youtubeLinki: e.target.checked ? programForm.youtubeLinki : '' })}
                                style={{cursor: 'pointer'}}
                              />
                              <span>Youtube Linki</span>
                            </label>
                            {programForm.hasYoutubeLinki && (
                              <input
                                type="url"
                                value={programForm.youtubeLinki}
                                onChange={(e) => setProgramForm({ ...programForm, youtubeLinki: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=..."
                                style={{marginTop: 8}}
                              />
                            )}
                          </div>
                          <div className="inline-form-actions">
                            <button type="button" className="cancel-btn" onClick={handleCancelAddProgram}>
                              İptal
                            </button>
                            <button type="submit" className="save-btn">
                              Kaydet
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                  
                  {/* Time slot'ları render et - artık sadece görsel referans için */}
                  <div className="time-slots-container">
                    {timeSlots.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="time-slot"
                      >
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="calendar-zoom-controls">
          <button type="button" className="zoom-btn" onClick={handleZoomOut}>-</button>
          <button type="button" className="zoom-btn" onClick={handleZoomIn}>+</button>
        </div>
      </div>
        </div>
        <div className="print-calendar">
          <div className="print-calendar-page columns-4">
            <div className="print-day-grid columns-4">
              {firstPrintDays.map((day) => renderPrintDayColumn(day))}
            </div>
          </div>
          {secondPrintDays.length > 0 && (
            <div className="print-calendar-page columns-3 print-calendar-page-last">
              <div className="print-day-grid columns-3">
                {secondPrintDays.map((day) => renderPrintDayColumn(day))}
              </div>
            </div>
          )}
      </div>
      </div>

      {!isStudentPanel && !readOnly && (
      <div className="analysis-section">
        <div className="analysis-card teacher-analysis-card" ref={teacherAnalysisRef}>
          <div className="analysis-card-header">
            <h3>Öğretmen Analiz Yorumu</h3>
            {weekDays[0] && (
              <span className="analysis-week-label">
                {weekDays[0].toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long'
                })}
              </span>
            )}
          </div>
          <textarea
            value={teacherAnalysis}
            onChange={(e) => setTeacherAnalysis(e.target.value)}
            placeholder="Bu hafta için genel değerlendirmelerinizi buraya yazın..."
            rows={6}
            disabled={analysisLoading}
          />
          <div className="analysis-actions">
            <button
              className="save-btn"
              onClick={handleSaveTeacherAnalysis}
              disabled={teacherAnalysisSaving || analysisLoading}
            >
              {teacherAnalysisSaving ? 'Kaydediliyor...' : 'Yorumu Kaydet'}
          </button>
            <button
              type="button"
              className="send-parent-btn"
            >
              Haftalık Analizi Veliye Gönder
          </button>
            {teacherAnalysisMessage && (
              <span className={`analysis-message ${teacherAnalysisMessageType === 'error' ? 'error' : 'success'}`}>
                {teacherAnalysisMessage}
              </span>
            )}
        </div>
                  </div>

        <div className="analysis-card ai-analysis-card" ref={aiAnalysisRef}>
          <div className="analysis-card-header">
            <h3>AI Analiz Yorumu</h3>
                </div>
          <div className="ai-analysis-placeholder">
            {aiAnalysis
              ? aiAnalysis
              : 'AI destekli analiz yorumları yakında burada görünecek.'}
                </div>
          <div className="analysis-actions">
            <button
              type="button"
              className="send-parent-btn"
            >
              Haftalık Analizi Veliye Gönder
            </button>
                </div>
              </div>
      </div>
      )}

      {/* Rutin Görev Modalı */}
      {showRoutineModal && (
        <div className="program-modal-overlay" onClick={closeRoutineModal}>
          <div className="program-modal routine-modal" onClick={(e) => e.stopPropagation()}>
            {routineModalMode === 'list' ? (
              <>
            <div className="modal-header">
                  <h3>Rutin Görevler</h3>
              <button className="close-btn" onClick={closeRoutineModal}>×</button>
            </div>
                <div className="routine-modal-content">
                  <button className="routine-add-btn" onClick={startRoutineCreation}>
                    <FontAwesomeIcon icon={faPlus} /> Yeni Rutin
                  </button>
                  {routineError && <div className="form-error routine-error">{routineError}</div>}
                  {routines.length === 0 ? (
                    <div className="routine-empty-state">
                      Henüz tanımlı rutin görev yok.
                    </div>
                  ) : (
                    <div className="routine-modal-list">
                      {routines.map((routine) => (
                        <div key={routine.id} className="routine-modal-item">
                          <div className="routine-item-header">
                            <div className="routine-item-days">
                              <FontAwesomeIcon icon={faCalendarAlt} /> {formatRoutineDays(routine.gunler)}
                            </div>
                            <div className="routine-item-time">
                              <FontAwesomeIcon icon={faClock} /> {(routine.saat || '').substring(0, 5)}
                              {routine.bitisSaati ? ` - ${routine.bitisSaati}` : ''}
                            </div>
                          </div>
                          <div className="routine-item-body">
                            <span className="routine-item-type">{getProgramTypeName(routine.programTipi)}</span>
                            <span className="routine-item-ders">{routine.ders}</span>
                            {routine.konu && <span className="routine-item-konu">Konu: {routine.konu}</span>}
                            {routine.kaynak && <span className="routine-item-kaynak">Kaynak: {routine.kaynak}</span>}
                            {routine.soruSayisi ? <span className="routine-item-soru">{routine.soruSayisi} soru</span> : null}
                          </div>
                          {routine.aciklama && (
                            <div className="routine-item-aciklama">💬 {routine.aciklama}</div>
                          )}
                          <div className="routine-item-actions">
                            <button
                              className="edit-program-btn"
                              onClick={() => startRoutineEdit(routine)}
                            >
                              <FontAwesomeIcon icon={faEdit} /> Düzenle
                            </button>
                            <button
                              className="delete-program-btn"
                              onClick={() => handleDeleteRoutine(routine.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} /> Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
            <form className="program-form" onSubmit={handleRoutineSubmit} ref={routineFormRef}>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <button type="button" className="back-btn" onClick={returnToRoutineList}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <h3>{editingRoutine ? 'Rutin Görev Düzenle' : 'Rutin Görev Oluştur'}</h3>
                  </div>
                  <button className="close-btn" onClick={closeRoutineModal}>×</button>
                </div>

              <div className="form-group">
                <label>Günler</label>
                <div className="routine-days-grid">
                  {DAY_OPTIONS.map((day) => (
                    <label
                      key={day.value}
                      className={`routine-day-option ${routineForm.gunler.includes(day.value) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        value={day.value}
                        checked={routineForm.gunler.includes(day.value)}
                        onChange={() => handleRoutineDayToggle(day.value)}
                      />
                      {day.short}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Başlangıç Saati</label>
                  <input
                    type="time"
                    name="saat"
                    value={routineForm.saat}
                    onChange={handleRoutineFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bitiş Saati</label>
                  <input
                    type="time"
                    name="bitisSaati"
                    value={routineForm.bitisSaati}
                    onChange={handleRoutineFormChange}
                    required
                  />
                </div>
              </div>

                <div className="form-group">
                  <label>Program Tipi</label>
                  <select
                    name="programTipi"
                    value={routineForm.programTipi}
                    onChange={handleRoutineFormChange}
                  >
                    <option value="soru_cozum">Soru Çözümü</option>
                    <option value="konu_anlatim">Konu Anlatımı</option>
                    <option value="deneme">Deneme</option>
                  </select>
              </div>

              <div className="form-group">
                <label>Ders</label>
                <select
                  name="ders"
                  value={routineForm.ders}
                  onChange={(e) => {
                    const newDers = e.target.value;
                    setRoutineForm(prev => ({ ...prev, ders: newDers, konu: '' }));
                    fetchTopicsForSubject(newDers);
                  }}
                  required
                >
                  <option value="">{isDersLoading ? 'Yükleniyor...' : 'Seçiniz'}</option>
                  {dersOptions.map((ders, index) => (
                    <option key={index} value={ders}>{ders}</option>
                  ))}
                </select>
              </div>

              {routineForm.programTipi !== 'deneme' && (
                <div className="form-group">
                  <label>Konu</label>
                  {(dynamicTopics.length > 0 || isKonuLoading) ? (
                    <select
                      name="konu"
                      value={routineForm.konu}
                      onChange={handleRoutineFormChange}
                    >
                      <option value="">{isKonuLoading ? 'Yükleniyor...' : 'Konu Seçiniz'}</option>
                      {dynamicTopics.map((topic, index) => (
                        <option key={index} value={topic.konu_adi}>{topic.konu_adi}</option>
                      ))}
                      {!isKonuLoading && <option value="other">Diğer (Manuel Gir)</option>}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="konu"
                      value={routineForm.konu}
                      onChange={handleRoutineFormChange}
                      placeholder={isKonuLoading ? 'Yükleniyor...' : "Örn: Türev"}
                    />
                  )}
                  {routineForm.konu === 'other' && (
                    <input
                      type="text"
                      style={{marginTop: 8}}
                      placeholder="Konu adını giriniz"
                      onChange={(e) => setRoutineForm(prev => ({ ...prev, konu: e.target.value }))}
                    />
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Kaynak</label>
                <input
                  type="text"
                  name="kaynak"
                  value={routineForm.kaynak}
                  onChange={(e) => { e.stopPropagation(); handleRoutineFormChange(e); }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoComplete="off"
                  ref={routineKaynakInputRef}
                  onFocus={() => setFocusedKaynakContext('routine')}
                  placeholder="Örn: 3-4-5"
                />
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  name="aciklama"
                  value={routineForm.aciklama}
                  onChange={handleRoutineFormChange}
                  placeholder="Açıklama girin (isteğe bağlı)"
                  rows="3"
                />
              </div>

              {routineForm.programTipi === 'soru_cozum' && (
                <div className="form-group">
                  <label>Soru Sayısı</label>
                  <input
                    type="number"
                    name="soruSayisi"
                    value={routineForm.soruSayisi}
                    onChange={handleRoutineFormChange}
                    min="1"
                    placeholder="Örn: 70"
                  />
                </div>
              )}

              {routineError && <div className="form-error">{routineError}</div>}

              <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={returnToRoutineList}>
                    Geri
                </button>
                <button type="submit" className="save-btn" disabled={routineSaving}>
                  {routineSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
            )}
            </div>
                </div>
              )}


      {/* Şablon Listesi Modalı */}
      {showTemplateList && (
        <div className="program-modal-overlay" onClick={() => setShowTemplateList(false)}>
          <div className="program-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hazır Şablonlar</h3>
              <button className="close-btn" onClick={() => setShowTemplateList(false)}>×</button>
            </div>
            <div className="template-list">
              <div className="template-actions-header">
              <button
                className="add-template-btn"
                onClick={() => {
                  setShowTemplateList(false);
                  setShowTemplateModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} /> Yeni Şablon Oluştur
              </button>
                <button
                  className="save-current-template-btn"
                  onClick={handleSaveCurrentProgramAsTemplate}
                >
                  <FontAwesomeIcon icon={faSave} /> Mevcut Programı Şablon Olarak Kaydet
                </button>
                <button
                  className="load-previous-week-btn"
                  onClick={handleLoadPreviousWeekProgram}
                >
                  <FontAwesomeIcon icon={faHistory} /> Geçen Haftanın Programını Getir
                </button>
              </div>
              {templates.length === 0 ? (
                <div className="empty-templates">Henüz şablon oluşturulmamış</div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="template-item">
                    <div className="template-info">
                      <h4>{template.sablon_adi}</h4>
                      {template.aciklama && <p>{template.aciklama}</p>}
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button
                        className="apply-template-btn"
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        Uygula
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={async () => {
                          try {
                            const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_program_template_detail.php?templateId=${template.id}`);
                            if (data.success) {
                              setEditingTemplate({
                                id: template.id,
                                name: data.template.sablon_adi,
                                description: data.template.aciklama || '',
                                programs: data.details.map(d => ({
                                  id: d.id,
                                  gunNo: Number(d.gun_no),
                                  programTipi: d.program_tipi,
                                  ders: d.ders,
                                  konu: d.konu,
                                  soruSayisi: d.soru_sayisi,
                                  baslangicSaati: d.baslangic_saati,
                                  bitisSaati: d.bitis_saati
                                }))
                              });
                              setShowTemplateList(false);
                              setShowTemplateModal(true);
                            } else {
                              alert(data.message || 'Şablon yüklenemedi');
                            }
                          } catch (e) {
                            alert('Şablon yüklenemedi');
                          }
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        className="danger-btn"
                        onClick={async () => {
                          if (!window.confirm('Şablonu silmek istediğinize emin misiniz?')) return;
                          try {
                            const data = await safeFetchJson(`${API_BASE}/php-backend/api/delete_program_template.php`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ templateId: template.id })
                            });
                            if (data.success) {
                              fetchTemplates();
                            } else {
                              alert(data.message || 'Şablon silinemedi');
                            }
                          } catch (e) {
                            alert('Şablon silinemedi');
                          }
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Şablon Oluşturma Modalı - Bu kısım ayrı bir komponente taşınabilir */}
      {showTemplateModal && (
        <TemplateCreatorModal
          teacherId={teacherId}
          templateToEdit={editingTemplate}
          onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
          onSave={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}

      {/* Konu Başarımları Modal */}
      {showTopicAnalysisModal && (
        <div className="topic-analysis-modal-overlay" onClick={() => setShowTopicAnalysisModal(false)}>
          <div 
            className="topic-analysis-modal" 
            ref={topicAnalysisModalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '800px',
              height: '600px',
              minWidth: '600px',
              minHeight: '400px'
            }}
          >
            <div className="topic-analysis-modal-header" ref={topicAnalysisModalHeaderRef}>
              <div className="topic-analysis-modal-title">
                <FontAwesomeIcon icon={faGripLines} className="drag-handle-icon" />
                <span>KONU BAŞARIMLARI</span>
              </div>
              <button 
                className="topic-analysis-modal-close"
                onClick={() => setShowTopicAnalysisModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="topic-analysis-modal-content">

              <div className="topic-analysis-filters">
                <div className="filter-group">
                  <label>DERS SEÇİN:</label>
                  <select 
                    value={topicAnalysisSubject} 
                    onChange={(e) => setTopicAnalysisSubject(e.target.value)}
                    className="topic-analysis-select"
                  >
                    <option value="">Tüm Dersler</option>
                    {studentSubjects.map((subject, idx) => (
                      <option key={idx} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>TARİH FİLTRESİ:</label>
                  <select 
                    value={topicAnalysisDateFilter} 
                    onChange={(e) => setTopicAnalysisDateFilter(e.target.value)}
                    className="topic-analysis-select"
                  >
                    <option value="1_hafta">Son 1 Hafta</option>
                    <option value="15_gun">Son 15 Gün</option>
                    <option value="1_ay">Son 1 Ay</option>
                    <option value="3_ay">Son 3 Ay</option>
                    <option value="6_ay">Son 6 Ay</option>
                    <option value="12_ay">Son 12 Ay</option>
                    <option value="manuel">Manuel Tarih Aralığı</option>
                  </select>
                </div>

                {topicAnalysisDateFilter === 'manuel' && (
                  <div className="filter-group date-range-group">
                    <label>Başlangıç:</label>
                    <input 
                      type="date" 
                      value={topicAnalysisDateRange.start || ''}
                      onChange={(e) => setTopicAnalysisDateRange({ ...topicAnalysisDateRange, start: e.target.value })}
                      className="topic-analysis-date-input"
                    />
                    <label>Bitiş:</label>
                    <input 
                      type="date" 
                      value={topicAnalysisDateRange.end || ''}
                      onChange={(e) => setTopicAnalysisDateRange({ ...topicAnalysisDateRange, end: e.target.value })}
                      className="topic-analysis-date-input"
                    />
                  </div>
                )}
              </div>

              <div className="topic-analysis-table-container">
                <table className="topic-analysis-table">
                  <thead>
                    <tr>
                      <th>Konu</th>
                      <th>Başarı %</th>
                      <th>Toplam Soru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopicStats.length > 0 ? (
                      sortedTopicStats.map((stat, idx) => {
                        const { topic, overallPercent, totalQuestions } = stat;
                        const getPercentageClass = (percent) => {
                          if (percent < 50) return 'percent-red';
                          if (percent < 75) return 'percent-yellow';
                          return 'percent-green';
                        };
                        return (
                          <tr key={idx}>
                            <td>{topic}</td>
                            <td className={`topic-percentage ${getPercentageClass(overallPercent)}`}>
                              {overallPercent}%
                            </td>
                            <td className="topic-percentage" style={{ color: '#374151' }}>
                              {totalQuestions}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                          Henüz konu verisi bulunmamaktadır.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              
            </div>

            <div className="topic-analysis-modal-resize" ref={topicAnalysisModalResizeRef}>
              <FontAwesomeIcon icon={faExpandArrowsAlt} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper fonksiyonlar (TemplateCreatorModal için de kullanılacak)
const getProgramIconHelper = (tip) => {
  switch (tip) {
    case 'soru_cozum':
      return faClipboardList;
    case 'konu_anlatim':
      return faBook;
    case 'deneme':
      return faFileAlt;
    default:
      return faCalendarAlt;
  }
};

const getProgramColorHelper = (tip) => {
  switch (tip) {
    case 'soru_cozum':
      return '#3b82f6';
    case 'konu_anlatim':
      return '#10b981';
    case 'deneme':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

const getProgramTypeNameHelper = (tip) => {
  switch (tip) {
    case 'soru_cozum':
      return 'Soru Çözümü';
    case 'konu_anlatim':
      return 'Konu Anlatımı';
    case 'deneme':
      return 'Deneme';
    default:
      return tip;
  }
};

// Şablon Oluşturma Modalı Komponenti
const TemplateCreatorModal = ({ teacherId, onClose, onSave, templateToEdit }) => {
  const [templateName, setTemplateName] = useState(templateToEdit?.name || '');
  const [templateDescription, setTemplateDescription] = useState(templateToEdit?.description || '');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [templatePrograms, setTemplatePrograms] = useState(templateToEdit?.programs || []);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const templateDefaultEtutDuration = useMemo(() => loadStoredEtutDuration(teacherId), [teacherId]);

  // Dinamik ders ve konular için state
  const [dynamicSubjects, setDynamicSubjects] = useState([]);
  const [dynamicTopics, setDynamicTopics] = useState([]);
  const [isDersLoading, setIsDersLoading] = useState(false);
  const [isKonuLoading, setIsKonuLoading] = useState(false);

  const normalizeSubjectNameHelper = (name) => {
    if (!name) return '';
    let n = String(name).toLowerCase().trim();
    n = n.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
    n = n
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    n = n.replace(/-\d+$/, '');
    return n;
  };

  const findSubjectRecordHelper = (ders) => {
    const target = normalizeSubjectNameHelper(ders);
    let subject = dynamicSubjects.find(s => normalizeSubjectNameHelper(s.ders_adi) === target);
    return subject || null;
  };

  const getSubjectIconHelper = (ders) => {
    if (!ders) return null;
    const subject = findSubjectRecordHelper(ders);
    if (subject && subject.icon_url) return subject.icon_url;
    const normalized = normalizeSubjectNameHelper(ders);
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

  const [programForm, setProgramForm] = useState({
    programTipi: 'soru_cozum',
    ders: '',
    konu: '',
    soruSayisi: '',
    baslangicSaati: '',
    bitisSaati: '',
    etutSuresi: templateDefaultEtutDuration,
    isManualKonu: false
  });

  // Dinamik dersleri çek
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsDersLoading(true);
      try {
        // Şablonlar için tüm dersleri getir
        const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_student_subjects.php?alan=all`);
        if (data.success) {
          setDynamicSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error('Dersler yüklenemedi:', error);
      } finally {
        setIsDersLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Seçili ders değiştiğinde konuları çek
  const fetchTopicsForSubject = async (subjectName) => {
    if (!subjectName) {
      setDynamicTopics([]);
      return;
    }

    // Ders adından ID'yi bul (Önce tam eşleşme, sonra kısmi eşleşme dene)
    const normalizedSearch = subjectName.trim().toLowerCase();
    let subject = dynamicSubjects.find(s => 
      s.ders_adi.trim().toLowerCase() === normalizedSearch
    );

    // Tam eşleşme yoksa, TYT/AYT gibi önekleri görmezden gelerek ara
    if (!subject) {
      const searchWithoutPrefix = normalizedSearch.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
      subject = dynamicSubjects.find(s => {
        const normalizedDers = s.ders_adi.trim().toLowerCase();
        const dersWithoutPrefix = normalizedDers.replace(/^(tyt|ayt|lgs|kpss)\s+/i, '').trim();
        return dersWithoutPrefix === searchWithoutPrefix;
      });
    }

    if (!subject || !subject.id) {
      setDynamicTopics([]);
      return;
    }

    setIsKonuLoading(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_subject_topics.php?dersId=${encodeURIComponent(subject.id)}`);
      if (data.success) {
        setDynamicTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Konular yüklenemedi:', error);
    } finally {
      setIsKonuLoading(false);
    }
  };

  const dersOptions = useMemo(() => {
    return dynamicSubjects.map(s => s.ders_adi);
  }, [dynamicSubjects]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeek]);

  const handleAddProgram = () => {
    if (!selectedDay) return;

    const newProgram = {
      id: Date.now().toString(),
      gunNo: selectedDay.getDay() === 0 ? 7 : selectedDay.getDay(), // Pazar = 7
      programTipi: programForm.programTipi,
      ders: programForm.ders,
      konu: programForm.konu || null,
      soruSayisi: programForm.soruSayisi ? parseInt(programForm.soruSayisi) : null,
      baslangicSaati: programForm.baslangicSaati,
      bitisSaati: programForm.bitisSaati
    };

    setTemplatePrograms([...templatePrograms, newProgram]);
    setShowAddProgram(false);
    setDynamicTopics([]);
    setProgramForm({
      programTipi: 'soru_cozum',
      ders: '',
      konu: '',
      soruSayisi: '',
      baslangicSaati: '',
      bitisSaati: '',
      etutSuresi: templateDefaultEtutDuration,
      isManualKonu: false
    });
  };

  const handleTemplateProgramDelete = (programId) => {
    setTemplatePrograms(templatePrograms.filter(p => p.id !== programId));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Şablon adı gereklidir');
      return;
    }

    if (templatePrograms.length === 0) {
      alert('En az bir program eklemelisiniz');
      return;
    }

    try {
      const isEdit = Boolean(templateToEdit?.id);
      const url = isEdit
        ? `${API_BASE}/php-backend/api/update_program_template.php`
        : `${API_BASE}/php-backend/api/save_program_template.php`;

      const payload = isEdit
        ? { templateId: templateToEdit.id, sablonAdi: templateName, aciklama: templateDescription, programs: templatePrograms }
        : { teacherId, sablonAdi: templateName, aciklama: templateDescription, programs: templatePrograms };

      const data = await safeFetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (data.success) {
        onSave();
        alert(isEdit ? 'Şablon güncellendi' : 'Şablon başarıyla kaydedildi');
      } else {
        alert(data.message || (isEdit ? 'Şablon güncellenemedi' : 'Şablon kaydedilemedi'));
      }
    } catch (error) {
      console.error('Şablon kaydet/güncelle hatası:', error);
      alert('Şablon kaydetme/güncelleme başarısız');
    }
  };

  const timeSlots = [];
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + 30;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`;
      timeSlots.push({ start: startTime, end: endTime });
    }
  }

  const getDayPrograms = (day) => {
    const dayNo = day.getDay() === 0 ? 7 : day.getDay();
    return templatePrograms.filter(p => p.gunNo === dayNo);
  };

  return (
    <div className="program-modal-overlay" onClick={onClose}>
      <div className="program-modal template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{color: '#fff'}}>Yeni Şablon Oluştur</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="template-form">
          <div className="form-group">
            <label>Şablon Adı</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Örn: Haftalık Matematik Programı"
              required
            />
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Şablon hakkında açıklama (opsiyonel)"
              rows="3"
            />
          </div>

          <div className="template-calendar-section">
            <div className="week-navigation">
              <button className="nav-btn" onClick={() => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() - 7);
                setCurrentWeek(newWeek);
              }}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <div className="week-range">
                {weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <button className="nav-btn" onClick={() => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() + 7);
                setCurrentWeek(newWeek);
              }}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>

            <div className="template-calendar">
              <div className="calendar-header">
                {weekDays.map((day, index) => (
                  <div key={index} className="day-header">
                    <div className="day-name">
                      {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </div>
                    <div className="day-number">
                      {day.toLocaleDateString('tr-TR', { day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="calendar-body">

                {weekDays.map((day, dayIndex) => {
                  const dayPrograms = getDayPrograms(day);
                  
                  // Programların başlangıç slot index'lerini hesapla
                  const programSlots = dayPrograms.map(prog => {
                    const progStart = prog.baslangicSaati.substring(0, 5);
                    const progEnd = prog.bitisSaati.substring(0, 5);
                    
                    // Başlangıç ve bitiş slot index'lerini bul
                    const startSlotIndex = timeSlots.findIndex(s => s.start === progStart);
                    const endSlotIndex = timeSlots.findIndex(s => s.end === progEnd);
                    
                    // Eğer tam eşleşme yoksa, en yakın slot'u bul
                    let actualStartIndex = startSlotIndex;
                    let actualEndIndex = endSlotIndex;
                    
                    if (actualStartIndex === -1) {
                      actualStartIndex = timeSlots.findIndex(s => progStart >= s.start && progStart < s.end);
                    }
                    if (actualEndIndex === -1) {
                      actualEndIndex = timeSlots.findIndex(s => progEnd > s.start && progEnd <= s.end);
                      if (actualEndIndex === -1) {
                        actualEndIndex = timeSlots.length - 1;
                      }
                    }
                    
                    const slotCount = Math.max(1, (actualEndIndex - actualStartIndex) + 1);
                    
                    return {
                      program: prog,
                      startSlotIndex: actualStartIndex,
                      endSlotIndex: actualEndIndex,
                      slotCount: slotCount
                    };
                  });
                  
                  return (
                    <div key={dayIndex} className="day-column">
                      {/* Program item'larını day-column içinde absolute positioning ile yerleştir */}
                      {programSlots.map((ps, progIndex) => {
                        const prog = ps.program;
                        const topPosition = ps.startSlotIndex * 60; // Her slot 60px
                        const height = ps.slotCount * 60 - 4; // 4px padding için
                        
                        return (
                          <div
                            key={progIndex}
                            className="program-item"
                            style={{ 
                              backgroundColor: getProgramColorHelper(prog.programTipi),
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              position: 'absolute',
                              left: '2px',
                              right: '2px',
                              zIndex: 10
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTemplateProgramDelete(prog.id);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.zIndex = '20';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.zIndex = '10';
                            }}
                          >
                            <div className="program-item-header">
                              <FontAwesomeIcon icon={getProgramIconHelper(prog.programTipi)} />
                              <span className="program-type">{getProgramTypeNameHelper(prog.programTipi)}</span>
                            </div>
                            <div className="program-item-time">
                              {prog.baslangicSaati} - {prog.bitisSaati}
                            </div>
                            <div className="program-item-ders" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {(() => {
                                const iconSrc = getSubjectIconHelper(prog.ders);
                                return iconSrc ? (
                                  <img 
                                    src={iconSrc} 
                                    alt="" 
                                    className="program-item-ders-icon"
                                    onError={(e) => {
                                      console.error('Görsel yüklenemedi:', iconSrc, prog.ders);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : null;
                              })()}
                              <span>{prog.ders}</span>
                            </div>
                            {prog.konu && (
                              <div className="program-item-konu">{prog.konu}</div>
                            )}
                            {prog.soruSayisi && (
                              <div className="program-item-soru">{prog.soruSayisi} soru</div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Time slot'ları render et */}
                      {timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="time-slot"
                          onClick={() => {
                            setSelectedDay(day);
                            setShowAddProgram(true);
                            setProgramForm({
                              ...programForm,
                              baslangicSaati: slot.start,
                              bitisSaati: slot.end
                            });
                          }}
                        >
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {showAddProgram && (
            <div className="program-form-modal">
              <div className="form-group">
                <label>Program Tipi</label>
                <select
                  value={programForm.programTipi}
                  onChange={(e) => setProgramForm({ ...programForm, programTipi: e.target.value })}
                >
                  <option value="soru_cozum">Soru Çözümü</option>
                  <option value="konu_anlatim">Konu Anlatımı</option>
                  <option value="deneme">Deneme</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ders</label>
                <select
                  value={programForm.ders}
                  onChange={(e) => {
                    const newDers = e.target.value;
                    setProgramForm({ ...programForm, ders: newDers, konu: '' });
                    fetchTopicsForSubject(newDers);
                  }}
                  required
                >
                  <option value="">{isDersLoading ? 'Yükleniyor...' : 'Seçiniz'}</option>
                  {dersOptions.map((ders, index) => (
                    <option key={index} value={ders}>{ders}</option>
                  ))}
                </select>
              </div>

              {programForm.programTipi !== 'deneme' && (
                <div className="form-group">
                  <label>Konu</label>
                  {(dynamicTopics.length > 0 || isKonuLoading) ? (
                    <>
                      <select
                        value={(programForm.isManualKonu || (programForm.konu && !dynamicTopics.some(t => t.konu_adi === programForm.konu))) ? 'other' : programForm.konu}
                        onChange={(e) => {
                          if (e.target.value === 'other') {
                            setProgramForm({ ...programForm, isManualKonu: true, konu: '' });
                          } else {
                            setProgramForm({ ...programForm, isManualKonu: false, konu: e.target.value });
                          }
                        }}
                      >
                        <option value="">{isKonuLoading ? 'Yükleniyor...' : 'Konu Seçiniz'}</option>
                        {dynamicTopics.map((topic, index) => (
                          <option key={index} value={topic.konu_adi}>{topic.konu_adi}</option>
                        ))}
                        {!isKonuLoading && <option value="other">Diğer (Manuel Gir)</option>}
                      </select>
                      {(programForm.isManualKonu || (programForm.konu && !dynamicTopics.some(t => t.konu_adi === programForm.konu))) && (
                        <input
                          type="text"
                          style={{marginTop: 8}}
                          placeholder="Konu adını giriniz"
                          value={programForm.konu}
                          onChange={(e) => setProgramForm({ ...programForm, konu: e.target.value })}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={programForm.konu}
                      onChange={(e) => setProgramForm({ ...programForm, konu: e.target.value })}
                      placeholder={isKonuLoading ? 'Yükleniyor...' : "Örn: Türev"}
                    />
                  )}
                </div>
              )}

              {programForm.programTipi === 'soru_cozum' && (
                <div className="form-group">
                  <label>Soru Sayısı</label>
                  <input
                    type="number"
                    value={programForm.soruSayisi}
                    onChange={(e) => setProgramForm({ ...programForm, soruSayisi: e.target.value })}
                    min="1"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Başlangıç Saati</label>
                  <input
                    type="time"
                    value={programForm.baslangicSaati}
                    onChange={(e) => setProgramForm({ ...programForm, baslangicSaati: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bitiş Saati</label>
                  <input
                    type="time"
                    value={programForm.bitisSaati}
                    onChange={(e) => setProgramForm({ ...programForm, bitisSaati: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowAddProgram(false);
                  setDynamicTopics([]);
                }}>
                  İptal
                </button>
                <button type="button" className="save-btn" onClick={handleAddProgram}>
                  Ekle
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              İptal
            </button>
            <button type="button" className="save-btn" onClick={handleSaveTemplate}>
              Şablonu Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OgrenciProgramTab;
