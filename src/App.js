import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import OgretmenPanel from './components/OgretmenPanel';
import OgretmenProfil from './components/OgretmenProfil';
import OgrenciPanel from './components/OgrenciPanel';
import OgrenciAiPanel from './components/OgrenciAiPanel';
import VeliPanel from './components/VeliPanel';
import './App.css';
import AdminDashboard from './components/AdminDashboard';

const OgrenciAiPanelWrapper = () => {
  const { studentId } = useParams();
  // Öğrenciyi localStorage'dan oku (OgrenciProgramTab içinden kaydediliyor)
  const stored =
    JSON.parse(localStorage.getItem(`student_ai_${studentId}`)) ||
    JSON.parse(localStorage.getItem(`student_${studentId}`)) ||
    null;

  const student =
    stored || {
      id: studentId,
      firstName: 'Ali',
      lastName: 'Yılmaz',
      className: '8. Sınıf',
      alan: 'lgs',
      profilePhoto: null
    };
  
  return <OgrenciAiPanel student={student} />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/ogretmen-panel" element={<OgretmenPanel />} />
          <Route path="/ogretmen-profil" element={<OgretmenProfil />} />
          <Route path="/ogrenci-panel" element={<OgrenciPanel />} />
          <Route path="/ogrenci-ai/:studentId" element={<OgrenciAiPanelWrapper />} />
          <Route path="/veli-panel" element={<VeliPanel />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
