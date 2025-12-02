import React, { useState } from 'react';
import './BildirimDetay.css';

const BildirimDetay = ({ student, onClose }) => {
  const [messageType, setMessageType] = useState('ogrenci');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendType, setSendType] = useState('now');

  // Örnek gönderilen bildirimler geçmişi
  const notificationHistory = [
    {
      id: 1,
      subject: 'Proje Ödevi',
      recipient: '9 B Sınıfı',
      date: '15/03/2024',
      content: 'Proje ödevi teslim tarihi yaklaşıyor...'
    },
    {
      id: 2,
      subject: 'Sınav Hatırlatması',
      recipient: '9 B Sınıfı',
      date: '10/03/2024',
      content: 'Matematik sınavı için hazırlıklarınızı tamamlayın...'
    },
    {
      id: 3,
      subject: 'Veli Toplantısı',
      recipient: '9 B Sınıfı',
      date: '05/03/2024',
      content: 'Veli toplantısı tarihi değişti...'
    }
  ];

  const handleSendNow = () => {
    // Bildirim gönderme işlemi
    console.log('Bildirim gönderiliyor:', {
      student: student.name,
      type: messageType,
      subject: messageSubject,
      content: messageContent
    });
    // Başarı mesajı göster
    alert('Bildirim başarıyla gönderildi!');
    onClose();
  };

  const handleSchedule = () => {
    // Zamanlama işlemi
    console.log('Bildirim zamanlanıyor:', {
      student: student.name,
      type: messageType,
      subject: messageSubject,
      content: messageContent
    });
    alert('Bildirim zamanlandı!');
  };

  const handleViewNotification = (notification) => {
    // Bildirim detayını göster
    alert(`Bildirim Detayı:\n\nKonu: ${notification.subject}\nAlıcı: ${notification.recipient}\nTarih: ${notification.date}\n\nİçerik: ${notification.content}`);
  };

  return (
    <div className="bildirim-detay-overlay">
      <div className="bildirim-detay-container">
        {/* Header */}
        <div className="bildirim-detay-header">
          <button className="back-button" onClick={onClose}>
            ←
          </button>
          <div className="header-actions">
            <button className="pdf-button">PDF</button>
            <button className="menu-button">⋮</button>
          </div>
        </div>

        {/* Student Profile */}
        <div className="student-profile">
          <div className="profile-picture">
            <img src="/api/placeholder/80/80" alt={student.name} />
          </div>
          <div className="profile-info">
            <h1 className="profile-title">Bildirim Gönder</h1>
            <div className="profile-details">
              <p className="profile-class">Sınıf: {student.class}</p>
              <p className="profile-date">Kayıt Tarihi: 15/09/2023</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bildirim-detay-content">
          {/* Left Column - Bildirim Oluştur */}
          <div className="bildirim-olustur">
            <h2 className="section-title">Bildirim Oluştur</h2>
            
            {/* Message Type Selection */}
            <div className="message-type-section">
              <label className="section-label">Kime Gönderilsin?</label>
              <div className="message-type-buttons">
                <button
                  className={`type-button ${messageType === 'ogrenci' ? 'active' : ''}`}
                  onClick={() => setMessageType('ogrenci')}
                >
                  Öğrenciye Mesaj
                </button>
                <button
                  className={`type-button ${messageType === 'veli' ? 'active' : ''}`}
                  onClick={() => setMessageType('veli')}
                >
                  Veliye Mesaj
                </button>
              </div>
            </div>

            {/* Message Form */}
            <div className="message-form">
              <div className="form-group">
                <label className="form-label">Mesaj</label>
                <div className="subject-input-container">
                  <input
                    type="text"
                    placeholder="Önemli Duyuru: Ders Programı Değişimi"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="subject-input"
                  />
                  <span className="print-icon">🖨️</span>
                </div>
              </div>

              <div className="form-group">
                <textarea
                  placeholder="Sayın velilerimiz ve öğrencilerimiz, yeni dönem ders programı ekte yer almaktadır..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="message-textarea"
                  maxLength={500}
                />
                <div className="character-count">
                  {messageContent.length}/500
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="send-now-button" onClick={handleSendNow}>
                Şimdi Gönder
              </button>
              <button className="schedule-button" onClick={handleSchedule}>
                <span className="calendar-icon">📅</span>
                Zamanla
              </button>
            </div>
          </div>

          {/* Right Column - Notification History */}
          <div className="bildirim-gecmisi">
            <h2 className="section-title">Gönderilen Bildirimler Geçmişi</h2>
            
            <div className="notification-list">
              {notificationHistory.map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-radio">
                    <input type="radio" name="notification" />
                  </div>
                  <div className="notification-content">
                    <div className="notification-details">
                      <p className="notification-subject">Konu: {notification.subject}</p>
                      <p className="notification-recipient">Alıcı: {notification.recipient}</p>
                      <p className="notification-date">Tarih: {notification.date}</p>
                    </div>
                  </div>
                  <button 
                    className="view-button"
                    onClick={() => handleViewNotification(notification)}
                  >
                    Görüntüle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BildirimDetay;
