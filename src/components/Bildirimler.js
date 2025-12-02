import React, { useState } from 'react';
import './Bildirimler.css';
import BildirimDetay from './BildirimDetay';

const Bildirimler = ({ students = [] }) => {
  const [activeTab, setActiveTab] = useState('ogrenci');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // students prop'undan gelen veriyi kullan, format: { id, name, class }
  // Eğer backend formatı farklıysa (firstName, lastName, className) onu da handle edelim
  const formattedStudents = students.map(s => ({
    id: s.id,
    name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
    class: s.class || s.className || '',
    field: s.class || s.className || ''
  }));

  // Hazır şablonlar
  const templates = [
    { id: 1, name: 'Sınav Hatırlatması', content: 'Sevgili öğrencim, yaklaşan sınavınız için hazırlıklarınızı tamamlamayı unutmayın.' },
    { id: 2, name: 'Ödev Hatırlatması', content: 'Ödev teslim tarihiniz yaklaşıyor. Lütfen ödevinizi zamanında teslim edin.' },
    { id: 3, name: 'Genel Duyuru', content: 'Önemli bir duyuru paylaşmak istiyorum. Lütfen dikkatle okuyun.' }
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleRecipientTypeChange = (type) => {
    setRecipientType(type);
  };

  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
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
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content);
    }
  };

  const filteredStudents = formattedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDetailClick = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="bildirimler-container">
      <div className="bildirimler-header">
        <h1 className="bildirimler-title">Bildirim Oluştur</h1>
      </div>

      {/* Tab Navigation */}
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

      {/* Main Content */}
      <div className="bildirimler-content">
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
                onChange={(e) => handleRecipientTypeChange(e.target.value)}
              />
              <span className="radio-label">Tüm Öğrenciler</span>
            </label>
            
            <label className="radio-option">
              <input
                type="radio"
                name="recipientType"
                value="class"
                checked={recipientType === 'class'}
                onChange={(e) => handleRecipientTypeChange(e.target.value)}
              />
              <span className="radio-label">Sınıfa Göre</span>
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
                  {students.length === 0 ? 'Henüz öğrenci eklenmemiş.' : 'Arama sonucu bulunamadı.'}
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
                      <span className="student-name">{student.name}</span>
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

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="send-button primary">
            Gönder
          </button>
          <button className="preview-button secondary">
            Önizle
          </button>
        </div>
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
