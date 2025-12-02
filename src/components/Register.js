import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardUser, faUserGroup } from '@fortawesome/free-solid-svg-icons';

const roles = [
  { key: 'ogretmen', label: 'Öğretmen', icon: faChalkboardUser },
  { key: 'veli', label: 'Veli', icon: faUserGroup },
];

export default function Register() {
  const API_BASE = process.env.REACT_APP_API_URL || 'https://vedatdaglarmuhendislik.com.tr';
  const [selectedRole, setSelectedRole] = useState('ogretmen');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (password !== password2) {
        throw new Error('Şifreler uyuşmuyor');
      }
      const payload = { firstName, lastName, email, phone, password, role: selectedRole };
      // Geçici debug
      // eslint-disable-next-line no-console
      console.log('REGISTER payload', payload);
      const res = await fetch(`${API_BASE}/api/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Kayıt başarısız' }));
        console.error('Register Error:', data);
        const missing = data && Array.isArray(data.missing) ? ` (Eksik: ${data.missing.join(', ')})` : '';
        throw new Error((data.message || 'Kayıt başarısız') + missing);
      }
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.message || 'Kayıt başarısız');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Kayıt Ol</h2>

        <div className="role-selector">
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`role-button ${selectedRole === r.key ? 'active' : ''}`}
              onClick={() => setSelectedRole(r.key)}
            >
              <FontAwesomeIcon icon={r.icon} className="role-icon" />
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form" style={{ gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="firstName">Ad:</label>
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ad" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="lastName">Soyad:</label>
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyad" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">E‑posta:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@posta.com" required />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefon:</label>
            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="password">Şifre:</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="password2">Şifre (Tekrar):</label>
              <input type="password" id="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="********" required />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="login-button" style={{ marginTop: 8 }}>Kayıt Ol</button>
          <button type="button" className="login-button" onClick={() => navigate('/')} style={{ background: '#F0F1F5', color: '#333' }}>Girişe Dön</button>
        </form>
      </div>
    </div>
  );
}


