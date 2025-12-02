import React, { useState } from 'react';
import './Login.css';

export default function ForgotPassword() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'İstek başarısız' }));
        throw new Error(data.message || 'İstek başarısız');
      }
      setStatus('Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.');
    } catch (err) {
      setError(err.message || 'İstek başarısız');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Şifremi Unuttum</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E‑posta:</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ornek@posta.com" />
          </div>
          {error && <div className="error-message">{error}</div>}
          {status && <div className="success-message">{status}</div>}
          <button type="submit" className="login-button">Bağlantı Gönder</button>
        </form>
      </div>
    </div>
  );
}


