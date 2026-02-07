import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faHistory, faPlus, faTimes, faLiraSign } from '@fortawesome/free-solid-svg-icons';

const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://kocapp.com' : window.location.origin);

// Helper for safe fetch
const safeFetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, message: error.message };
  }
};

const OgretmenMuhasebeTab = ({ teacherId }) => {
  const [students, setStudents] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);
  const [studentPendingPayments, setStudentPendingPayments] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Kredi Kartı');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [selectedPendingId, setSelectedPendingId] = useState(null);

  useEffect(() => {
    if (teacherId) {
      fetchStudentsAndStatuses();
    }
  }, [teacherId]);

  const fetchStudentsAndStatuses = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const studentsData = await safeFetchJson(`${API_BASE}/php-backend/api/get_teacher_students.php?teacherId=${teacherId}`);
      if (studentsData.success && Array.isArray(studentsData.students)) {
        setStudents(studentsData.students);
        
        // 2. Fetch Payment Statuses
        if (studentsData.students.length > 0) {
          const ids = studentsData.students.map(s => s.id).join(',');
          const statusesData = await safeFetchJson(`${API_BASE}/php-backend/api/get_students_payment_statuses.php?studentIds=${encodeURIComponent(ids)}`);
          if (statusesData.success) {
            setPaymentStatuses(statusesData.statuses || {});
          }
        }
      }
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    setPaymentAmount('');
    setPaymentDesc('');
    setSelectedPendingId(null);
    try {
      const data = await safeFetchJson(`${API_BASE}/php-backend/api/get_payments.php?studentId=${student.id}`);
      if (data.success) {
        setStudentPayments(data.payments || []);
        setStudentPendingPayments(data.pendingPayments || []);
      } else {
        setStudentPayments([]);
        setStudentPendingPayments([]);
      }
    } catch (error) {
      console.error('Error fetching student payments:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        studentId: selectedStudent.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        description: paymentDesc || (selectedPendingId ? 'Bekleyen ödeme tahsilatı' : 'Manuel ödeme girişi'),
        pendingId: selectedPendingId
      };

      const response = await safeFetchJson(`${API_BASE}/php-backend/api/accept_payment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.success) {
        // Refresh details
        handleStudentClick(selectedStudent);
        // Refresh statuses in background
        fetchStudentsAndStatuses(); 
        
        // Reset form
        setPaymentAmount('');
        setPaymentDesc('');
        setSelectedPendingId(null);
        alert('Ödeme başarıyla kaydedildi.');
      } else {
        alert('Ödeme kaydedilirken hata oluştu: ' + (response.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Payment submit error:', error);
      alert('Bir hata oluştu.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePayPending = (pending) => {
    setPaymentAmount(pending.tutar);
    setPaymentDesc(pending.aciklama);
    setSelectedPendingId(pending.id);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>Muhasebe ve Ödeme Takibi</h2>
      
      {/* Student List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {students.map(student => {
          const status = paymentStatuses[student.id] || { overdueCount: 0, nextDueDate: null };
          const isOverdue = status.overdueCount > 0;
          
          return (
            <div 
              key={student.id} 
              onClick={() => handleStudentClick(student)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: isOverdue ? '2px solid #fee2e2' : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              {isOverdue && (
                <div style={{
                  position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', 
                  padding: '4px 12px', borderBottomLeftRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                }}>
                  Ödeme Bekleniyor
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', background: '#f3f4f6', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  fontSize: '20px', color: '#9ca3af', fontWeight: 'bold'
                }}>
                  {student.profilePhoto ? (
                    <img src={student.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (student.firstName?.[0] || '') + (student.lastName?.[0] || '')
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{student.firstName} {student.lastName}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{student.alanName || 'Alan Belirtilmemiş'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Sonraki Ödeme:</span>
                <span style={{ fontWeight: '500', color: isOverdue ? '#dc2626' : '#059669' }}>
                  {status.nextDueDate ? new Date(status.nextDueDate).toLocaleDateString('tr-TR') : 'Planlanmamış'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setSelectedStudent(null)}>
          <div style={{
            background: 'white', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
            borderRadius: '16px', padding: '0', display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                  {selectedStudent.firstName} {selectedStudent.lastName} - Ödeme Detayları
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Öğrenci ID: {selectedStudent.id}
                </p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              
              {/* Left Column: Payment History & Pending */}
              <div style={{ flex: '1 1 400px' }}>
                
                {/* Pending Payments Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ color: '#f59e0b' }} />
                    Bekleyen Ödemeler
                  </h4>
                  {detailsLoading ? <div>Yükleniyor...</div> : (
                    studentPendingPayments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {studentPendingPayments.map(pending => (
                          <div key={pending.id} style={{
                            padding: '16px', border: '1px solid #fee2e2', background: '#fef2f2', borderRadius: '8px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#991b1b' }}>{pending.tutar} TL</div>
                              <div style={{ fontSize: '13px', color: '#b91c1c' }}>Son Tarih: {new Date(pending.sonTarih).toLocaleDateString('tr-TR')}</div>
                              {pending.aciklama && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{pending.aciklama}</div>}
                            </div>
                            <button 
                              onClick={() => handlePayPending(pending)}
                              style={{
                                background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                              }}
                            >
                              Ödeme Al
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '16px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '14px' }}>
                        Bekleyen ödeme bulunmamaktadır.
                      </div>
                    )
                  )}
                </div>

                {/* History Section */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faHistory} style={{ color: '#6b7280' }} />
                    Geçmiş Ödemeler
                  </h4>
                  {detailsLoading ? <div>Yükleniyor...</div> : (
                    studentPayments.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '600' }}>Tarih</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '600' }}>Tutar</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '600' }}>Yöntem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentPayments.map((p, idx) => (
                              <tr key={idx} style={{ borderBottom: idx !== studentPayments.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                <td style={{ padding: '12px', color: '#374151' }}>{new Date(p.tarih).toLocaleDateString('tr-TR')}</td>
                                <td style={{ padding: '12px', fontWeight: '600', color: '#059669' }}>{p.tutar} TL</td>
                                <td style={{ padding: '12px', color: '#6b7280' }}>{p.yontem}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '14px' }}>Henüz ödeme kaydı yok.</div>
                    )
                  )}
                </div>

              </div>

              {/* Right Column: New Payment Form */}
              <div style={{ flex: '1 1 300px', background: '#f9fafb', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faPlus} style={{ color: '#8e24aa' }} />
                  Ödeme Ekle
                </h4>
                
                <form onSubmit={handlePaymentSubmit}>
                  {selectedPendingId && (
                    <div style={{ marginBottom: '16px', padding: '8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '6px', fontSize: '13px' }}>
                      Bekleyen ödeme için işlem yapılıyor.
                      <button type="button" onClick={() => { setSelectedPendingId(null); setPaymentAmount(''); setPaymentDesc(''); }} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', textDecoration: 'underline' }}>İptal</button>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Tutar (TL)</label>
                    <div style={{ position: 'relative' }}>
                      <FontAwesomeIcon icon={faLiraSign} style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                      <input 
                        type="number" 
                        step="0.01"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Ödeme Yöntemi</label>
                    <select 
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', background: 'white' }}
                    >
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale/EFT">Havale/EFT</option>
                      <option value="Nakit">Nakit</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Açıklama</label>
                    <textarea 
                      value={paymentDesc}
                      onChange={e => setPaymentDesc(e.target.value)}
                      placeholder="Örn: Ekim ayı taksidi"
                      rows="3"
                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingPayment}
                    style={{ 
                      width: '100%', padding: '12px', background: '#8e24aa', color: 'white', border: 'none', borderRadius: '8px', 
                      fontSize: '15px', fontWeight: '600', cursor: submittingPayment ? 'not-allowed' : 'pointer', opacity: submittingPayment ? 0.7 : 1 
                    }}
                  >
                    {submittingPayment ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OgretmenMuhasebeTab;
