import React, { useState, useEffect } from 'react';
import { faSearch, faPlus, faHistory, faCheckCircle, faTimesCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://kocapp.com' : window.location.origin);

const safeFetchJson = async (url, options) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Server error: ${response.status}`);
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, message: 'Bağlantı hatası' };
  }
};

const AdminMuhasebeTab = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    durationDays: 30,
    studentLimit: 5,
    packageId: 'starter',
    method: 'Kredi Kartı',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_admin_accounting_data.php`);
    if (data.success) {
      setTeachers(data.teachers || []);
    }
    setLoading(false);
  };

  const handlePaymentClick = (teacher) => {
    setSelectedTeacher(teacher);
    setPaymentForm({
      amount: '',
      durationDays: 30,
      studentLimit: teacher.subscription?.studentLimit || 5,
      packageId: 'starter',
      method: 'EFT/Havale', // Admin manually entering usually means EFT/Cash
      description: 'Manuel ödeme girişi'
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.durationDays) return;

    setSubmitting(true);
    const payload = {
      teacherId: selectedTeacher.id,
      amount: parseFloat(paymentForm.amount),
      durationDays: parseInt(paymentForm.durationDays),
      studentLimit: parseInt(paymentForm.studentLimit),
      packageId: paymentForm.packageId,
      method: paymentForm.method,
      description: paymentForm.description
    };

    const res = await safeFetchJson(`${API_BASE}/php-backend/api/accept_teacher_payment.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.success) {
      alert('Ödeme başarıyla kaydedildi ve abonelik güncellendi.');
      setIsModalOpen(false);
      fetchData();
    } else {
      alert('Hata: ' + (res.message || 'İşlem başarısız'));
    }
    setSubmitting(false);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (sub) => {
    if (!sub || sub.status === 'no_sub') return <span style={{ color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Abonelik Yok</span>;
    if (sub.status === 'expired') return <span style={{ color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Süresi Dolmuş</span>;
    if (sub.daysLeft < 7) return <span style={{ color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Bitiyor ({sub.daysLeft} gün)</span>;
    return <span style={{ color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Aktif ({sub.daysLeft} gün)</span>;
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Öğretmen Muhasebe & Abonelik Yönetimi</h2>
        <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
            <input 
                type="text" 
                placeholder="Öğretmen Ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 10px 8px 35px', border: '1px solid #d1d5db', borderRadius: 6, width: 250 }}
            />
        </div>
      </div>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#374151' }}>Öğretmen</th>
                <th style={{ padding: '12px 16px', color: '#374151' }}>Durum</th>
                <th style={{ padding: '12px 16px', color: '#374151' }}>Bitiş Tarihi</th>
                <th style={{ padding: '12px 16px', color: '#374151' }}>Öğrenci Limiti</th>
                <th style={{ padding: '12px 16px', color: '#374151' }}>Son Ödeme</th>
                <th style={{ padding: '12px 16px', color: '#374151' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(t.subscription)}</td>
                  <td style={{ padding: '12px 16px' }}>{t.subscription?.endDate || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{t.subscription?.studentLimit || 5}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {t.lastPayment ? (
                        <div>
                            <div style={{ fontWeight: 500 }}>{t.lastPayment.amount} TL</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{t.lastPayment.date.split(' ')[0]}</div>
                        </div>
                    ) : <span style={{ color: '#9ca3af' }}>Yok</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                        onClick={() => handlePaymentClick(t)}
                        style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                        Ödeme/Süre Ekle
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                    <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && selectedTeacher && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', borderRadius: 8, padding: 24, width: 400, maxWidth: '90%' }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Ödeme Girişi: {selectedTeacher.name}</h3>
                <form onSubmit={handlePaymentSubmit}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#374151' }}>Paket Seçimi</label>
                        <select 
                            value={paymentForm.packageId}
                            onChange={(e) => {
                                const pkg = e.target.value;
                                let limit = 5;
                                let amount = 0;
                                if (pkg === 'starter') { limit = 5; amount = 1000; }
                                else if (pkg === 'pro') { limit = 7; amount = 1500; }
                                else if (pkg === 'ultimate') { limit = 10; amount = 2000; }
                                setPaymentForm({ ...paymentForm, packageId: pkg, studentLimit: limit, amount: amount });
                            }}
                            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                        >
                            <option value="starter">Başlangıç (5 Öğrenci)</option>
                            <option value="pro">Pro (7 Öğrenci)</option>
                            <option value="ultimate">Ultimate (10 Öğrenci)</option>
                            <option value="custom">Özel</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#374151' }}>Tutar (TL)</label>
                        <input 
                            type="number" 
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            required
                            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#374151' }}>Öğrenci Limiti</label>
                        <input 
                            type="number" 
                            value={paymentForm.studentLimit}
                            onChange={(e) => setPaymentForm({ ...paymentForm, studentLimit: e.target.value })}
                            required
                            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#374151' }}>Eklenecek Süre (Gün)</label>
                        <input 
                            type="number" 
                            value={paymentForm.durationDays}
                            onChange={(e) => setPaymentForm({ ...paymentForm, durationDays: e.target.value })}
                            required
                            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#374151' }}>Ödeme Yöntemi</label>
                        <select 
                            value={paymentForm.method}
                            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                        >
                            <option value="Kredi Kartı">Kredi Kartı</option>
                            <option value="EFT/Havale">EFT/Havale</option>
                            <option value="Nakit">Nakit</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#374151' }}>Açıklama</label>
                        <input 
                            type="text" 
                            value={paymentForm.description}
                            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                            placeholder="Opsiyonel"
                            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}
                        >
                            İptal
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                        >
                            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminMuhasebeTab;
