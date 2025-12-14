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
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import './OgretmenPanel.css';
import OgrenciProgramTab from './OgrenciProgramTab';
import Kaynaklar from './Kaynaklar';
import { EXAM_SUBJECTS_BY_AREA } from '../constants/examSubjects';
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

  const menuItems = [
    { id: 'ana-sayfa', icon: faHome, label: 'Ana Sayfa' },
    { id: 'plan-program', icon: faBook, label: 'Plan/ Program' },
    { id: 'kaynak', icon: faBook, label: 'Kaynak' },
    { id: 'konu-ilerlemesi', icon: faClipboardList, label: 'Konu İlerlemesi' },
    { id: 'brans-denemeleri', icon: faBullseye, label: 'Branş Denemeleri' },
    { id: 'genel-denemeler', icon: faClock, label: 'Genel Denemeler' }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'ogrenci') {
      navigate('/');
      return;
    }

    fetchStudentInfo(user.id);
    fetchEtutStats(user.id);
    fetchDenemeNetleri(user.id);
  }, []);

  // Menü değiştiğinde verileri yükle
  useEffect(() => {
    if (!student?.id) return;

    if (activeMenu === 'konu-ilerlemesi' && selectedDersForIlerleme) {
      fetchKonuIlerlemesi();
    }
    if (activeMenu === 'brans-denemeleri') {
      fetchBransDenemeleri();
    }
    if (activeMenu === 'genel-denemeler') {
      fetchGenelDenemeler();
    }
  }, [activeMenu, student, selectedDersForIlerleme]);

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

  // Genel Denemeler - Veri çekme
  const fetchGenelDenemeler = async () => {
    if (!student?.id) return;
    setGenelDenemeListLoading(true);
    try {
      const response = await fetch(`${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${student.id}`);
      const data = await response.json();
      if (data.success && data.denemeler) {
        setGenelDenemeList(data.denemeler || []);
      }
    } catch (error) {
      console.error('Genel denemeler yüklenemedi', error);
      setGenelDenemeList([]);
    } finally {
      setGenelDenemeListLoading(false);
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
          {activeMenu === 'kaynak' && <Kaynaklar />}
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
                        <button
                          onClick={() => setShowKaynakEkleModal(true)}
                          style={{
                            padding: '10px 14px',
                            background: '#6a1b9a',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Kaynak Ekle
                        </button>
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
                        {konuIlerlemesi.map((konu, index) => {
                          const yuzde = calculateYuzde(konu.kaynaklar);
                          const color = yuzde === 100 ? '#10b981' : yuzde >= 50 ? '#f59e0b' : '#ef4444';
                          return (
                            <div key={konu.id || index} style={{
                              padding: '20px',
                              borderBottom: index < konuIlerlemesi.length - 1 ? '1px solid #e5e7eb' : 'none',
                              display: 'grid',
                              gridTemplateColumns: '200px 1fr auto',
                              gap: 20,
                              alignItems: 'center'
                            }}>
                              <div>
                                <div style={{fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: 8}}>
                                  {konu.konu}
                                </div>
                                <div style={{fontSize: '14px', color: '#6b7280'}}>
                                  {konu.durum}
                                </div>
                              </div>
                              <div>
                                {konu.kaynaklar && konu.kaynaklar.length > 0 ? (
                                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                                    {konu.kaynaklar.map((kaynak, kaynakIndex) => (
                                      <div
                                        key={kaynak.id || kaynakIndex}
                                        style={{
                                          padding: '8px 12px',
                                          borderRadius: 8,
                                          background: kaynak.tamamlandi ? '#d1fae5' : '#f3f4f6',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          cursor: 'pointer',
                                          border: `2px solid ${kaynak.tamamlandi ? '#10b981' : '#9ca3af'}`,
                                          transition: 'all 0.2s'
                                        }}
                                        onClick={() => handleKaynakToggle(index, kaynakIndex)}
                                      >
                                        <div style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 4,
                                          border: `2px solid ${kaynak.tamamlandi ? '#10b981' : '#9ca3af'}`,
                                          background: kaynak.tamamlandi ? '#10b981' : 'white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}>
                                          {kaynak.tamamlandi && (
                                            <FontAwesomeIcon icon={faCheck} style={{fontSize: 12, color: 'white'}} />
                                          )}
                                        </div>
                                        <span style={{
                                          fontSize: '14px',
                                          fontWeight: 500,
                                          color: kaynak.tamamlandi ? '#065f46' : '#374151'
                                        }}>
                                          {kaynak.kaynak_adi}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleKaynakSil(index, kaynakIndex);
                                          }}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 4,
                                            color: '#ef4444'
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faTrash} style={{fontSize: 12}} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{color: '#9ca3af', fontSize: '14px'}}>
                                    Henüz kaynak eklenmedi
                                  </div>
                                )}
                              </div>
                              <div style={{textAlign: 'right'}}>
                                <div style={{
                                  fontSize: '24px',
                                  fontWeight: 700,
                                  color: color
                                }}>
                                  {yuzde}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Kaynak Ekle Modal */}
                {showKaynakEkleModal && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}
                  onClick={() => setShowKaynakEkleModal(false)}
                  >
                    <div style={{
                      background: 'white',
                      borderRadius: 12,
                      padding: 24,
                      maxWidth: 400,
                      width: '90%'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                      <h3 style={{margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600}}>
                        Yeni Kaynak Ekle
                      </h3>
                      <input
                        type="text"
                        value={yeniKaynakAdi}
                        onChange={(e) => setYeniKaynakAdi(e.target.value)}
                        placeholder="Kaynak adı"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          marginBottom: 16
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleKaynakEkle();
                          }
                        }}
                      />
                      <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                        <button
                          onClick={() => setShowKaynakEkleModal(false)}
                          style={{
                            padding: '8px 16px',
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
                          style={{
                            padding: '8px 16px',
                            background: '#6a1b9a',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
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
            </div>
          )}
          {activeMenu === 'brans-denemeleri' && (
            <div style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 100px)'}}>
              <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                <h2 style={{fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: 24}}>
                  Branş Denemeleri
                </h2>
                {bransDenemelerLoading ? (
                  <div style={{textAlign: 'center', padding: '80px', color: '#6b7280'}}>
                    Yükleniyor...
                  </div>
                ) : bransDenemeList.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '80px', color: '#6b7280'}}>
                    Henüz branş denemesi yok
                  </div>
                ) : (
                  <div style={{
                    background: 'white',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {bransDenemeList.map((deneme, index) => (
                      <div key={deneme.id || index} style={{
                        padding: '20px',
                        borderBottom: index < bransDenemeList.length - 1 ? '1px solid #e5e7eb' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: 8}}>
                            {deneme.denemeAdi}
                          </div>
                          <div style={{fontSize: '14px', color: '#6b7280'}}>
                            {deneme.ders} - {deneme.denemeTarihi}
                          </div>
                        </div>
                        <div style={{fontSize: '24px', fontWeight: 700, color: '#6a1b9a'}}>
                          {deneme.net?.toFixed ? deneme.net.toFixed(2) : deneme.net} Net
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeMenu === 'genel-denemeler' && (
            <div style={{padding: '32px', background: '#fafafa', minHeight: 'calc(100vh - 100px)'}}>
              <div style={{maxWidth: '1400px', margin: '0 auto'}}>
                <h2 style={{fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: 24}}>
                  Genel Denemeler
                </h2>
                {genelDenemeListLoading ? (
                  <div style={{textAlign: 'center', padding: '80px', color: '#6b7280'}}>
                    Yükleniyor...
                  </div>
                ) : genelDenemeList.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '80px', color: '#6b7280'}}>
                    Henüz genel deneme yok
                  </div>
                ) : (
                  <div style={{
                    background: 'white',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {genelDenemeList.map((deneme, index) => {
                      let toplamNet = 0;
                      if (deneme.dersSonuclari) {
                        Object.values(deneme.dersSonuclari).forEach(ders => {
                          toplamNet += ders.net || 0;
                        });
                      }
                      return (
                        <div key={deneme.id || index} style={{
                          padding: '20px',
                          borderBottom: index < genelDenemeList.length - 1 ? '1px solid #e5e7eb' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: 8}}>
                              {deneme.denemeAdi}
                            </div>
                            <div style={{fontSize: '14px', color: '#6b7280'}}>
                              {deneme.sinavTipi?.toUpperCase() || 'Genel Deneme'} - {deneme.denemeTarihi}
                            </div>
                          </div>
                          <div style={{fontSize: '24px', fontWeight: 700, color: '#6a1b9a'}}>
                            {toplamNet.toFixed(2)} Net
                          </div>
                        </div>
                      );
                    })}
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