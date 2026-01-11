import React, { useEffect, useState, useMemo } from 'react';
import { EXAM_CATEGORY_OPTIONS } from '../constants/examSubjects';

const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://kocapp.com' : window.location.origin);
const API_GET = `${API_BASE}/php-backend/api/get_teacher_profile.php`;
const API_UPDATE = `${API_BASE}/php-backend/api/update_teacher_profile.php`;
const API_PHOTO = `${API_BASE}/php-backend/api/upload_teacher_photo.php`;
const API_STUDENT = `${API_BASE}/php-backend/api/create_student.php`;
const API_UPDATE_STUDENT = `${API_BASE}/php-backend/api/update_student.php`;
const API_DELETE_STUDENT = `${API_BASE}/php-backend/api/delete_student.php`;
const API_GET_STUDENTS = `${API_BASE}/php-backend/api/get_teacher_students.php`;

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

// Türkçe doğru title-case için
function turkishTitle(str = '') {
  return str
    .split(' ')
    .map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR'))
    .join(' ');
}

// Alan kodunu okunur etikete çevir
const formatAreaLabel = (area, studentInfo = null) => {
  if (studentInfo && studentInfo.alanName) return studentInfo.alanName;
  if (studentInfo && studentInfo.alan && studentInfo.alan.includes(' - ')) return studentInfo.alan;
  if (!area) return '';
  const allOptions = EXAM_CATEGORY_OPTIONS.flatMap(group => group.options || []);
  const found = allOptions.find(opt => opt.value === area);
  return found ? found.label : area;
};

export default function OgretmenProfilTab() {
  const [form, setForm] = useState({
    _id: '', firstName: '', lastName: '', email: '', phone: '', branch: '', yok_atlas_link: '', profilePhoto: '',
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
    // Öğrencinin ilk görüşme / başlangıç tarihi
    meetingDate: '',
    password: '',
    passwordConfirm: ''
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [stuUploading, setStuUploading] = useState(false);
  const [availableExams, setAvailableExams] = useState([]);

  // Sınav listesini çek
  useEffect(() => {
    const fetchExams = async () => {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_exams_with_components.php`);
      if (data.success) {
        setAvailableExams(data.exams || []);
      }
    };
    fetchExams();
  }, []);

  // Öğrenci listesi için state
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      setError('Kullanıcı bulunamadı');
      setLoading(false);
      return;
    }
    safeFetchJson(`${API_GET}?id=${user.id}`)
      .then(data => {
        if (!data.success && !data._id) throw new Error(data.message || 'Veri alınamadı');
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
      const data = await safeFetchJson(API_PHOTO, { method: 'POST', body: formData });
      if (!data.success || !data.url) throw new Error(data.message || 'Fotoğraf yüklenemedi');
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
      const data = await safeFetchJson(API_PHOTO, { method: 'POST', body: formData });
      if (!data.success || !data.url) throw new Error(data.message || 'Yükleme hatası!');
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
        !studentForm.email || !studentForm.className || !studentForm.alan || !studentForm.password ||
        !studentForm.meetingDate) {
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
      const data = await safeFetchJson(API_STUDENT, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!data.success) throw new Error(data.message || 'İşlem başarısız');
      setAddSuccess('Öğrenci kaydedildi!');
      setStudentForm({
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
      setShowAddStudentModal(false);
      // Öğrenci listesini yenile
      if (showStudentListModal) {
        fetchStudents();
      }
    } catch (err) {
      setAddError(err.message);
    }
    setAdding(false);
  }

  // Öğrencileri getir
  const fetchStudents = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;
    setStudentsLoading(true);
    safeFetchJson(`${API_GET_STUDENTS}?teacherId=${user.id}`)
      .then(data => {
        if (data.students) {
          setStudents(data.students);
        }
        setStudentsLoading(false);
      })
      .catch(err => {
        console.error('Öğrenciler yüklenemedi:', err);
        setStudentsLoading(false);
      });
  };

  // Öğrenci listesi modalını aç
  const handleOpenStudentList = () => {
    setShowStudentListModal(true);
    fetchStudents();
  };

  // Öğrenci düzenleme modalını aç
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentForm({
      id: student.id,
      alan: student.alan || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      className: student.className || '',
      profilePhoto: student.profilePhoto || '',
      meetingDate: student.meetingDate ? student.meetingDate.split('T')[0] : '',
      password: '',
      passwordConfirm: ''
    });
    setShowEditStudentModal(true);
    setUpdateError('');
    setUpdateSuccess('');
  };

  // Öğrenci düzenleme form değişikliği
  function handleEditStudentFormChange(e) {
    const { name, value } = e.target;
    setEditStudentForm(f => ({ ...f, [name]: value }));
  }

  // Öğrenci düzenleme fotoğraf yükleme
  async function handleEditStudentPhotoUpload(e) {
    setEditStuUploading(true); setUpdateError(''); setUpdateSuccess('');
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('_id', editingStudent.id);
    formData.append('type', 'student');
    try {
      const data = await safeFetchJson(API_PHOTO, { method: 'POST', body: formData });
      if (!data.success || !data.url) throw new Error(data.message || 'Yükleme hatası!');
      setEditStudentForm(f => ({ ...f, profilePhoto: data.url }));
      setUpdateSuccess('Fotoğraf yüklendi!');
    } catch (err) {
      setUpdateError('Fotoğraf yüklenemedi: ' + err.message);
    } finally { setEditStuUploading(false); }
  }

  // Öğrenci güncelleme
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
    // Şifre sadece değiştirilmişse ekle
    if (editStudentForm.password) {
      payload.password = editStudentForm.password;
    }
    try {
      const data = await safeFetchJson(API_UPDATE_STUDENT, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!data.success) throw new Error(data.message || 'İşlem başarısız');
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

  // Öğrenci silme
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    const user = JSON.parse(localStorage.getItem('user'));
    setDeletingStudentId(studentId);
    try {
      const data = await safeFetchJson(API_DELETE_STUDENT, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, teacherId: user.id })
      });
      if (!data.success) throw new Error(data.message || 'Silme işlemi başarısız');
      fetchStudents();
    } catch (err) {
      alert('Silme hatası: ' + err.message);
    } finally {
      setDeletingStudentId(null);
    }
  };

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
      const data = await safeFetchJson(API_UPDATE, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!data.success) throw new Error(data.message || 'Hata oluştu');
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
          {form.yok_atlas_link && (
            <div className="pp-meta" style={{marginTop: 4}}>
              <a href={form.yok_atlas_link} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4}}>
                <span style={{fontSize: 14}}>🌐</span> Yök Atlas Profili
              </a>
            </div>
          )}
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
        <div className="tile" onClick={handleOpenStudentList} style={{cursor: 'pointer'}}><div className="tile-title">Öğrencileri listele</div><div className="tile-icon">📋</div></div>
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
                    {availableExams.map((exam) => (
                      <React.Fragment key={exam.id}>
                        {exam.components && exam.components.length > 0 ? (
                          <optgroup label={exam.ad}>
                            {exam.components.map((comp) => (
                              <option key={comp.id} value={`comp_${comp.id}`}>
                                {exam.ad} - {comp.ad}
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <option value={`exam_${exam.id}`}>{exam.ad}</option>
                        )}
                      </React.Fragment>
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
                    value={studentForm.meetingDate}
                    onChange={handleStudentFormChange}
                    required
                  />
                  <small style={{ display: 'block', marginTop: 4, color: '#6b7280' }}>
                    Bu tarih, haftalık programın başlangıç günü olacaktır. Örn: 03/12/2025 seçerseniz
                    ilk hafta 03/12/2025 Çarşamba - 09/12/2025 Salı olarak ayarlanır.
                  </small>
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
                <div style={{flex: 1}}>
                  <label>Yök Atlas Linki</label>
                  <input name="yok_atlas_link" value={form.yok_atlas_link || ''} onChange={handleChange} placeholder="https://yokatlas.yok.gov.tr/..." style={{width: '100%'}} />
                </div>
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

      {/* Öğrenci listesi modalı */}
      {showStudentListModal && (
        <div className="profile-modal-bg" onClick={() => setShowStudentListModal(false)}>
          <div className="profile-modal" onClick={e=>e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '90vh', overflow: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <h2 style={{margin: 0}}>Öğrenciler</h2>
              <button className="edit-btn" onClick={() => {setShowStudentListModal(false); setShowAddStudentModal(true);}}>➕ Yeni Öğrenci Ekle</button>
            </div>
            {studentsLoading ? (
              <div style={{textAlign: 'center', padding: 40}}>Yükleniyor...</div>
            ) : students.length === 0 ? (
              <div style={{textAlign: 'center', padding: 40, color: '#6b7280'}}>Henüz öğrenci eklenmemiş.</div>
            ) : (
              <div style={{display: 'grid', gap: 12}}>
                {students.map((student) => (
                  <div key={student.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 12, flex: 1}}>
                      {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt="" style={{width: 48, height: 48, borderRadius: 8, objectFit: 'cover'}} />
                      ) : (
                        <div style={{width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280'}}>
                          {student.firstName?.[0] || '?'}
                        </div>
                      )}
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 600, fontSize: 16}}>{student.firstName} {student.lastName}</div>
                        <div style={{fontSize: 14, color: '#6b7280', marginTop: 4}}>
                          {student.email} • {student.className} • {formatAreaLabel(student.alan, student)}
                        </div>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: 8}}>
                      <button className="edit-btn ghost" onClick={() => handleEditStudent(student)} style={{padding: '8px 16px'}}>
                        Düzenle
                      </button>
                      <button 
                        className="edit-btn" 
                        onClick={() => handleDeleteStudent(student.id)} 
                        disabled={deletingStudentId === student.id}
                        style={{padding: '8px 16px', background: deletingStudentId === student.id ? '#9ca3af' : '#dc2626'}}
                      >
                        {deletingStudentId === student.id ? 'Siliniyor...' : 'Sil'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{marginTop: 20, display: 'flex', justifyContent: 'flex-end'}}>
              <button type="button" className="edit-btn ghost" onClick={() => setShowStudentListModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci düzenleme modalı */}
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
                    {availableExams.map((exam) => (
                      <React.Fragment key={exam.id}>
                        {exam.components && exam.components.length > 0 ? (
                          <optgroup label={exam.ad}>
                            {exam.components.map((comp) => (
                              <option key={comp.id} value={`comp_${comp.id}`}>
                                {exam.ad} - {comp.ad}
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <option value={`exam_${exam.id}`}>{exam.ad}</option>
                        )}
                      </React.Fragment>
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

