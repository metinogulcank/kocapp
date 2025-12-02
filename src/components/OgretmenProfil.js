import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faUser, faBell, faComments } from '@fortawesome/free-solid-svg-icons';
import './OgretmenProfil.css';

const OgretmenProfil = () => {
  const navigate = useNavigate();

  const teacher = {
    name: 'Ayşe Yılmaz',
    branch: 'Psikolojik Danışman',
    activeStudentCount: 7,
    limit: 10
  };

  return (
    <div className="teacher-profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/ogretmen-panel')}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="header-right">
          <FontAwesomeIcon className="header-icon" icon={faBell} />
          <FontAwesomeIcon className="header-icon" icon={faComments} />
          <FontAwesomeIcon className="header-icon" icon={faUser} />
        </div>
      </div>

      <div className="profile-card">
        <div className="avatar">AY</div>
        <div className="info">
          <div className="name-row">
            <h2 className="name">{teacher.name}</h2>
            <button className="edit-btn">Profili Düzenle</button>
          </div>
          <div className="meta">
            <span className="branch">Branş: {teacher.branch}</span>
            <span className="dot" />
            <span className="active">Aktif öğrenci sayısı {teacher.limit}/{teacher.activeStudentCount}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-tiles">
        <div className="tile">
          <div className="tile-title">Abonelik bitiş süresi</div>
          <div className="tile-value large">90</div>
        </div>
        <div className="tile">
          <div className="tile-title">Öğrenci sayısı</div>
          <div className="tile-value"><span className="highlight">{teacher.limit}/{teacher.activeStudentCount}</span></div>
          <div className="tile-sub">Öğrenci limitim: {teacher.limit} • Öğrenci sayım: {teacher.activeStudentCount}</div>
        </div>
        <div className="tile">
          <div className="tile-title">Öğrenci randevu alanı</div>
          <div className="tile-icon">🗓️</div>
        </div>
        <div className="tile">
          <div className="tile-title">Öğrencileri listele</div>
          <div className="tile-icon">📋</div>
        </div>
        <div className="tile add">
          <div className="tile-title green">Yeni öğrenci ekle</div>
          <div className="tile-icon">➕</div>
        </div>
      </div>
    </div>
  );
};

export default OgretmenProfil;


