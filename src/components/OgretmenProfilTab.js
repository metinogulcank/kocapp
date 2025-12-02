import React, { useEffect, useState, useMemo } from 'react';
import { EXAM_CATEGORY_OPTIONS } from '../constants/examSubjects';

const API_GET = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/get_teacher_profile.php";
const API_UPDATE = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/update_teacher_profile.php";
const API_PHOTO = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/upload_teacher_photo.php";
const API_STUDENT = "https://vedatdaglarmuhendislik.com.tr/php-backend/api/create_student.php";

// Türkçe doğru title-case için
function turkishTitle(str = '') {
  return str
    .split(' ')
    .map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR'))
    .join(' ');
}

export default function OgretmenProfilTab() {
  const [form, setForm] = useState({
    _id: '', firstName: '', lastName: '', email: '', phone: '', branch: '', profilePhoto: '',
    newPassword: '', newPasswordConfirm: '',
    limit: 10, active: 7
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const appointments = useMemo(() => ({
    3: { student: 'Zeynep Y.', time: '14:00' },
    7: { student: 'Ahmet K.', time: '10:30' },
    18: { student: 'Elif K.', time: '16:15' }
  }), []);

  // Yeni öğrenci ekleme için state
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      setError('Kullanıcı bulunamadı');
      setLoading(false);
      return;
    }
    fetch(`${API_GET}?id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data._id) throw new Error('Veri alınamadı');
        setForm(f => ({ ...f, ...data, newPassword: '', newPasswordConfirm: '' }));
        setLoading(false);
      })
      .catch(() => {
        setError('Profil yüklenemedi');
        setLoading(false);
      });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handlePhotoUpload(e) {
    setUploadError(''); setUploadSuccess(false);
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('_id', user && user.id ? user.id : (form._id || 'test-id'));
    try {
      const res = await fetch(API_PHOTO, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || 'Fotoğraf yüklenemedi');
      setForm(f => ({ ...f, profilePhoto: data.url }));
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err.message);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  }

  // Öğrenci ekle modalı için fonksiyonlar
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
    } catch (err) {
      setAddError(err.message);
    }
    setAdding(false);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSuccess(''); setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.branch) {
      setError('Lütfen zorunlu alanları doldurun'); return;
    }
    if (form.newPassword && form.newPassword !== form.newPasswordConfirm) {
      setError('Yeni şifreler uyuşmuyor!'); return;
    }
    setSaving(true);
    try {
      const res = await fetch(API_UPDATE, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Hata oluştu');
      setSuccess('Profil başarıyla güncellendi');
      setModal(false);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }
  if (loading) return <div className="profile-tab">Yükleniyor...</div>;

  // Modern üst Profile Card
  return (
    <div className="profile-tab">
      <div className="profile-card-modern">
        <div className="pp-left">
          <img
            className="profile-avatar-hero"
            src={form.profilePhoto ||
              ('https://ui-avatars.com/api/?name=' + encodeURIComponent(form.firstName + ' ' + form.lastName) + '&background=9c27b0&color=fff')
            }
            alt="Profil"
          />
        </div>
        <div className="pp-main">
          <div className="pp-name">{turkishTitle(`${form.firstName} ${form.lastName}`)}</div>
          <div className="pp-meta">Branş: <b>{form.branch}</b></div>
        </div>
        <div className="pp-actions">
          <button className="edit-btn" onClick={() => setModal(true)}>Profili Düzenle</button>
          <div className="aktif-sayi"><span style={{color:'#f59e0b',marginRight:8}}>◆</span> Aktif öğrenci sayısı {form.limit}/{form.active} <span className="aktif-dot"></span></div>
        </div>
      </div>

      {/* Öğrenci yeni ekle kutucuğu */}
      <div className="dashboard-tiles">
        <div className="tile">
          <div className="tile-title">Abonelik bitiş süresi</div>
          <div className="tile-value large">90</div>
        </div>
        <div className="tile">
          <div className="tile-title">Öğrenci sayısı</div>
          <div className="tile-value"><span className="highlight">{form.limit}/{form.active}</span></div>
          <div className="tile-sub">Öğrenci limitim: {form.limit} • Öğrenci sayım: {form.active}</div>
        </div>
        <div className="tile"><div className="tile-title">Öğrenci randevu alanı</div><div className="tile-icon">🗓️</div></div>
        <div className="tile"><div className="tile-title">Öğrencileri listele</div><div className="tile-icon">📋</div></div>
        <div className="tile add" onClick={() => setShowAddStudentModal(true)}>
          <div className="tile-title green">Yeni öğrenci ekle</div>
          <div className="tile-icon">➕</div>
        </div>
      </div>

      {/* Öğrenci ekleme modalı */}
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

      {/* Profil güncelleme modalı */}
      {modal && (
        <div className="profile-modal-bg" onClick={() => setModal(false)}>
          <div className="profile-modal" onClick={e=>e.stopPropagation()}>
            <form className="profile-update-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div>
                  <label>Ad</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} required />
                </div>
                <div>
                  <label>Soyad</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <label>Telefon</label>
                  <input name="phone" value={form.phone || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Branş</label>
                  <input name="branch" value={form.branch || ''} onChange={handleChange} required />
                </div>
                <div>
                  <label>Profil Fotoğrafı</label>
                  <input name="profilePhotoFile" type="file" accept="image/*" onChange={handlePhotoUpload} />
                  {uploading && <span style={{color:'#8e24aa', marginLeft:6, fontSize:13}}>Yükleniyor...</span>}
                  {uploadSuccess && <span style={{color:'#059669', marginLeft:6, fontSize:13}}>Yüklendi</span>}
                  {uploadError && <span style={{color:'#b91c1c', marginLeft:6, fontSize:13}}>{uploadError}</span>}
                </div>
                {form.profilePhoto && <div style={{marginTop:6}}><img src={form.profilePhoto} alt="" style={{ maxWidth: 64, borderRadius: 8 }} /></div>}
              </div>
              <div className="form-row">
                <div>
                  <label>Yeni Şifre</label>
                  <input name="newPassword" value={form.newPassword} onChange={handleChange} type="password" autoComplete="new-password" />
                </div>
                <div>
                  <label>Yeni Şifre Tekrar</label>
                  <input name="newPasswordConfirm" value={form.newPasswordConfirm} onChange={handleChange} type="password" autoComplete="new-password" />
                </div>
              </div>
              {error && <div style={{ color: '#b91c1c', marginTop: 10 }}>{error}</div>}
              {success && <div style={{ color: '#16a34a', marginTop: 10 }}>{success}</div>}
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button type="button" className="edit-btn ghost" style={{marginRight:10}} onClick={()=>setModal(false)}>Vazgeç</button>
                <button type="submit" className="edit-btn" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Takvim alanı */}
      <div className="calendar-wrapper">
        <div className="calendar-card">
          <div className="calendar-header">Takvim</div>
          <div className="calendar-grid">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const hasAppt = Boolean(appointments[day]);
              return (
                <button
                  key={day}
                  className={`cal-cell ${hasAppt ? 'has-appt' : ''} ${selectedDay === day ? 'selected' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="num">{day}</span>
                  {hasAppt && <span className="tick" />}
                </button>
              );
            })}
          </div>
          <div className="calendar-detail">
            {selectedDay && appointments[selectedDay] ? (
              <div className="detail-row">
                <span className="detail-title">Randevu:</span>
                <span className="detail-text">{appointments[selectedDay].student} • {appointments[selectedDay].time}</span>
              </div>
            ) : (
              <div className="detail-empty">Seçili günde randevu bulunmuyor</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


