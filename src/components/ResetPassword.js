import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Login.css';

export default function ResetPassword() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      if (!token) throw new Error('Geçersiz bağlantı');
      if (password !== password2) throw new Error('Şifreler uyuşmuyor');
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'İşlem başarısız');
      }
      setStatus('Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'İşlem başarısız');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Şifre Sıfırla</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Yeni Şifre:</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="********" />
          </div>
          <div className="form-group">
            <label htmlFor="password2">Yeni Şifre (Tekrar):</label>
            <input id="password2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required placeholder="********" />
          </div>
          {error && <div className="error-message">{error}</div>}
          {status && <div className="success-message">{status}</div>}
          <button type="submit" className="login-button">Şifreyi Güncelle</button>
        </form>
      </div>
    </div>
  );
}


