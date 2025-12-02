import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Panel.css';

const OgrenciPanel = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h1>Öğrenci Paneli</h1>
        <button onClick={handleLogout} className="logout-button">
          Çıkış Yap
        </button>
      </div>

      <div className="panel-content">
        <div className="welcome-section">
          <h2>Hoş Geldiniz, Öğrenci!</h2>
          <p>Bu panelden derslerinizi takip edebilir, ödevlerinizi yapabilir ve öğretmenlerinizle iletişim kurabilirsiniz.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📚</div>
            <h3>Derslerim</h3>
            <p>Kayıtlı olduğunuz dersleri görüntüleyin</p>
            <button className="card-button">Dersleri Görüntüle</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📝</div>
            <h3>Ödevlerim</h3>
            <p>Size verilen ödevleri görüntüleyin ve teslim edin</p>
            <button className="card-button">Ödevleri Görüntüle</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Notlarım</h3>
            <p>Ders notlarınızı ve aldığınız puanları görüntüleyin</p>
            <button className="card-button">Notları Görüntüle</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📅</div>
            <h3>Takvim</h3>
            <p>Ders programınızı ve önemli tarihleri görüntüleyin</p>
            <button className="card-button">Takvimi Görüntüle</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💬</div>
            <h3>Mesajlar</h3>
            <p>Öğretmenlerinizle mesajlaşın</p>
            <button className="card-button">Mesajları Görüntüle</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📖</div>
            <h3>Kaynaklar</h3>
            <p>Ders materyallerini ve kaynakları görüntüleyin</p>
            <button className="card-button">Kaynakları Görüntüle</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OgrenciPanel;
