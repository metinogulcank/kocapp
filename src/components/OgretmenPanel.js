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
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './OgretmenPanel.css';
import studentImg from '../assets/student-img.png';
import Bildirimler from './Bildirimler';
import Kaynaklar from './Kaynaklar';
import OgretmenProfilTab from './OgretmenProfilTab';
import OgrenciProgramTab from './OgrenciProgramTab';
import { EXAM_CATEGORY_OPTIONS } from '../constants/examSubjects';

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
    { id: 'gunluk-soru', icon: faStickyNote, label: 'Günlük Soru Girişi' },
    { id: 'kaynak-takibi', icon: faChartLine, label: 'Kaynak Takibi' },
    { id: 'brans-denemeleri', icon: faBullseye, label: 'Brans Denemeleri' },
    { id: 'genel-denemeler', icon: faClock, label: 'Genel Denemeler' },
    { id: 'yapay-zeka', icon: faRobot, label: 'Yapay Zeka' },
    { id: 'kaynak-onerileri', icon: faLightbulb, label: 'Kaynak Önerileri' }
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
        history: student.history || [] // Backend'den gelebilir
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
    passwordConfirm: ''
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [stuUploading, setStuUploading] = useState(false);

  const API_STUDENT = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/create_student.php";
  const API_PHOTO = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/upload_teacher_photo.php";

  // Öğrencileri backend'den çek
  const fetchStudents = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      setStudentsLoading(false);
      return;
    }
    
    fetch(`https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_teacher_students.php?teacherId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.students) {
          // Backend formatını frontend formatına çevir
          const formattedStudents = data.students.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            class: s.className,
            alan: s.alan || null,
            online: false, // Varsayılan, gerçek zamanlı kontrol eklenebilir
            overdue: 0, // Varsayılan
            completed: 0, // Varsayılan
            photo: s.profilePhoto || null,
            email: s.email,
            phone: s.phone
          }));
          setStudents(formattedStudents);
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
    const payload = {
      ...studentForm,
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
        alan: '', firstName: '', lastName: '', email: '', phone: '', className: '', profilePhoto: '', password: '', passwordConfirm: ''
      });
      setShowAddStudentModal(false);
      // Öğrenci listesini yenile
      fetchStudents();
    } catch (err) {
      setAddError(err.message);
    }
    setAdding(false);
  }

  if (studentPanelActive && selectedStudent) {
    return (
      <div className="ogretmen-panel student-panel">
        {/* Sol Sidebar - Öğrenci Paneli */}
        <div className="sidebar student-sidebar">
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
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Günlük Soru Girişi - {selectedStudent.name}</h1>
                    <p className="welcome-subtitle">Öğrenci için günlük soru atama ve takip sistemi</p>
                  </div>
                  <div className="current-date">
                    {new Date().toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Günlük Soru Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faStickyNote} />
                    </div>
                    <div className="card-content">
                      <h3>Bugün Atanan Sorular</h3>
                      <div className="card-number">25</div>
                      <div className="card-subtitle">Matematik + Fizik</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Bu Hafta Toplam</h3>
                      <div className="card-number">150</div>
                      <div className="card-subtitle">%85 tamamlandı</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '85%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="card-content">
                      <h3>Bekleyen Sorular</h3>
                      <div className="card-number">8</div>
                      <div className="card-subtitle">Çözülmeyi bekliyor</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Günlük Soru</h3>
                      <div className="card-number">30</div>
                      <div className="card-subtitle">Günlük hedef</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '83%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'soru-ekle' ? 'active' : ''}`}
                      onClick={() => setActiveTab('soru-ekle')}
                    >
                      Soru Ekle
                    </button>
                    <button 
                      className={`tab ${activeTab === 'gunluk-listesi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('gunluk-listesi')}
                    >
                      Günlük Liste
                    </button>
                    <button 
                      className={`tab ${activeTab === 'takvim' ? 'active' : ''}`}
                      onClick={() => setActiveTab('takvim')}
                    >
                      Soru Takvimi
                    </button>
                  </div>
                </div>

                {/* Soru Ekleme Sekmesi */}
                {activeTab === 'soru-ekle' && (
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

                {/* Günlük Liste Sekmesi */}
                {activeTab === 'gunluk-listesi' && (
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

                {/* Soru Takvimi Sekmesi */}
                {activeTab === 'takvim' && (
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
            ) : activeMenu === 'kaynak-takibi' ? (
              <div className="kaynak-takibi-content">
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Kaynak Takibi - {selectedStudent.name}</h1>
                    <p className="welcome-subtitle">Öğrenci kaynak kullanımı ve ilerleme takibi</p>
                  </div>
                  <div className="current-date">
                    {new Date().toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Kaynak Takibi Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <div className="card-content">
                      <h3>Aktif Kaynaklar</h3>
                      <div className="card-number">8</div>
                      <div className="card-subtitle">Şu anda kullanılan</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Toplam Çözülen</h3>
                      <div className="card-number">1,250</div>
                      <div className="card-subtitle">Bu dönem soru</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '78%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="card-content">
                      <h3>Tamamlanan Konular</h3>
                      <div className="card-number">24</div>
                      <div className="card-subtitle">Konu sayısı</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Başarı</h3>
                      <div className="card-number">%85</div>
                      <div className="card-subtitle">Mevcut: %82</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '82%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'kaynak-listesi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('kaynak-listesi')}
                    >
                      Kaynak Listesi
                    </button>
                    <button 
                      className={`tab ${activeTab === 'konu-takibi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('konu-takibi')}
                    >
                      Konu Takibi
                    </button>
                    <button 
                      className={`tab ${activeTab === 'istatistikler' ? 'active' : ''}`}
                      onClick={() => setActiveTab('istatistikler')}
                    >
                      İstatistikler
                    </button>
                  </div>
                </div>

                {/* Kaynak Listesi Sekmesi */}
                {activeTab === 'kaynak-listesi' && (
                  <div className="kaynak-listesi">
                    <div className="section-header">
                      <h2>Kaynak Listesi</h2>
                      <button className="kaynak-ekle-btn">
                        <FontAwesomeIcon icon={faBook} />
                        Yeni Kaynak Ekle
                      </button>
                      </div>

                    <div className="kaynak-grid">
                      <div className="kaynak-kart">
                        <div className="kaynak-header">
                          <div className="kaynak-bilgi">
                            <h3>Matematik - Apotemi Yayınları</h3>
                            <p>Köklü Sayılar Konusu</p>
                    </div>
                          <span className="kaynak-durum completed">Tamamlandı</span>
                        </div>
                        <div className="kaynak-icerik">
                          <div className="kaynak-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Toplam Soru:</span>
                              <span className="istatistik-deger">150</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Çözülen:</span>
                              <span className="istatistik-deger">150</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Başarı:</span>
                              <span className="istatistik-deger">%92</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Sayfa:</span>
                              <span className="istatistik-deger">45-67</span>
                            </div>
                          </div>
                          <div className="kaynak-tarih">
                            <span>Başlangıç: 10 Ekim 2024</span>
                            <span>Bitiş: 15 Ekim 2024</span>
                          </div>
                        </div>
                        <div className="kaynak-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Detay</button>
                  </div>
                </div>

                      <div className="kaynak-kart">
                        <div className="kaynak-header">
                          <div className="kaynak-bilgi">
                            <h3>Fizik - Bilfen Yayınları</h3>
                            <p>Hareket Konusu</p>
                          </div>
                          <span className="kaynak-durum in-progress">Devam Ediyor</span>
                        </div>
                        <div className="kaynak-icerik">
                          <div className="kaynak-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Toplam Soru:</span>
                              <span className="istatistik-deger">75</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Çözülen:</span>
                              <span className="istatistik-deger">45</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Başarı:</span>
                              <span className="istatistik-deger">%87</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Sayfa:</span>
                              <span className="istatistik-deger">23-45</span>
                            </div>
                          </div>
                          <div className="kaynak-tarih">
                            <span>Başlangıç: 12 Ekim 2024</span>
                            <span>Hedef: 20 Ekim 2024</span>
                          </div>
                        </div>
                        <div className="kaynak-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Detay</button>
                        </div>
                  </div>

                      <div className="kaynak-kart">
                        <div className="kaynak-header">
                          <div className="kaynak-bilgi">
                            <h3>Kimya - Karekök Yayınları</h3>
                            <p>Atom Teorisi Konusu</p>
                  </div>
                          <span className="kaynak-durum pending">Bekliyor</span>
                        </div>
                        <div className="kaynak-icerik">
                          <div className="kaynak-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Toplam Soru:</span>
                              <span className="istatistik-deger">100</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Çözülen:</span>
                              <span className="istatistik-deger">0</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Başarı:</span>
                              <span className="istatistik-deger">-</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Sayfa:</span>
                              <span className="istatistik-deger">12-28</span>
                            </div>
                          </div>
                          <div className="kaynak-tarih">
                            <span>Başlangıç: 18 Ekim 2024</span>
                            <span>Hedef: 25 Ekim 2024</span>
                          </div>
                        </div>
                        <div className="kaynak-actions">
                          <button className="action-btn edit">Düzenle</button>
                          <button className="action-btn view">Detay</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Konu Takibi Sekmesi */}
                {activeTab === 'konu-takibi' && (
                  <div className="konu-takibi">
                    <div className="section-header">
                      <h2>Konu Takibi</h2>
                      <div className="filtreler">
                        <select className="filter-select">
                          <option>Tüm Dersler</option>
                          <option>Matematik</option>
                          <option>Fizik</option>
                          <option>Kimya</option>
                        </select>
                        <select className="filter-select">
                          <option>Tüm Durumlar</option>
                          <option>Tamamlandı</option>
                          <option>Devam Ediyor</option>
                          <option>Bekliyor</option>
                        </select>
                    </div>
                      </div>

                    <div className="konu-takip-grid">
                      <div className="ders-kart">
                        <div className="ders-header">
                          <h3>Matematik</h3>
                          <span className="ders-ilerleme">%85 Tamamlandı</span>
                      </div>
                        <div className="konu-listesi">
                          <div className="konu-item completed">
                            <span className="konu-adi">Köklü Sayılar</span>
                            <span className="konu-soru">150/150</span>
                            <span className="konu-basari">%92</span>
                    </div>
                          <div className="konu-item completed">
                            <span className="konu-adi">Fonksiyonlar</span>
                            <span className="konu-soru">120/120</span>
                            <span className="konu-basari">%88</span>
                  </div>
                          <div className="konu-item in-progress">
                            <span className="konu-adi">Türev</span>
                            <span className="konu-soru">45/80</span>
                            <span className="konu-basari">%85</span>
                </div>
                          <div className="konu-item pending">
                            <span className="konu-adi">İntegral</span>
                            <span className="konu-soru">0/100</span>
                            <span className="konu-basari">-</span>
                          </div>
                        </div>
                      </div>

                      <div className="ders-kart">
                        <div className="ders-header">
                          <h3>Fizik</h3>
                          <span className="ders-ilerleme">%60 Tamamlandı</span>
                        </div>
                        <div className="konu-listesi">
                          <div className="konu-item completed">
                            <span className="konu-adi">Hareket</span>
                            <span className="konu-soru">75/75</span>
                            <span className="konu-basari">%87</span>
                          </div>
                          <div className="konu-item in-progress">
                            <span className="konu-adi">Kuvvet</span>
                            <span className="konu-soru">30/60</span>
                            <span className="konu-basari">%83</span>
                          </div>
                          <div className="konu-item pending">
                            <span className="konu-adi">Enerji</span>
                            <span className="konu-soru">0/90</span>
                            <span className="konu-basari">-</span>
                          </div>
                        </div>
                      </div>

                      <div className="ders-kart">
                        <div className="ders-header">
                          <h3>Kimya</h3>
                          <span className="ders-ilerleme">%25 Tamamlandı</span>
                        </div>
                        <div className="konu-listesi">
                          <div className="konu-item pending">
                            <span className="konu-adi">Atom Teorisi</span>
                            <span className="konu-soru">0/100</span>
                            <span className="konu-basari">-</span>
                          </div>
                          <div className="konu-item pending">
                            <span className="konu-adi">Periyodik Tablo</span>
                            <span className="konu-soru">0/80</span>
                            <span className="konu-basari">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* İstatistikler Sekmesi */}
                {activeTab === 'istatistikler' && (
                  <div className="istatistikler">
                    <div className="section-header">
                      <h2>İstatistikler</h2>
                      <div className="tarih-filtre">
                        <select className="filter-select">
                          <option>Bu Hafta</option>
                          <option>Bu Ay</option>
                          <option>Bu Dönem</option>
                          <option>Tüm Zamanlar</option>
                        </select>
                      </div>
                    </div>

                    <div className="istatistik-grid">
                      <div className="istatistik-kart">
                        <h3>Ders Bazlı Dağılım</h3>
                        <div className="ders-dagilim">
                          <div className="ders-item">
                            <span className="ders-adi">Matematik</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '45%'}}></div>
                            </div>
                            <span className="ders-sayi">450 soru</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Fizik</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '30%'}}></div>
                            </div>
                            <span className="ders-sayi">300 soru</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Kimya</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '15%'}}></div>
                            </div>
                            <span className="ders-sayi">150 soru</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Biyoloji</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '10%'}}></div>
                            </div>
                            <span className="ders-sayi">100 soru</span>
                          </div>
                        </div>
                      </div>

                      <div className="istatistik-kart">
                        <h3>Haftalık Performans</h3>
                        <div className="haftalik-performans">
                          <div className="hafta-item">
                            <span className="hafta-adi">Bu Hafta</span>
                            <span className="hafta-soru">125 soru</span>
                            <span className="hafta-basari">%88</span>
                          </div>
                          <div className="hafta-item">
                            <span className="hafta-adi">Geçen Hafta</span>
                            <span className="hafta-soru">110 soru</span>
                            <span className="hafta-basari">%85</span>
                          </div>
                          <div className="hafta-item">
                            <span className="hafta-adi">2 Hafta Önce</span>
                            <span className="hafta-soru">95 soru</span>
                            <span className="hafta-basari">%82</span>
                          </div>
                        </div>
                      </div>

                      <div className="istatistik-kart">
                        <h3>Yayın Bazlı Dağılım</h3>
                        <div className="yayin-dagilim">
                          <div className="yayin-item">
                            <span className="yayin-adi">Apotemi</span>
                            <span className="yayin-sayi">400 soru</span>
                          </div>
                          <div className="yayin-item">
                            <span className="yayin-adi">Bilfen</span>
                            <span className="yayin-sayi">300 soru</span>
                          </div>
                          <div className="yayin-item">
                            <span className="yayin-adi">Karekök</span>
                            <span className="yayin-sayi">200 soru</span>
                          </div>
                          <div className="yayin-item">
                            <span className="yayin-adi">Çözüm</span>
                            <span className="yayin-sayi">100 soru</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeMenu === 'brans-denemeleri' ? (
              <div className="brans-denemeleri-content">
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Branş Denemeleri - {selectedStudent.name}</h1>
                    <p className="welcome-subtitle">Öğrenci deneme sınavları ve performans takibi</p>
                  </div>
                  <div className="current-date">
                    {new Date().toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Branş Denemeleri Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faClipboardList} />
                    </div>
                    <div className="card-content">
                      <h3>Bu Ay Çözülen</h3>
                      <div className="card-number">12</div>
                      <div className="card-subtitle">Deneme sayısı</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Ortalama Puan</h3>
                      <div className="card-number">78.5</div>
                      <div className="card-subtitle">Son 5 deneme</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '78%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faTrophy} />
                    </div>
                    <div className="card-content">
                      <h3>En Yüksek Puan</h3>
                      <div className="card-number">92.3</div>
                      <div className="card-subtitle">Matematik denemesi</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Puan</h3>
                      <div className="card-number">85</div>
                      <div className="card-subtitle">Güncel: 78.5</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '92%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'deneme-listesi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('deneme-listesi')}
                    >
                      Deneme Listesi
                    </button>
                    <button 
                      className={`tab ${activeTab === 'deneme-ekle' ? 'active' : ''}`}
                      onClick={() => setActiveTab('deneme-ekle')}
                    >
                      Deneme Ekle
                    </button>
                    <button 
                      className={`tab ${activeTab === 'performans' ? 'active' : ''}`}
                      onClick={() => setActiveTab('performans')}
                    >
                      Performans Analizi
                    </button>
                  </div>
                </div>

                {/* Deneme Listesi Sekmesi */}
                {activeTab === 'deneme-listesi' && (
                  <div className="deneme-listesi">
                    <div className="section-header">
                      <h2>Deneme Listesi</h2>
                      <div className="filtreler">
                        <select className="filter-select">
                          <option>Tüm Dersler</option>
                          <option>Matematik</option>
                          <option>Fizik</option>
                          <option>Kimya</option>
                          <option>Biyoloji</option>
                        </select>
                        <select className="filter-select">
                          <option>Tüm Tarihler</option>
                          <option>Bu Hafta</option>
                          <option>Bu Ay</option>
                          <option>Bu Dönem</option>
                        </select>
                      </div>
                    </div>

                    <div className="deneme-grid">
                      <div className="deneme-kart">
                        <div className="deneme-header">
                          <div className="deneme-bilgi">
                            <h3>Matematik Denemesi #15</h3>
                            <p>Apotemi Yayınları - 2024</p>
                          </div>
                          <span className="deneme-puan">92.3</span>
                        </div>
                        <div className="deneme-icerik">
                          <div className="deneme-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Soru Sayısı:</span>
                              <span className="istatistik-deger">40</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Doğru:</span>
                              <span className="istatistik-deger">37</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Yanlış:</span>
                              <span className="istatistik-deger">3</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Süre:</span>
                              <span className="istatistik-deger">75 dk</span>
                            </div>
                          </div>
                          <div className="deneme-tarih">
                            <span>Tarih: 15 Ekim 2024</span>
                            <span>Süre: 14:30 - 15:45</span>
                          </div>
                        </div>
                        <div className="deneme-actions">
                          <button className="action-btn view">Detay</button>
                          <button className="action-btn edit">Düzenle</button>
                        </div>
                      </div>

                      <div className="deneme-kart">
                        <div className="deneme-header">
                          <div className="deneme-bilgi">
                            <h3>Fizik Denemesi #8</h3>
                            <p>Bilfen Yayınları - 2024</p>
                          </div>
                          <span className="deneme-puan">85.7</span>
                        </div>
                        <div className="deneme-icerik">
                          <div className="deneme-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Soru Sayısı:</span>
                              <span className="istatistik-deger">30</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Doğru:</span>
                              <span className="istatistik-deger">26</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Yanlış:</span>
                              <span className="istatistik-deger">4</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Süre:</span>
                              <span className="istatistik-deger">60 dk</span>
                            </div>
                          </div>
                          <div className="deneme-tarih">
                            <span>Tarih: 12 Ekim 2024</span>
                            <span>Süre: 10:00 - 11:00</span>
                          </div>
                        </div>
                        <div className="deneme-actions">
                          <button className="action-btn view">Detay</button>
                          <button className="action-btn edit">Düzenle</button>
                        </div>
                      </div>

                      <div className="deneme-kart">
                        <div className="deneme-header">
                          <div className="deneme-bilgi">
                            <h3>Kimya Denemesi #5</h3>
                            <p>Karekök Yayınları - 2024</p>
                          </div>
                          <span className="deneme-puan">78.2</span>
                        </div>
                        <div className="deneme-icerik">
                          <div className="deneme-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Soru Sayısı:</span>
                              <span className="istatistik-deger">25</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Doğru:</span>
                              <span className="istatistik-deger">20</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Yanlış:</span>
                              <span className="istatistik-deger">5</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Süre:</span>
                              <span className="istatistik-deger">45 dk</span>
                            </div>
                          </div>
                          <div className="deneme-tarih">
                            <span>Tarih: 10 Ekim 2024</span>
                            <span>Süre: 16:00 - 16:45</span>
                          </div>
                        </div>
                        <div className="deneme-actions">
                          <button className="action-btn view">Detay</button>
                          <button className="action-btn edit">Düzenle</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deneme Ekleme Sekmesi */}
                {activeTab === 'deneme-ekle' && (
                  <div className="deneme-ekleme">
                    <div className="section-header">
                      <h2>Yeni Deneme Ekle</h2>
                      <button className="hizli-ekle-btn">
                        <FontAwesomeIcon icon={faClipboardList} />
                        Hızlı Ekle
                      </button>
                    </div>

                    <div className="deneme-ekleme-form">
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
                          <label>Deneme Adı</label>
                          <input type="text" className="form-input" placeholder="Örn: Matematik Denemesi #16" />
                        </div>
                      </div>
                      
                      <div className="form-row">
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
                        <div className="form-group">
                          <label>Soru Sayısı</label>
                          <input type="number" className="form-input" placeholder="40" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Deneme Tarihi</label>
                          <input type="date" className="form-input" />
                        </div>
                        <div className="form-group">
                          <label>Süre (Dakika)</label>
                          <input type="number" className="form-input" placeholder="75" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Başlangıç Saati</label>
                          <input type="time" className="form-input" />
                        </div>
                        <div className="form-group">
                          <label>Bitiş Saati</label>
                          <input type="time" className="form-input" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Deneme Notları</label>
                        <textarea className="form-textarea" placeholder="Deneme hakkında özel notlar..." rows="3"></textarea>
                      </div>

                      <div className="form-actions">
                        <button className="submit-btn">Denemeyi Kaydet</button>
                        <button className="cancel-btn">İptal</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performans Analizi Sekmesi */}
                {activeTab === 'performans' && (
                  <div className="performans-analizi">
                    <div className="section-header">
                      <h2>Performans Analizi</h2>
                      <div className="tarih-filtre">
                        <select className="filter-select">
                          <option>Son 1 Ay</option>
                          <option>Son 3 Ay</option>
                          <option>Bu Dönem</option>
                          <option>Tüm Zamanlar</option>
                        </select>
                      </div>
                    </div>

                    <div className="performans-grid">
                      <div className="performans-kart">
                        <h3>Ders Bazlı Performans</h3>
                        <div className="ders-performans">
                          <div className="ders-item">
                            <span className="ders-adi">Matematik</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '92%'}}></div>
                            </div>
                            <span className="ders-puan">92.3</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Fizik</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '85%'}}></div>
                            </div>
                            <span className="ders-puan">85.7</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Kimya</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '78%'}}></div>
                            </div>
                            <span className="ders-puan">78.2</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Biyoloji</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '82%'}}></div>
                            </div>
                            <span className="ders-puan">82.1</span>
                          </div>
                        </div>
                      </div>

                      <div className="performans-kart">
                        <h3>Haftalık Trend</h3>
                        <div className="haftalik-trend">
                          <div className="hafta-item">
                            <span className="hafta-adi">Bu Hafta</span>
                            <span className="hafta-puan">85.2</span>
                            <span className="trend-ok">↗</span>
                          </div>
                          <div className="hafta-item">
                            <span className="hafta-adi">Geçen Hafta</span>
                            <span className="hafta-puan">82.7</span>
                            <span className="trend-ok">↗</span>
                          </div>
                          <div className="hafta-item">
                            <span className="hafta-adi">2 Hafta Önce</span>
                            <span className="hafta-puan">79.3</span>
                            <span className="trend-ok">↘</span>
                          </div>
                        </div>
                      </div>

                      <div className="performans-kart">
                        <h3>Konu Bazlı Analiz</h3>
                        <div className="konu-analiz">
                          <div className="konu-item">
                            <span className="konu-adi">Köklü Sayılar</span>
                            <span className="konu-puan">%95</span>
                            <span className="konu-durum excellent">Mükemmel</span>
                          </div>
                          <div className="konu-item">
                            <span className="konu-adi">Fonksiyonlar</span>
                            <span className="konu-puan">%88</span>
                            <span className="konu-durum good">İyi</span>
                          </div>
                          <div className="konu-item">
                            <span className="konu-adi">Türev</span>
                            <span className="konu-puan">%75</span>
                            <span className="konu-durum average">Orta</span>
                          </div>
                          <div className="konu-item">
                            <span className="konu-adi">İntegral</span>
                            <span className="konu-puan">%65</span>
                            <span className="konu-durum weak">Zayıf</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeMenu === 'genel-denemeler' ? (
              <div className="genel-denemeler-content">
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Genel Denemeler - {selectedStudent.name}</h1>
                    <p className="welcome-subtitle">Öğrenci genel deneme sınavları ve performans takibi</p>
                  </div>
                  <div className="current-date">
                    {new Date().toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Genel Denemeler Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faClipboardList} />
                    </div>
                    <div className="card-content">
                      <h3>Bu Ay Çözülen</h3>
                      <div className="card-number">8</div>
                      <div className="card-subtitle">Genel deneme sayısı</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Ortalama Puan</h3>
                      <div className="card-number">425.8</div>
                      <div className="card-subtitle">Son 3 deneme</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '85%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faTrophy} />
                    </div>
                    <div className="card-content">
                      <h3>En Yüksek Puan</h3>
                      <div className="card-number">468.5</div>
                      <div className="card-subtitle">TYT Denemesi</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Puan</h3>
                      <div className="card-number">450</div>
                      <div className="card-subtitle">Güncel: 425.8</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '95%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'genel-deneme-listesi' ? 'active' : ''}`}
                      onClick={() => setActiveTab('genel-deneme-listesi')}
                    >
                      Deneme Listesi
                    </button>
                    <button 
                      className={`tab ${activeTab === 'genel-deneme-ekle' ? 'active' : ''}`}
                      onClick={() => setActiveTab('genel-deneme-ekle')}
                    >
                      Deneme Ekle
                    </button>
                    <button 
                      className={`tab ${activeTab === 'genel-performans' ? 'active' : ''}`}
                      onClick={() => setActiveTab('genel-performans')}
                    >
                      Performans Analizi
                    </button>
                  </div>
                </div>

                {/* Genel Deneme Listesi Sekmesi */}
                {activeTab === 'genel-deneme-listesi' && (
                  <div className="genel-deneme-listesi">
                    <div className="section-header">
                      <h2>Genel Deneme Listesi</h2>
                      <div className="filtreler">
                        <select className="filter-select">
                          <option>Tüm Denemeler</option>
                          <option>TYT</option>
                          <option>AYT</option>
                          <option>YKS</option>
                        </select>
                        <select className="filter-select">
                          <option>Tüm Tarihler</option>
                          <option>Bu Hafta</option>
                          <option>Bu Ay</option>
                          <option>Bu Dönem</option>
                        </select>
                      </div>
                    </div>

                    <div className="genel-deneme-grid">
                      <div className="genel-deneme-kart">
                        <div className="genel-deneme-header">
                          <div className="genel-deneme-bilgi">
                            <h3>TYT Denemesi #12</h3>
                            <p>ÖSYM Format - 2024</p>
                          </div>
                          <span className="genel-deneme-puan">468.5</span>
                        </div>
                        <div className="genel-deneme-icerik">
                          <div className="genel-deneme-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Toplam Puan:</span>
                              <span className="istatistik-deger">468.5</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Matematik:</span>
                              <span className="istatistik-deger">38.2</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Türkçe:</span>
                              <span className="istatistik-deger">35.8</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Süre:</span>
                              <span className="istatistik-deger">165 dk</span>
                            </div>
                          </div>
                          <div className="genel-deneme-tarih">
                            <span>Tarih: 18 Ekim 2024</span>
                            <span>Süre: 09:00 - 11:45</span>
                          </div>
                        </div>
                        <div className="genel-deneme-actions">
                          <button className="action-btn view">Detay</button>
                          <button className="action-btn edit">Düzenle</button>
                        </div>
                      </div>

                      <div className="genel-deneme-kart">
                        <div className="genel-deneme-header">
                          <div className="genel-deneme-bilgi">
                            <h3>AYT Denemesi #8</h3>
                            <p>ÖSYM Format - 2024</p>
                          </div>
                          <span className="genel-deneme-puan">412.3</span>
                        </div>
                        <div className="genel-deneme-icerik">
                          <div className="genel-deneme-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Toplam Puan:</span>
                              <span className="istatistik-deger">412.3</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Matematik:</span>
                              <span className="istatistik-deger">32.1</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Fizik:</span>
                              <span className="istatistik-deger">28.5</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Süre:</span>
                              <span className="istatistik-deger">180 dk</span>
                            </div>
                          </div>
                          <div className="genel-deneme-tarih">
                            <span>Tarih: 15 Ekim 2024</span>
                            <span>Süre: 14:00 - 17:00</span>
                          </div>
                        </div>
                        <div className="genel-deneme-actions">
                          <button className="action-btn view">Detay</button>
                          <button className="action-btn edit">Düzenle</button>
                        </div>
                      </div>

                      <div className="genel-deneme-kart">
                        <div className="genel-deneme-header">
                          <div className="genel-deneme-bilgi">
                            <h3>YKS Denemesi #5</h3>
                            <p>ÖSYM Format - 2024</p>
                          </div>
                          <span className="genel-deneme-puan">396.7</span>
                        </div>
                        <div className="genel-deneme-icerik">
                          <div className="genel-deneme-istatistikler">
                            <div className="istatistik-item">
                              <span className="istatistik-label">Toplam Puan:</span>
                              <span className="istatistik-deger">396.7</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">TYT Puanı:</span>
                              <span className="istatistik-deger">245.2</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">AYT Puanı:</span>
                              <span className="istatistik-deger">151.5</span>
                            </div>
                            <div className="istatistik-item">
                              <span className="istatistik-label">Süre:</span>
                              <span className="istatistik-deger">345 dk</span>
                            </div>
                          </div>
                          <div className="genel-deneme-tarih">
                            <span>Tarih: 12 Ekim 2024</span>
                            <span>Süre: 09:00 - 14:45</span>
                          </div>
                        </div>
                        <div className="genel-deneme-actions">
                          <button className="action-btn view">Detay</button>
                          <button className="action-btn edit">Düzenle</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Genel Deneme Ekleme Sekmesi */}
                {activeTab === 'genel-deneme-ekle' && (
                  <div className="genel-deneme-ekleme">
                    <div className="section-header">
                      <h2>Yeni Genel Deneme Ekle</h2>
                      <button className="hizli-ekle-btn">
                        <FontAwesomeIcon icon={faClipboardList} />
                        Hızlı Ekle
                      </button>
                    </div>

                    <div className="genel-deneme-ekleme-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Deneme Türü</label>
                          <select className="form-select">
                            <option>TYT</option>
                            <option>AYT</option>
                            <option>YKS (TYT+AYT)</option>
                            <option>Genel Deneme</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Deneme Adı</label>
                          <input type="text" className="form-input" placeholder="Örn: TYT Denemesi #13" />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Yayın Evi</label>
                          <select className="form-select">
                            <option>ÖSYM Format</option>
                            <option>Apotemi Yayınları</option>
                            <option>Bilfen Yayınları</option>
                            <option>Karekök Yayınları</option>
                            <option>Çözüm Yayınları</option>
                            <option>Palme Yayınları</option>
                            <option>Limit Yayınları</option>
                            <option>Diğer</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Deneme Tarihi</label>
                          <input type="date" className="form-input" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Başlangıç Saati</label>
                          <input type="time" className="form-input" />
                        </div>
                        <div className="form-group">
                          <label>Bitiş Saati</label>
                          <input type="time" className="form-input" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>TYT Süre (Dakika)</label>
                          <input type="number" className="form-input" placeholder="165" />
                        </div>
                        <div className="form-group">
                          <label>AYT Süre (Dakika)</label>
                          <input type="number" className="form-input" placeholder="180" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Deneme Notları</label>
                        <textarea className="form-textarea" placeholder="Deneme hakkında özel notlar..." rows="3"></textarea>
                      </div>

                      <div className="form-actions">
                        <button className="submit-btn">Denemeyi Kaydet</button>
                        <button className="cancel-btn">İptal</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Genel Performans Analizi Sekmesi */}
                {activeTab === 'genel-performans' && (
                  <div className="genel-performans-analizi">
                    <div className="section-header">
                      <h2>Genel Performans Analizi</h2>
                      <div className="tarih-filtre">
                        <select className="filter-select">
                          <option>Son 1 Ay</option>
                          <option>Son 3 Ay</option>
                          <option>Bu Dönem</option>
                          <option>Tüm Zamanlar</option>
                        </select>
                      </div>
                    </div>

                    <div className="genel-performans-grid">
                      <div className="genel-performans-kart">
                        <h3>Deneme Türü Bazlı Performans</h3>
                        <div className="deneme-turu-performans">
                          <div className="deneme-turu-item">
                            <span className="deneme-turu-adi">TYT</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '95%'}}></div>
                            </div>
                            <span className="deneme-turu-puan">468.5</span>
                          </div>
                          <div className="deneme-turu-item">
                            <span className="deneme-turu-adi">AYT</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '85%'}}></div>
                            </div>
                            <span className="deneme-turu-puan">412.3</span>
                          </div>
                          <div className="deneme-turu-item">
                            <span className="deneme-turu-adi">YKS</span>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '78%'}}></div>
                            </div>
                            <span className="deneme-turu-puan">396.7</span>
                          </div>
                        </div>
                      </div>

                      <div className="genel-performans-kart">
                        <h3>Haftalık Trend</h3>
                        <div className="haftalik-trend">
                          <div className="hafta-item">
                            <span className="hafta-adi">Bu Hafta</span>
                            <span className="hafta-puan">425.8</span>
                            <span className="trend-ok">↗</span>
                          </div>
                          <div className="hafta-item">
                            <span className="hafta-adi">Geçen Hafta</span>
                            <span className="hafta-puan">418.2</span>
                            <span className="trend-ok">↗</span>
                          </div>
                          <div className="hafta-item">
                            <span className="hafta-adi">2 Hafta Önce</span>
                            <span className="hafta-puan">405.6</span>
                            <span className="trend-ok">↘</span>
                          </div>
                        </div>
                      </div>

                      <div className="genel-performans-kart">
                        <h3>Ders Bazlı Analiz</h3>
                        <div className="ders-analiz">
                          <div className="ders-item">
                            <span className="ders-adi">Matematik</span>
                            <span className="ders-puan">35.2</span>
                            <span className="ders-durum excellent">Mükemmel</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Türkçe</span>
                            <span className="ders-puan">32.8</span>
                            <span className="ders-durum good">İyi</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Fizik</span>
                            <span className="ders-puan">28.5</span>
                            <span className="ders-durum average">Orta</span>
                          </div>
                          <div className="ders-item">
                            <span className="ders-adi">Kimya</span>
                            <span className="ders-puan">25.3</span>
                            <span className="ders-durum weak">Zayıf</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeMenu === 'yapay-zeka' ? (
              <div className="yapay-zeka-content">
                {/* Başlık ve Tarih */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h1 className="welcome-title">Yapay Zeka Asistanı - {selectedStudent.name}</h1>
                    <p className="welcome-subtitle">AI destekli öğrenci analizi ve kişiselleştirilmiş öneriler</p>
                  </div>
                  <div className="current-date">
                    {new Date().toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Yapay Zeka Kartları */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faRobot} />
                    </div>
                    <div className="card-content">
                      <h3>AI Analiz Puanı</h3>
                      <div className="card-number">8.7</div>
                      <div className="card-subtitle">Genel performans</div>
                      <div className="progress-circle">
                        <div className="progress-fill" style={{ '--progress': '87%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="card-content">
                      <h3>Öğrenme Hızı</h3>
                      <div className="card-number">%92</div>
                      <div className="card-subtitle">Konu kavrama</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faBullseye} />
                    </div>
                    <div className="card-content">
                      <h3>Hedef Uygunluğu</h3>
                      <div className="card-number">%85</div>
                      <div className="card-subtitle">Üniversite hedefi</div>
                      <div className="progress-circle orange">
                        <div className="progress-fill" style={{ '--progress': '85%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon">
                      <FontAwesomeIcon icon={faStickyNote} />
                    </div>
                    <div className="card-content">
                      <h3>AI Önerileri</h3>
                      <div className="card-number">12</div>
                      <div className="card-subtitle">Aktif öneri</div>
                    </div>
                  </div>
                </div>

                {/* Tab Sistemi */}
                <div className="tabs-section">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'ai-chat' ? 'active' : ''}`}
                      onClick={() => setActiveTab('ai-chat')}
                    >
                      AI Asistanı
                    </button>
                    <button 
                      className={`tab ${activeTab === 'akilli-analiz' ? 'active' : ''}`}
                      onClick={() => setActiveTab('akilli-analiz')}
                    >
                      Akıllı Analiz
                    </button>
                    <button 
                      className={`tab ${activeTab === 'ai-raporlar' ? 'active' : ''}`}
                      onClick={() => setActiveTab('ai-raporlar')}
                    >
                      AI Raporları
                    </button>
                  </div>
                </div>

                {/* AI Asistanı Sekmesi */}
                {activeTab === 'ai-chat' && (
                  <div className="ai-chat-section">
                    <div className="section-header">
                      <h2>AI Asistanı</h2>
                      <div className="ai-status">
                        <span className="status-indicator online"></span>
                        <span className="status-text">Çevrimiçi</span>
                      </div>
                    </div>

                    <div className="chat-container">
                      <div className="chat-messages">
                        <div className="message ai-message">
                          <div className="message-avatar">
                            <FontAwesomeIcon icon={faRobot} />
                          </div>
                          <div className="message-content">
                            <p>Merhaba! {selectedStudent.name} için nasıl yardımcı olabilirim? Öğrencinin performansını analiz edebilir, öneriler sunabilir veya sorularınızı yanıtlayabilirim.</p>
                            <span className="message-time">Az önce</span>
                          </div>
                        </div>

                        <div className="message user-message">
                          <div className="message-content">
                            <p>Öğrencinin matematik performansı nasıl?</p>
                            <span className="message-time">2 dakika önce</span>
                          </div>
                          <div className="message-avatar">
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                        </div>

                        <div className="message ai-message">
                          <div className="message-avatar">
                            <FontAwesomeIcon icon={faRobot} />
                          </div>
                          <div className="message-content">
                            <p>Matematik performansı oldukça iyi! Son 3 denemede ortalama %88 başarı gösteriyor. Köklü sayılar konusunda mükemmel (%95), ancak türev konusunda biraz daha çalışması gerekiyor (%75). Önerim: Türev konusunda ek sorular çözmesi.</p>
                            <span className="message-time">1 dakika önce</span>
                          </div>
                        </div>

                        <div className="message user-message">
                          <div className="message-content">
                            <p>Hangi konulara odaklanmalı?</p>
                            <span className="message-time">Az önce</span>
                          </div>
                          <div className="message-avatar">
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                        </div>

                        <div className="message ai-message">
                          <div className="message-avatar">
                            <FontAwesomeIcon icon={faRobot} />
                          </div>
                          <div className="message-content">
                            <p>Öncelik sırasına göre:<br/>
                            1. <strong>Türev</strong> - %75 → %90 hedef<br/>
                            2. <strong>İntegral</strong> - Henüz başlamamış<br/>
                            3. <strong>Limit</strong> - %82, biraz daha pekiştirilmeli<br/><br/>
                            Haftalık 20-25 türev sorusu öneriyorum.</p>
                            <span className="message-time">Az önce</span>
                          </div>
                        </div>
                      </div>

                      <div className="chat-input-container">
                        <div className="chat-input-wrapper">
                          <input 
                            type="text" 
                            className="chat-input" 
                            placeholder="AI asistanına soru sorun..."
                          />
                          <button className="send-btn">
                            <FontAwesomeIcon icon={faPaperPlane} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Akıllı Analiz Sekmesi */}
                {activeTab === 'akilli-analiz' && (
                  <div className="akilli-analiz">
                    <div className="section-header">
                      <h2>Akıllı Analiz</h2>
                      <button className="yenile-btn">
                        <FontAwesomeIcon icon={faChartLine} />
                        Analizi Yenile
                      </button>
                    </div>

                    <div className="analiz-grid">
                      <div className="analiz-kart">
                        <h3>Öğrenme Profili</h3>
                        <div className="profil-ozellikler">
                          <div className="ozellik-item">
                            <span className="ozellik-label">Öğrenme Stili:</span>
                            <span className="ozellik-deger">Görsel + Pratik</span>
                          </div>
                          <div className="ozellik-item">
                            <span className="ozellik-label">Konsantrasyon:</span>
                            <span className="ozellik-deger">Yüksek (45-60 dk)</span>
                          </div>
                          <div className="ozellik-item">
                            <span className="ozellik-label">Hız:</span>
                            <span className="ozellik-deger">Orta-Hızlı</span>
                          </div>
                          <div className="ozellik-item">
                            <span className="ozellik-label">Zorluk Tercihi:</span>
                            <span className="ozellik-deger">Orta-Zor</span>
                          </div>
                        </div>
                      </div>

                      <div className="analiz-kart">
                        <h3>Güçlü Yönler</h3>
                        <div className="yonler-listesi">
                          <div className="yon-item pozitif">
                            <span className="yon-icon">💪</span>
                            <span className="yon-text">Matematik problem çözme</span>
                          </div>
                          <div className="yon-item pozitif">
                            <span className="yon-icon">🧠</span>
                            <span className="yon-text">Mantık yürütme</span>
                          </div>
                          <div className="yon-item pozitif">
                            <span className="yon-icon">⚡</span>
                            <span className="yon-text">Hızlı kavrama</span>
                          </div>
                          <div className="yon-item pozitif">
                            <span className="yon-icon">🎯</span>
                            <span className="yon-text">Hedef odaklılık</span>
                          </div>
                        </div>
                      </div>

                      <div className="analiz-kart">
                        <h3>Gelişim Alanları</h3>
                        <div className="yonler-listesi">
                          <div className="yon-item negatif">
                            <span className="yon-icon">📚</span>
                            <span className="yon-text">Kimya formülleri</span>
                          </div>
                          <div className="yon-item negatif">
                            <span className="yon-icon">⏰</span>
                            <span className="yon-text">Zaman yönetimi</span>
                          </div>
                          <div className="yon-item negatif">
                            <span className="yon-icon">🔍</span>
                            <span className="yon-text">Detay odaklılık</span>
                          </div>
                          <div className="yon-item negatif">
                            <span className="yon-icon">📝</span>
                            <span className="yon-text">Not tutma</span>
                          </div>
                        </div>
                      </div>

                      <div className="analiz-kart">
                        <h3>AI Önerileri</h3>
                        <div className="oneriler-listesi">
                          <div className="oneri-item">
                            <div className="oneri-header">
                              <span className="oneri-priorite high">Yüksek</span>
                              <span className="oneri-konu">Türev Konusu</span>
                            </div>
                            <p className="oneri-aciklama">Türev konusunda %75 başarı. Haftalık 20-25 soru ile %90'a çıkarılabilir.</p>
                          </div>
                          <div className="oneri-item">
                            <div className="oneri-header">
                              <span className="oneri-priorite medium">Orta</span>
                              <span className="oneri-konu">Zaman Yönetimi</span>
                            </div>
                            <p className="oneri-aciklama">Deneme sınavlarında zaman sıkıntısı yaşıyor. Pomodoro tekniği öneriliyor.</p>
                          </div>
                          <div className="oneri-item">
                            <div className="oneri-header">
                              <span className="oneri-priorite low">Düşük</span>
                              <span className="oneri-konu">Kimya Formülleri</span>
                            </div>
                            <p className="oneri-aciklama">Formül ezberleme teknikleri ve görsel hafıza yöntemleri uygulanabilir.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Raporları Sekmesi */}
                {activeTab === 'ai-raporlar' && (
                  <div className="ai-raporlar">
                    <div className="section-header">
                      <h2>AI Raporları</h2>
                      <div className="rapor-filtreler">
                        <select className="filter-select">
                          <option>Son 1 Ay</option>
                          <option>Son 3 Ay</option>
                          <option>Bu Dönem</option>
                          <option>Tüm Zamanlar</option>
                        </select>
                        <button className="rapor-indir-btn">
                          <FontAwesomeIcon icon={faDownload} />
                          Rapor İndir
                        </button>
                      </div>
                    </div>

                    <div className="rapor-grid">
                      <div className="rapor-kart">
                        <div className="rapor-header">
                          <h3>Performans Tahmini</h3>
                          <span className="rapor-tarih">18 Ekim 2024</span>
                        </div>
                        <div className="rapor-icerik">
                          <div className="tahmin-item">
                            <span className="tahmin-label">TYT Tahmini:</span>
                            <span className="tahmin-deger">450-470</span>
                          </div>
                          <div className="tahmin-item">
                            <span className="tahmin-label">AYT Tahmini:</span>
                            <span className="tahmin-deger">380-400</span>
                          </div>
                          <div className="tahmin-item">
                            <span className="tahmin-label">YKS Tahmini:</span>
                            <span className="tahmin-deger">420-440</span>
                          </div>
                          <div className="tahmin-item">
                            <span className="tahmin-label">Güvenilirlik:</span>
                            <span className="tahmin-deger">%87</span>
                          </div>
                        </div>
                      </div>

                      <div className="rapor-kart">
                        <div className="rapor-header">
                          <h3>Hedef Analizi</h3>
                          <span className="rapor-tarih">18 Ekim 2024</span>
                        </div>
                        <div className="rapor-icerik">
                          <div className="hedef-item">
                            <span className="hedef-uni">İTÜ Bilgisayar Mühendisliği</span>
                            <div className="hedef-ilerleme">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{width: '78%'}}></div>
                              </div>
                              <span className="hedef-yuzde">%78</span>
                            </div>
                          </div>
                          <div className="hedef-item">
                            <span className="hedef-uni">ODTÜ Elektrik Mühendisliği</span>
                            <div className="hedef-ilerleme">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{width: '85%'}}></div>
                              </div>
                              <span className="hedef-yuzde">%85</span>
                            </div>
                          </div>
                          <div className="hedef-item">
                            <span className="hedef-uni">Boğaziçi Matematik</span>
                            <div className="hedef-ilerleme">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{width: '65%'}}></div>
                              </div>
                              <span className="hedef-yuzde">%65</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rapor-kart">
                        <div className="rapor-header">
                          <h3>Risk Analizi</h3>
                          <span className="rapor-tarih">18 Ekim 2024</span>
                        </div>
                        <div className="rapor-icerik">
                          <div className="risk-item">
                            <span className="risk-label">Kimya Konuları:</span>
                            <span className="risk-seviye medium">Orta Risk</span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-label">Zaman Yönetimi:</span>
                            <span className="risk-seviye high">Yüksek Risk</span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-label">Motivasyon:</span>
                            <span className="risk-seviye low">Düşük Risk</span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-label">Genel Durum:</span>
                            <span className="risk-seviye medium">Orta Risk</span>
                          </div>
                        </div>
                      </div>

                      <div className="rapor-kart">
                        <div className="rapor-header">
                          <h3>Önerilen Çalışma Planı</h3>
                          <span className="rapor-tarih">18 Ekim 2024</span>
                        </div>
                        <div className="rapor-icerik">
                          <div className="plan-item">
                            <span className="plan-gun">Pazartesi</span>
                            <span className="plan-konu">Matematik - Türev (2 saat)</span>
                          </div>
                          <div className="plan-item">
                            <span className="plan-gun">Salı</span>
                            <span className="plan-konu">Fizik - Hareket (1.5 saat)</span>
                          </div>
                          <div className="plan-item">
                            <span className="plan-gun">Çarşamba</span>
                            <span className="plan-konu">Kimya - Atom (1 saat)</span>
                          </div>
                          <div className="plan-item">
                            <span className="plan-gun">Perşembe</span>
                            <span className="plan-konu">TYT Denemesi (3 saat)</span>
                          </div>
                          <div className="plan-item">
                            <span className="plan-gun">Cuma</span>
                            <span className="plan-konu">AYT Denemesi (3 saat)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <h1 className="page-title">Öğrenciler</h1>
              
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
                  <div key={student.id} className="student-card" onClick={() => handleStudentClick(student)}>
                    <div className="card-header">
                      <span className="card-title">Öğrenci Profili</span>
                      <div className="status-indicator">
                        <div className={`status-dot ${student.online ? 'online' : 'offline'}`}></div>
                        <span className="status-text">
                          {student.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                        </span>
                      </div>
                      <div className="card-menu">
                    <FontAwesomeIcon icon={faEllipsisV} />
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
                        <p className="student-class">{student.class}</p>
                      </div>
                    </div>

                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="metric-label">Zamanı Geçen Etüt :</span>
                        <span className="metric-value">{student.overdue}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Günlük Biten Etüt :</span>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${student.completed}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{student.completed}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="action-btn phone-btn">
                        <FontAwesomeIcon icon={faPhone} />
                      </button>
                      <button className="action-btn message-btn">
                        <FontAwesomeIcon icon={faMessageIcon} />
                      </button>
                      <button className="action-btn notification-btn">
                        Bildirim Gönder
                      </button>
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
    </div>
  );
};

export default OgretmenPanel;

