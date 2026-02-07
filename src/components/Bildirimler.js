import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import './Bildirimler.css';
import BildirimDetay from './BildirimDetay';

const Bildirimler = ({ students = [], filter = null, title = 'Bildirimlerim', userRole = null, initialSelectedStudentId = null }) => {
  // Proxy kullan - localhost'ta çalışırken CORS sorunu olmaz
  const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://kocapp.com' : window.location.origin);
  const [activeTab, setActiveTab] = useState('ogrenci');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewTab, setViewTab] = useState('received'); // 'received' | 'sent'
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // students prop'undan gelen veriyi kullan, format: { id, name, class }
  // Eğer backend formatı farklıysa (firstName, lastName, className) onu da handle edelim
  const formattedStudents = students.map(s => ({
    id: s.id,
    name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
    class: s.class || s.className || '',
    field: s.class || s.className || '',
    veliId: s.veliId
  }));

  // Hazır şablonlar
  /*
  const templates = [
    { id: 1, name: 'Sınav Hatırlatması', content: 'Sevgili öğrencim, yaklaşan sınavınız için hazırlıklarınızı tamamlamayı unutmayın.' },
    { id: 2, name: 'Ödev Hatırlatması', content: 'Ödev teslim tarihiniz yaklaşıyor. Lütfen ödevinizi zamanında teslim edin.' },
    { id: 3, name: 'Genel Duyuru', content: 'Önemli bir duyuru paylaşmak istiyorum. Lütfen dikkatle okuyun.' }
  ];
  */

  const fetchTemplates = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.id || user._id;

      const response = await fetch(`${API_BASE}/php-backend/api/get_notification_templates.php?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (initialSelectedStudentId) {
        setRecipientType('student');
        setSelectedStudents([initialSelectedStudentId]);
        setActiveTab('ogrenci');
    }
  }, [initialSelectedStudentId]);

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      alert('Lütfen şablon adı ve içeriği girin');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);
      const userId = user.id || user._id;

      const response = await fetch(`${API_BASE}/php-backend/api/save_notification_template.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newTemplateName,
          content: newTemplateContent
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Şablon kaydedildi');
        setNewTemplateName('');
        setNewTemplateContent('');
        fetchTemplates();
        setActiveTab('ogrenci'); // Return to student tab or stay? User might want to create more.
      } else {
        alert('Şablon kaydedilemedi');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing if inside
    if (!window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`${API_BASE}/php-backend/api/delete_notification_template.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        if (selectedTemplate === id) {
            setSelectedTemplate('');
            setMessage('');
        }
      } else {
        alert('Şablon silinemedi');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // user objesinden veya localStorage'dan kullanıcı ID'sini al
      let userId = null;
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id || user._id; // _id veya id olabilir
        }
      } catch (e) {
        console.error('User parse error:', e);
      }

      // Eğer ID yoksa token'dan decode etmeyi dene
      if (!userId) {
           const token = localStorage.getItem('token');
           if (token) {
               try {
                   // Basit base64 token kullanıyorsak direkt decode
                   const decoded = JSON.parse(atob(token));
                   userId = decoded.id;
               } catch (e) {
                   console.error('Token decode error:', e);
               }
           }
      }

      // Teacher-only filtresi varsa, öğretmenin gönderdiği bildirimleri getir
      // Query parametresi olarak userId ekle
      let apiUrl;
      if (filter === 'teacher-only') {
        apiUrl = viewTab === 'sent' 
          ? `${API_BASE}/php-backend/api/get_teacher_sent_notifications.php`
          : `${API_BASE}/php-backend/api/get_notifications.php`;
      } else if (filter === 'student') {
        apiUrl = `${API_BASE}/php-backend/api/get_notifications.php`;
      } else {
        apiUrl = `${API_BASE}/php-backend/api/get_notifications.php`;
      }
      
      if (userId) {
          apiUrl += `?userId=${userId}`;
          
          // Rol bilgisini ekle
          if (userRole) {
              apiUrl += `&role=${userRole}`;
          } else {
             // localStorage'dan rolü bulmaya çalış
             try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                   const user = JSON.parse(userStr);
                   if (user.role) {
                       apiUrl += `&role=${user.role}`;
                   }
                }
             } catch(e) {}
          }
      }
        
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Bildirimler yüklenemedi');
        } catch (e) {
            throw new Error(`Bildirimler yüklenemedi: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data.error || 'Bildirimler yüklenemedi');
      }
    } catch (err) {
      setError(err.message);
      console.error('Bildirim yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Bildirimleri çek
  useEffect(() => {
    fetchNotifications();
  }, [filter, viewTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleRecipientTypeChange = (type) => {
    setRecipientType(type);
  };

  const handleStudentSelect = (studentId) => {
    // Öğrenci/Veli seçildiğinde otomatik olarak 'student'/'parent' moduna geç
    if (activeTab === 'veli') {
        if (recipientType !== 'parent') {
            setRecipientType('parent');
        }
    } else {
        if (recipientType !== 'student') {
            setRecipientType('student');
        }
    }

    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      // Tekli seçim mantığı
      setSelectedStudents([studentId]); 
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(formattedStudents.map(student => student.id));
    }
    setSelectAll(!selectAll);
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id == templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content);
    }
  };

  const filteredStudents = formattedStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Veli sekmesindeysek ve öğrencinin velisi yoksa listede gösterme
    if (activeTab === 'veli') {
        return matchesSearch && student.veliId;
    }
    
    return matchesSearch;
  });

  const handleDetailClick = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
  };

  // Bildirim gönderme fonksiyonu
  const handleSendNotification = async () => {
    if (!message.trim()) {
      alert('Lütfen bir mesaj yazın');
      return;
    }

    if ((recipientType === 'student' || recipientType === 'parent') && selectedStudents.length === 0) {
      alert('Lütfen bir kişi seçin');
      return;
    }

    try {
      const notificationData = {
        title: selectedTemplate ? templates.find(t => t.id == selectedTemplate)?.name || 'Bildirim' : 'Bildirim',
        message: message,
        recipient_type: recipientType, 
        recipient_id: (recipientType === 'student' || recipientType === 'parent') && selectedStudents.length > 0 ? selectedStudents[0] : null,
        type: 'announcement',
        priority: 'medium'
      };

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/php-backend/api/create_notification.php`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(notificationData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Bildirim başarıyla gönderildi!');
        // Formu temizle
        setMessage('');
        setSelectedTemplate('');
        setSelectedStudents([]);
        setSelectAll(false);
        
        // Eğer teacher-only modundaysak ve gönderilenler sekmesindeysek listeyi yenile
        if (filter === 'teacher-only' && viewTab === 'sent') {
            fetchNotifications();
        } else if (filter !== 'teacher-only') {
             // Bildirim Gönder sayfası - listeyi yenile (bu sayfa şu an received gösteriyor ama olsun)
             fetchNotifications();
        }
      } else {
        throw new Error(data.error || 'Bildirim gönderilemedi');
      }
    } catch (err) {
      alert('Bildirim gönderilirken hata oluştu: ' + err.message);
      console.error('Bildirim gönderme hatası:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(!window.confirm('Bu bildirimi silmek istediğinize emin misiniz?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/php-backend/api/delete_notification.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notification_id: id })
        });
        const data = await response.json();
        if(data.success) {
            fetchNotifications();
        } else {
            alert(data.error || 'Silinemedi');
        }
    } catch(e) {
        alert('Hata oluştu');
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/php-backend/api/mark_notification_read.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notification_id: id })
        });
        const data = await response.json();
        if(data.success) {
            fetchNotifications();
            // Dispatch event to update badge
            window.dispatchEvent(new Event('notificationRead'));
        }
    } catch(e) {
        console.error('Mark read error', e);
    }
  };

  return (
    <div className="bildirimler-container">
      <div className="bildirimler-header">
        <h1 className="bildirimler-title">
          {filter === 'teacher-only' || filter === 'student' || filter === 'parent' ? 'Bildirimlerim' : 'Bildirim Gönder'}
        </h1>
      </div>

      {/* Tab Navigation - Sadece teacher-only veya student veya parent filtresi yoksa göster */}
      {filter !== 'teacher-only' && filter !== 'student' && filter !== 'parent' && (
        <div className="bildirimler-tabs">
          <button
            className={`tab-button ${activeTab === 'ogrenci' ? 'active' : ''}`}
            onClick={() => handleTabChange('ogrenci')}
          >
            Öğrenciye Mesaj
          </button>
          <button
            className={`tab-button ${activeTab === 'veli' ? 'active' : ''}`}
            onClick={() => handleTabChange('veli')}
          >
            Veliye Mesaj
          </button>
          <button
            className={`tab-button ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => handleTabChange('template')}
          >
            Yeni Şablon oluştur
            <span className="plus-icon">+</span>
          </button>
        </div>
      )}

      {/* Main Content - Sadece teacher-only filtresi yoksa göster */}
      {filter !== 'teacher-only' && filter !== 'student' && filter !== 'parent' && (
        <div className="bildirimler-content">
          {activeTab === 'template' ? (
            <div className="template-management">
              <h3 className="section-title">Yeni Şablon Oluştur</h3>
              <div className="template-form">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Şablon Adı"
                  className="template-name-input"
                />
                <textarea
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  placeholder="Şablon İçeriği"
                  className="template-content-input"
                  rows={4}
                />
                <button onClick={handleSaveTemplate} className="save-template-button">
                  Şablonu Kaydet
                </button>
              </div>

              <h3 className="section-title" style={{ marginTop: '20px' }}>Mevcut Şablonlar</h3>
              <div className="existing-templates-list">
                {templates.length === 0 ? (
                  <p>Henüz şablon oluşturulmamış.</p>
                ) : (
                  templates.map(t => (
                    <div key={t.id} className="template-list-item">
                      <div className="template-info">
                        <strong>{t.name}</strong>
                        <p>{t.content.substring(0, 50)}...</p>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteTemplate(t.id, e)}
                        className="delete-template-button"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
          {/* Alıcı Seçimi */}
          <div className="recipient-selection">
            <h3 className="section-title">Alıcı Seçimi:</h3>
          
          <div className="recipient-options">
            <label className="radio-option">
              <input
                type="radio"
                name="recipientType"
                value="all"
                checked={recipientType === 'all'}
                onChange={(e) => {
                    handleRecipientTypeChange(e.target.value);
                    setSelectedStudents([]); // Tümünü seçince seçimleri temizle
                    setSelectAll(false);
                }}
              />
              <span className="radio-label">{activeTab === 'veli' ? 'Tüm Veliler' : 'Tüm Öğrenciler'}</span>
            </label>
            
            <label className="radio-option">
              <input
                type="radio"
                name="recipientType"
                value={activeTab === 'veli' ? 'parent' : 'student'}
                checked={recipientType === 'student' || recipientType === 'parent'}
                onChange={(e) => handleRecipientTypeChange(activeTab === 'veli' ? 'parent' : 'student')}
              />
              <span className="radio-label">{activeTab === 'veli' ? 'Veli Seç' : 'Öğrenci Seç'}</span>
            </label>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Öğrenci Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Student List */}
          <div className="student-list-container">
            <div className="student-list-header">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <span>Hepsini Seç</span>
              </label>
              <span className="column-header">Alan/Sınıf</span>
              <span className="column-header">Detay</span>
            </div>

            <div className="student-list">
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  {students.length === 0 
                    ? 'Henüz öğrenci eklenmemiş.' 
                    : (activeTab === 'veli' 
                        ? 'Kayıtlı velisi olan öğrenci bulunamadı. (Lütfen get_teacher_students.php dosyasını sunucuya yüklediğinizden emin olun)' 
                        : 'Arama sonucu bulunamadı.')}
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.id} className="student-item">
                    <label className="student-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                      />
                      <span className="student-name">
                        {student.name} {activeTab === 'veli' ? '(veli)' : ''}
                      </span>
                    </label>
                    <span className="student-class">{student.class}</span>
                    <button 
                      className="detail-button"
                      onClick={() => handleDetailClick(student)}
                    >
                      <span className="info-icon">ⓘ</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="message-composer">
          <div className="template-section">
            <label className="template-label">Hazır Şablonlar</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(parseInt(e.target.value))}
              className="template-select"
            >
              <option value="">Şablon Seç ↓</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="message-input-container">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
              className="message-textarea"
              maxLength={500}
            />
            <div className="character-count">
              {message.length}/500
            </div>
          </div>
        </div>

          {/* Action Buttons - Sadece teacher-only filtresi yoksa göster */}
          {filter !== 'teacher-only' && (
            <div className="action-buttons">
              <button className="send-button primary" onClick={handleSendNotification}>
                Gönder
              </button>
              <button className="preview-button secondary">
                Önizle
              </button>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Bildirimler Listesi */}
      <div className="notifications-list-section">
        {filter === 'teacher-only' && (
          <div className="bildirimler-tabs" style={{ marginBottom: 20, display: 'flex', gap: '10px' }}>
              <button
                className={`tab-button ${viewTab === 'received' ? 'active' : ''}`}
                onClick={() => setViewTab('received')}
                style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: viewTab === 'received' ? '#0ea5e9' : '#f1f5f9',
                    color: viewTab === 'received' ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}
              >
                Gelen Kutusu
              </button>
              <button
                className={`tab-button ${viewTab === 'sent' ? 'active' : ''}`}
                onClick={() => setViewTab('sent')}
                style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: viewTab === 'sent' ? '#0ea5e9' : '#f1f5f9',
                    color: viewTab === 'sent' ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}
              >
                Gönderilenler
              </button>
            </div>
        )}
        <h2 className="section-title">{title}</h2>
        
        {loading && (
          <div className="loading-message">
            Bildirimler yükleniyor...
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {!loading && !error && notifications.length === 0 && (
          <div className="no-notifications">
            Henüz bildirim bulunmuyor.
          </div>
        )}
        
        {!loading && !error && notifications.length > 0 && (
          <div className="notifications-list">
            {notifications.map(notification => {
              // is_read kontrolünü daha güvenli hale getir
              const isRead = notification.is_read == 1 || notification.is_read === true || notification.is_read === 'true';
              return (
              <div key={notification.id} className={`notification-item ${!isRead ? 'unread' : ''}`}>
                <div className="notification-content-wrapper">
                    <div className="notification-info-section">
                        <div className="notification-header-row">
                            <h3 className="notification-title">{notification.title}</h3>
                            {!isRead && viewTab !== 'sent' && (
                                <span className="unread-badge">YENİ</span>
                            )}
                        </div>
                        <span className="notification-sender">
                            {viewTab === 'sent' ? (
                                <><span className="label">Alıcı:</span> {notification.recipient_names || 'Tüm Kullanıcılar'}</>
                            ) : (
                                <><span className="label">Gönderen:</span> {notification.sender_name || 'Sistem'}</>
                            )}
                        </span>
                    </div>

                    <div className="notification-message-section">
                        <p className="notification-message">{notification.message}</p>
                    </div>

                    <div className="notification-meta-section">
                        <span className="notification-date">{notification.created_at}</span>
                        <div className="notification-actions">
                            {!isRead && viewTab !== 'sent' && (
                                <button onClick={(e) => handleMarkRead(notification.id, e)} title="Okundu Olarak İşaretle" className="action-btn mark-read">
                                    <FontAwesomeIcon icon={faCheckDouble} />
                                </button>
                            )}
                            <button onClick={(e) => handleDelete(notification.id, e)} title="Sil" className="action-btn delete">
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Modal */}
      {showDetailModal && selectedStudent && (
        <BildirimDetay 
          student={selectedStudent} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default Bildirimler;
