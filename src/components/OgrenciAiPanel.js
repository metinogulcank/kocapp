import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faUser,
  faList,
  faFileAlt,
  faClock,
  faShieldAlt,
  faWrench,
  faBullseye,
  faChartLine,
  faFilter,
  faTimes,
  faRobot,
  faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import './OgrenciAiPanel.css';
import { EXAM_AREA_LABELS } from '../constants/examSubjects';

const OgrenciAiPanel = ({ student }) => {
  const [selectedModule, setSelectedModule] = useState('eksik-tespit');
  const [aiQuery, setAiQuery] = useState('');

  const modules = [
    { id: 'eksik-tespit', label: 'Eksik Tespit', icon: faList, active: true },
    { id: 'konu-tekrar', label: 'Konu Tekrar Önerisi', icon: faFileAlt },
    { id: 'gunluk-soru', label: 'Günlük Soru Analizi', icon: faClock },
    { id: 'riskli-konular', label: 'Riskli Konular', icon: faUser },
    { id: 'deneme-performans', label: 'DENEME PERFORMANS ANALİZ', icon: faShieldAlt, bold: true },
    { id: 'motivasyon', label: 'Motivasyon Mesajı', icon: faFileAlt },
    { id: 'kaynak-onerisi', label: 'SEVİYEYE UYGUN KAYNAK ÖNERİSİ', icon: faFileAlt, bold: true },
    { id: 'haftalik-plan', label: 'KAYITLI TASLAĞA EKSİKLERE GÖRE HAFTALIK PLAN OLUŞTURMA', icon: faFileAlt, bold: true },
    { id: 'ogretmen-uyari', label: 'Öğretmen Uyarı Sistemi', icon: faUser },
    { id: 'brans-deneme', label: 'BRANŞ DENEMESİ ANALİZLER,', icon: faFileAlt, bold: true },
    { id: 'konu-kumele', label: 'DERSLERDEKİ KONULARI KÜMELE', icon: faFileAlt, bold: true }
  ];

  const quickActions = [
    { id: 'eksik-analizi', label: 'Eksik Analizi', icon: faList },
    { id: 'kaynak-onerisi', label: 'Kaynak Önerisi', icon: faWrench },
    { id: 'haftalik-plan', label: 'Haftalık Plan', icon: faFileAlt }
  ];

  const getWeeklyGoalColor = (percent) => {
    if (percent < 50) return '#ef4444'; // Kırmızı
    if (percent < 80) return '#f59e0b'; // Sarı
    return '#10b981'; // Yeşil
  };

  // Haftalık hedefi öğrenciden dinamik çek (yoksa 62)
  const rawWeeklyGoal =
    typeof student?.weeklyGoal === 'number'
      ? student.weeklyGoal
      : typeof student?.completed === 'number'
      ? student.completed
      : 62;
  const weeklyGoal = Math.max(0, Math.min(100, Math.round(rawWeeklyGoal)));

  const displayName =
    student?.firstName && student?.lastName
      ? `${student.firstName} ${student.lastName}`
      : student?.name || '';

  const displayClass = student?.className || student?.class || 'Sınıf';

  const getExamLabel = () => {
    const alan = student?.alan;
    if (!alan) return 'Öğrenci';
    if (alan === 'lgs') return 'LGS Adayı';
    if (alan.startsWith('yks_')) return 'YKS Adayı';
    if (alan.startsWith('kpss')) return 'KPSS Adayı';
    // Diğerleri için genel etiket
    return EXAM_AREA_LABELS[alan] ? `${EXAM_AREA_LABELS[alan]} Adayı` : 'Öğrenci';
  };

  return (
    <div className="ogrenci-ai-panel">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <FontAwesomeIcon icon={faCheck} className="ai-logo-icon" />
          <span className="ai-logo-text">KoçAI | Yapay Zeka Merkezi</span>
        </div>
        <div className="ai-header-right">
          <div className="ai-user-dropdown">
            {displayName || 'Öğrenci'}
          </div>
          <div className="ai-weekly-goal-header">
            Haftalık Hedef {weeklyGoal}%
          </div>
          <div className="ai-user-icon">
            <FontAwesomeIcon icon={faUser} />
          </div>
        </div>
      </div>

      <div className="ai-main-container">
        {/* Left Sidebar */}
        <div className="ai-sidebar">
          <h3 className="ai-sidebar-title">Yapay Zeka Modülleri</h3>
          <div className="ai-modules-list">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`ai-module-item ${selectedModule === module.id ? 'active' : ''} ${module.bold ? 'bold' : ''}`}
                onClick={() => setSelectedModule(module.id)}
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
                title="API entegrasyonu bekleniyor"
              >
                <FontAwesomeIcon icon={module.icon} className="ai-module-icon" />
                <span>{module.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="ai-main-content">
          <div className="ai-content-header">
            <FontAwesomeIcon icon={faBullhorn} className="ai-content-icon" />
            <h2 className="ai-content-title">KoçAI Analizi</h2>
          </div>
          <div className="ai-content-body">
            <div className="ai-empty-state">
              <FontAwesomeIcon icon={faRobot} className="ai-empty-icon" />
              <p>Modül seçin veya aşağıdan bir analiz başlatın</p>
            </div>
          </div>

          {/* AI Query Section */}
          <div className="ai-query-section">
            <h3 className="ai-query-title">AI'ya Sor:</h3>
            <input
              type="text"
              className="ai-query-input"
              placeholder="BURAYA YAZIN YADA SOLDAKİ MODÜLLERDEN SEÇİN"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              disabled
            />
            <div className="ai-quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="ai-quick-action-btn"
                  disabled
                  title="API entegrasyonu bekleniyor"
                >
                  <FontAwesomeIcon icon={action.icon} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="ai-right-sidebar">
          <div className="ai-profile-card">
            <div className="ai-profile-image">
              {student?.profilePhoto ? (
                <img src={student.profilePhoto} alt={displayName || 'Öğrenci'} />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>
            <h3 className="ai-profile-name">{displayName}</h3>
            <p className="ai-profile-grade">
              {displayClass} - {getExamLabel()}
            </p>
            <p className="ai-profile-last-login">
              Son giriş: {student?.lastLoginText || student?.lastLogin || student?.last_login || '3 saat önce'}
            </p>
          </div>

          <div className="ai-weekly-goal-card">
            <h3 className="ai-goal-title">HAFTALIK TAMAMLANAN HEDEF</h3>
            <div className="ai-goal-progress-container">
              <div 
                className="ai-goal-progress-bar"
                style={{ 
                  width: `${weeklyGoal}%`,
                  backgroundColor: getWeeklyGoalColor(weeklyGoal)
                }}
              />
            </div>
            <div className="ai-goal-info">
              <span className="ai-goal-label">Haftalık Hedef</span>
              <span 
                className="ai-goal-percent"
                style={{ color: getWeeklyGoalColor(weeklyGoal) }}
              >
                {weeklyGoal}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OgrenciAiPanel;

