import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL || 'https://vedatdaglarmuhendislik.com.tr';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Giriş başarısız' }));
        throw new Error(data.message || 'Giriş başarısız');
      }
      const data = await res.json();
      
      // Token'ı localStorage'a kaydet
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          email: data.email,
          role: data.role,
          studentId: data.studentId || null,
          linkedStudentId: data.studentId || null
        }));
      }
      
      if (data.role === 'ogretmen') {
        navigate('/ogretmen-panel');
      } else if (data.role === 'veli') {
        navigate('/veli-panel');
      } else {
        navigate('/ogrenci-panel');
      }
    } catch (err) {
      setError(err.message || 'Giriş başarısız');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Online Öğrenim Sistemi</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">E‑posta:</label>
            <input
              type="email"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ornek@posta.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Şifre:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Giriş Yap
          </button>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <span>Hesabınız yok mu? </span>
            <a
              href="/register"
              onClick={(e) => { e.preventDefault(); navigate('/register'); }}
            >
              Kayıt Ol
            </a>
          </div>
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <a
              href="/forgot-password"
              onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
            >
              Şifremi Unuttum
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
