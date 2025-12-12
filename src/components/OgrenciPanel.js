import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faCalendarAlt, faChartPie, faTrophy, faClock } from '@fortawesome/free-solid-svg-icons';
import './Panel.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://vedatdaglarmuhendislik.com.tr';

// Sınav tarihleri (yıllık güncellenebilir)
const EXAM_DATES = {
  lgs: '2025-06-01', // Örnek tarih
  yks: '2025-06-15', // Örnek tarih
  kpss_gkgy: '2025-07-20', // Örnek tarih
  kpss_alan: '2025-07-20', // Örnek tarih
  kpss_egitim: '2025-07-20' // Örnek tarih
};

// Motivasyon mesajları
const MOTIVATION_MESSAGES = [
  "Bugün harika bir gün! Başarılar seninle! 🎯",
  "Her adım seni hedefine yaklaştırıyor! 💪",
  "Azmin ve çabanla her şey mümkün! 🌟",
  "Bugün de harika işler yapacaksın! 👏",
  "Başarı yolculuğunda sen çok güçlüsün! 🚀"
];

const OgrenciPanel = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [examCountdown, setExamCountdown] = useState({ days: 0, examName: '' });
  const [etutStats, setEtutStats] = useState({ yapilan: 0, yapilmayan: 0 });
  const [denemeNetleri, setDenemeNetleri] = useState(null);
  const [etutStatsLoading, setEtutStatsLoading] = useState(true);
  const [denemeLoading, setDenemeLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id || user.role !== 'ogrenci') {
      navigate('/');
      return;
    }

    fetchStudentInfo(user.id);
    fetchEtutStats(user.id);
    fetchDenemeNetleri(user.id);
    
    // Rastgele motivasyon mesajı seç
    setMotivationMessage(MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)]);
  }, []);

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
      // Bu haftanın başlangıç ve bitiş tarihlerini hesapla
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Pazartesi'ye git
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
        
        data.programs.forEach(prog => {
          if (prog.durum === 'yapildi') {
            yapilan++;
          } else {
            yapilmayan++;
          }
        });
        
        setEtutStats({ yapilan, yapilmayan });
      }
      setEtutStatsLoading(false);
    } catch (error) {
      console.error('Etüt istatistikleri yüklenemedi:', error);
      setEtutStatsLoading(false);
    }
  };

  const fetchDenemeNetleri = async (studentId) => {
    try {
      // Önce genel denemeleri çek
      const genelResponse = await fetch(`${API_BASE}/php-backend/api/get_genel_denemeler.php?studentId=${studentId}`);
      const genelData = await genelResponse.json();
      
      if (genelData.success && genelData.denemeler && genelData.denemeler.length > 0) {
        // En son denemeyi al
        const sonDeneme = genelData.denemeler[0];
        let toplamNet = 0;
        
        if (sonDeneme.dersSonuclari) {
          Object.values(sonDeneme.dersSonuclari).forEach(ders => {
            toplamNet += ders.net || 0;
          });
        }
        
        setDenemeNetleri({
          tip: sonDeneme.sinavTipi === 'tyt' ? 'TYT' : 'AYT',
          net: toplamNet.toFixed(2),
          tarih: sonDeneme.denemeTarihi,
          denemeAdi: sonDeneme.denemeAdi
        });
        setDenemeLoading(false);
        return;
      }
      
      // Genel deneme yoksa branş denemelerini kontrol et
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

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id && user.role === 'ogrenci') {
      try {
        // Online durumunu 0 yap
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
  const etutTotal = etutStats.yapilan + etutStats.yapilmayan;
  const yapilanYuzde = etutTotal > 0 ? (etutStats.yapilan / etutTotal) * 100 : 0;
  const yapilmayanYuzde = etutTotal > 0 ? (etutStats.yapilmayan / etutTotal) * 100 : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        background: 'white',
        padding: '20px 32px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          KoçApp
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          Çıkış Yap
        </button>
      </div>

      {/* Ana İçerik */}
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
                {/* Pasta Grafik */}
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
};

export default OgrenciPanel;
