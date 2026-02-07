
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faGaugeHigh, faUserGraduate, faUserTie, faChartBar, faUsers, faUserShield, faChartLine, faCalendarAlt, faList, faUserClock, faLayerGroup, faPlus, faTrash, faEdit, faTimes, faImage, faTint, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminMuhasebeTab from './AdminMuhasebeTab';

const fetchApi = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "URL:", url, "Raw response:", text);
      return { success: false, message: "Geçersiz JSON yanıtı", raw: text };
    }
  } catch (fetchError) {
    console.error("Fetch error:", fetchError, "URL:", url);
    return { success: false, message: "İstek hatası" };
  }
};

const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://kocapp.com' : window.location.origin);

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { key: 'dashboard', icon: faGaugeHigh, label: 'Genel Bakış' },
    { key: 'users', icon: faUsers, label: 'Kullanıcılar' },
    { key: 'muhasebe', icon: faMoneyBill, label: 'Muhasebe' },
    { key: 'exam-management', icon: faLayerGroup, label: 'Sınavlar/Dersler/Konular' },
    { key: 'ders-detay', icon: faChalkboardTeacher, label: 'Ders Detay' },
    { key: 'course-style', icon: faEdit, label: 'Ders Yönetimi' },
    { key: 'reports', icon: faChartBar, label: 'Raporlar' },
  ];

  return (
    <div style={{ width: 260, background: 'white', borderRight: '1px solid #e5e7eb', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <h1 style={{ color: '#6a1b9a', fontSize: 26, fontWeight: 800 }}>KoçAPP Panel</h1>
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: 'calc(100% - 32px)',
              margin: '4px 16px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              background: activeTab === item.key ? '#6a1b9a15' : 'transparent',
              color: activeTab === item.key ? '#6a1b9a' : '#374151',
            }}
          >
            <FontAwesomeIcon icon={item.icon} style={{ marginRight: 12, width: 18 }} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

const CourseStyleTab = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [color, setColor] = useState('#6a1b9a');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      const data = await fetchApi(`${API_BASE}/php-backend/api/get_exams.php`);
      if (data.success) setExams(data.exams || []);
    };
    fetchExams();
  }, []);

  const handleExamSelect = async (exam) => {
    setSelectedExam(exam);
    setSelectedComponent(null);
    setSubjects([]);
    setSelectedSubject(null);
    const compData = await fetchApi(`${API_BASE}/php-backend/api/get_components.php?sinavId=${encodeURIComponent(exam.id)}`);
    if (compData.success && Array.isArray(compData.components) && compData.components.length > 0) {
      setComponents(compData.components);
    } else {
      setComponents([]);
      const courseData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?sinavId=${encodeURIComponent(exam.id)}`);
      if (courseData.success) setSubjects(courseData.subjects || []);
    }
  };

  const handleComponentSelect = async (component) => {
    setSelectedComponent(component);
    setSelectedSubject(null);
    const courseData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?componentId=${encodeURIComponent(component.id)}`);
    if (courseData.success) setSubjects(courseData.subjects || []);
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setColor(subject.color || '#6a1b9a');
  };

  const handleUploadIcon = async () => {
    if (!selectedSubject?.id || !iconFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('icon', iconFile);
      formData.append('ders_id', String(selectedSubject.id));
      const res = await fetchApi(`${API_BASE}/php-backend/api/upload_subject_icon.php`, {
        method: 'POST',
        body: formData
      });
      if (res && res.url) {
        setSelectedSubject(prev => ({ ...prev, icon_url: res.url }));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStyle = async () => {
    if (!selectedSubject?.id) return;
    setSaving(true);
    try {
      const body = JSON.stringify({
        ders_id: selectedSubject.id,
        color,
        icon_url: selectedSubject.icon_url || ''
      });
      const res = await fetchApi(`${API_BASE}/php-backend/api/update_subject_style.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (res && res.success) {
        const subjectIdx = subjects.findIndex(s => s.id === selectedSubject.id);
        if (subjectIdx >= 0) {
          const updated = [...subjects];
          updated[subjectIdx] = { ...updated[subjectIdx], color, icon_url: selectedSubject.icon_url || '' };
          setSubjects(updated);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const PreviewCard = () => {
    if (!selectedSubject) return (
      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sağda önizleme burada görünecek.</div>
    );
    const accent = color || '#6a1b9a';
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {selectedSubject.icon_url ? (
            <img src={selectedSubject.icon_url} alt="ikon" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 8, background: `${accent}22`, display: 'grid', placeItems: 'center' }}>
              <FontAwesomeIcon icon={faImage} style={{ color: accent }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{selectedSubject.ders_adi}</h3>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Örnek İlerleme</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>%68</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', background: accent }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#111827' }}>Sınav</h4>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => handleExamSelect(exam)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  textAlign: 'left',
                  background: selectedExam?.id === exam.id ? '#6a1b9a15' : 'transparent',
                  color: selectedExam?.id === exam.id ? '#6a1b9a' : '#374151',
                  border: 'none',
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: 'pointer',
                  fontWeight: selectedExam?.id === exam.id ? 600 : 400,
                }}
              >
                {exam.ad}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#111827' }}>Bileşen</h4>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {components.length === 0 ? (
              <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Bileşen yok</div>
            ) : (
              components.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => handleComponentSelect(comp)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: selectedComponent?.id === comp.id ? '#6a1b9a15' : 'transparent',
                    color: selectedComponent?.id === comp.id ? '#6a1b9a' : '#374151',
                    border: 'none',
                    borderRadius: 6,
                    marginBottom: 4,
                    cursor: 'pointer',
                    fontWeight: selectedComponent?.id === comp.id ? 600 : 400,
                  }}
                >
                  {comp.ad}
                </button>
              ))
            )}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#111827' }}>Ders</h4>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {subjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleSubjectSelect(sub)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  textAlign: 'left',
                  background: selectedSubject?.id === sub.id ? '#6a1b9a15' : 'transparent',
                  color: selectedSubject?.id === sub.id ? '#6a1b9a' : '#374151',
                  border: 'none',
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: 'pointer',
                  fontWeight: selectedSubject?.id === sub.id ? 600 : 400,
                }}
              >
                {sub.ders_adi}
              </button>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1 / span 3', background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#111827' }}>Stil Ayarları</h4>
          {selectedSubject ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                  <FontAwesomeIcon icon={faImage} style={{ marginRight: 8, color: '#6a1b9a' }} />
                  PNG İkon
                </label>
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleUploadIcon}
                    disabled={!iconFile || uploading}
                    style={{
                      background: uploading ? '#9ca3af' : '#6a1b9a',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 12px',
                      cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Yükle
                  </button>
                  {selectedSubject?.icon_url && (
                    <a href={selectedSubject.icon_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#6a1b9a' }}>
                      Mevcut ikon
                    </a>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                    <FontAwesomeIcon icon={faTint} style={{ marginRight: 8, color: '#6a1b9a' }} />
                    Renk
                  </label>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={handleSaveStyle}
                    disabled={saving}
                    style={{
                      background: saving ? '#9ca3af' : 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 16px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Kaydet
                  </button>
                </div>
              </div>
              <div>
                <PreviewCard />
              </div>
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Ders seçiniz.</div>
          )}
        </div>
      </div>
      <div>
        <PreviewCard />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flex: 1,
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: `${color}20`
      }}>
        <FontAwesomeIcon icon={icon} style={{ color: color, fontSize: 20 }} />
      </div>
      <div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{title}</p>
        <p style={{ margin: '4px 0 0', color: '#111827', fontSize: 28, fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );

const DashboardSection = ({ title, icon, children }) => (
    <div style={{
        background: 'white',
        borderRadius: 12,
        padding: '20px',
        border: '1px solid #e5e7eb'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FontAwesomeIcon icon={icon} style={{ color: '#6a1b9a' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{title}</h3>
        </div>
        {children}
    </div>
);

const DashboardTab = () => {
    const [stats, setStats] = useState({
      totalUsers: 0,
      students: 0,
      teachers: 0,
      parents: 0,
      onlineStudents: 0,
      onlineTeachers: 0,
      loginsToday: 0,
      newSignups: 0,
      growth_stats: [],
      weekly_stats: []
    });
    const [recentUsers, setRecentUsers] = useState([]);
  
    useEffect(() => {
      const fetchStats = async () => {
        try {
          const response = await fetchApi(`${API_BASE}/php-backend/api/get_dashboard_stats.php`);
          if (response.success) {
            setStats({
              totalUsers: response.data.total_users || 0,
              students: response.data.total_students || 0,
              teachers: response.data.total_teachers || 0,
              parents: response.data.total_parents || 0,
              onlineStudents: response.data.online_students || 0,
              onlineTeachers: response.data.online_teachers || 0,
              loginsToday: response.data.today_logins || 0,
              newSignups: response.data.new_registrations || 0,
              growth_stats: response.data.growth_stats || [],
              weekly_stats: response.data.weekly_stats || [],
            });
            setRecentUsers(response.data.recent_users || []);
          }
        } catch (error) {
          console.error("İstatistikler alınırken hata oluştu:", error);
        }
      };
  
      fetchStats();
    }, []);
  
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 24 }}>
          <StatCard title="Toplam Kullanıcı" value={stats.totalUsers} icon={faUsers} color="#6a1b9a" />
          <StatCard title="Öğrenci" value={stats.students} icon={faUserGraduate} color="#34d399" />
          <StatCard title="Öğretmen" value={stats.teachers} icon={faUserTie} color="#f59e0b" />
          <StatCard title="Veli" value={stats.parents} icon={faUserShield} color="#ef4444" />
        </div>
  
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
            <DashboardSection title="Büyüme Trendleri" icon={faChartLine}>
                <div style={{height: 250, width: '100%'}}>
                    {stats.growth_stats && stats.growth_stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.growth_stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                    itemStyle={{color: '#6a1b9a'}}
                                />
                                <Line type="monotone" dataKey="kullanici" stroke="#6a1b9a" strokeWidth={3} dot={{r: 4, fill: '#6a1b9a', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af'}}>Veri yok</div>
                    )}
                </div>
            </DashboardSection>
            <DashboardSection title="Haftalık Kayıt" icon={faCalendarAlt}>
                <div style={{height: 250, width: '100%'}}>
                    {stats.weekly_stats && stats.weekly_stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.weekly_stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: '#f3f4f6'}}
                                    contentStyle={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                />
                                <Bar dataKey="kayit" fill="#34d399" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af'}}>Veri yok</div>
                    )}
                </div>
            </DashboardSection>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
            <DashboardSection title="Son Kayıtlar" icon={faList}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Ad</th>
                            <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Rol</th>
                            <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentUsers.length > 0 ? recentUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px 0', fontSize: 14 }}>{user.name}</td>
                                <td style={{ padding: '12px 0', fontSize: 14 }}>{user.role}</td>
                                <td style={{ padding: '12px 0', fontSize: 14 }}>{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>Son kullanıcı bulunamadı.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </DashboardSection>

            <DashboardSection title="Aktif Kullanıcılar" icon={faUserClock}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Online Öğrenci</p>
                        <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{stats.onlineStudents}</p>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Online Öğretmen</p>
                        <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{stats.onlineTeachers}</p>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Bugün Login</p>
                        <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{stats.loginsToday}</p>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Yeni Kayıt</p>
                        <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{stats.newSignups}</p>
                    </div>
                </div>
            </DashboardSection>
        </div>
      </div>
    );
  };

const DersDetayTab = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedSubComponent, setSelectedSubComponent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState({ kaynak_adi: '', kaynak_tipi: 'video' });
  const [editingResource, setEditingResource] = useState(null);
  const [isResourceEditorOpen, setIsResourceEditorOpen] = useState(false);
  const resourceInputRef = useRef(null);

  const rootComponents = useMemo(() => {
    const tops = components.filter(c => !c.parent_id);
    const groupKeywords = ['SAYISAL', 'SÖZEL', 'EŞİT AĞIRLIK', 'DİL'];
    const hasYksGroup = tops.some(c => (c.ad || '').toUpperCase().includes('YKS')) || tops.some(c => groupKeywords.some(k => (c.ad || '').toUpperCase().includes(k)));
    if (!hasYksGroup) return tops;
    return tops.filter(c => !['TYT', 'AYT'].includes((c.ad || '').toUpperCase()));
  }, [components]);
  const subComponents = useMemo(() => selectedComponent ? components.filter(c => c.parent_id === selectedComponent.id) : [], [components, selectedComponent]);
  const virtualOturumlar = useMemo(() => {
    if (!selectedComponent || subComponents.length > 0) return [];
    const tops = components.filter(c => !c.parent_id);
    return tops.filter(c => ['TYT', 'AYT'].includes((c.ad || '').toUpperCase()));
  }, [components, selectedComponent, subComponents]);

  useEffect(() => {
    if (isResourceEditorOpen && resourceInputRef.current && document.activeElement !== resourceInputRef.current) {
      resourceInputRef.current.focus();
    }
  }, [resourceForm.kaynak_adi, isResourceEditorOpen]);

  const fetchExams = async () => {
    const data = await fetchApi(`${API_BASE}/php-backend/api/get_exams.php`);
    if (data.success) setExams(data.exams || []);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleExamSelect = async (exam) => {
    setSelectedExam(exam);
    setSelectedComponent(null);
    setSelectedSubComponent(null);
    setCourses([]);
    setSelectedCourse(null);
    setTopics([]);
    setIsResourceEditorOpen(false);
    const compData = await fetchApi(`${API_BASE}/php-backend/api/get_components.php?sinavId=${encodeURIComponent(exam.id)}`);
    if (compData.success && compData.components && compData.components.length > 0) {
      setComponents(compData.components);
    } else {
      setComponents([]);
      const courseData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?sinavId=${encodeURIComponent(exam.id)}`);
      if (courseData.success) setCourses(courseData.subjects || []);
    }
  };

  const handleComponentSelect = async (component) => {
    setSelectedComponent(component);
    setSelectedSubComponent(null);
    setSelectedCourse(null);
    setTopics([]);
    setIsResourceEditorOpen(false);
    const hasSub = components.some(c => c.parent_id === component.id);
    const tops = components.filter(c => !c.parent_id);
    const hasTopLevelOturum = tops.some(c => ['TYT','AYT'].includes((c.ad || '').toUpperCase()));
    if (hasSub || hasTopLevelOturum) {
      setCourses([]);
    } else {
      const courseData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?componentId=${encodeURIComponent(component.id)}`);
      if (courseData.success) setCourses(courseData.subjects || []);
      else setCourses([]);
    }
  };

  const handleSubComponentSelect = async (subComp) => {
    setSelectedSubComponent(subComp);
    setSelectedCourse(null);
    setTopics([]);
    setIsResourceEditorOpen(false);
    const courseData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?componentId=${encodeURIComponent(subComp.id)}`);
    if (courseData.success) setCourses(courseData.subjects || []);
    else setCourses([]);
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setSelectedTopic(null);
    setIsResourceEditorOpen(false);
    const topicData = await fetchApi(`${API_BASE}/php-backend/api/get_subject_topics.php?dersId=${encodeURIComponent(course.id)}&includeSubtopics=true&t=${Date.now()}`);
    if (topicData.success) {
      const allTopics = topicData.topics || [];
      
      // Hiyerarşiyi düzleştirilmiş liste olarak hazırla
      const processedTopics = [];
      // Ana konuları bul
      const mainTopics = allTopics.filter(t => !t.parent_id || t.parent_id === '0' || t.parent_id === null);
      
      // Alt konuları grupla
      const subTopicsMap = {};
      allTopics.forEach(t => {
        const pId = String(t.parent_id || '').trim();
        if (pId && pId !== '0') {
            if (!subTopicsMap[pId]) subTopicsMap[pId] = [];
            subTopicsMap[pId].push(t);
        }
      });
      
      // Sıralı listeyi oluştur
      mainTopics.forEach(main => {
        processedTopics.push({ ...main, type: 'main' });
        if (subTopicsMap[main.id]) {
             subTopicsMap[main.id].forEach(sub => {
                processedTopics.push({ ...sub, type: 'sub' });
             });
        }
      });

      setTopics(processedTopics);
      if (processedTopics.length > 0) setSelectedTopic(processedTopics[0]);
    } else {
      setTopics([]);
      setSelectedTopic(null);
    }
  };
  
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    const newTopics = Array.from(topics);
    const [reorderedItem] = newTopics.splice(source.index, 1);
    newTopics.splice(destination.index, 0, reorderedItem);
    setTopics(newTopics);
    const newOrder = newTopics.map(topic => topic.id);
    await fetchApi(`${API_BASE}/php-backend/api/update_topic_order.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_ids: newOrder }),
    });
  };

  const fetchResources = async () => {
    if (!selectedCourse?.id) return;
    const data = await fetchApi(`${API_BASE}/php-backend/api/get_resources.php?ders_id=${encodeURIComponent(selectedCourse.id)}`);
    if (data && data.success) setResources(data.resources || []);
    else setResources([]);
  };

  const handleManageResources = () => {
    if (!selectedCourse) return;
    setIsResourceEditorOpen(true);
    fetchResources();
  };

  const saveResource = async () => {
    if (!selectedCourse) return;
    if (!resourceForm.kaynak_adi || !String(resourceForm.kaynak_adi).trim()) return;

    const createUrl = `${API_BASE}/php-backend/api/create_resource.php`;
    // Düzenleme modunda önce mevcut kaynağı sil, sonra yenisini oluştur
    if (editingResource?.id) {
      const delBody = new URLSearchParams({ id: String(editingResource.id) }).toString();
      await fetchApi(`${API_BASE}/php-backend/api/delete_resource.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: delBody,
      });
    }
    const formBody = new URLSearchParams({
      ders_id: selectedCourse.id,
      kaynak_adi: resourceForm.kaynak_adi,
      kaynak_tipi: resourceForm.kaynak_tipi,
      seviye: resourceForm.seviye || 'orta',
    }).toString();
    const data = await fetchApi(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    if (data.success) {
      setEditingResource(null);
      setResourceForm({ kaynak_adi: '', kaynak_tipi: 'video', seviye: 'orta' });
      fetchResources();
    } else {
      console.error("Kaynak kaydedilemedi:", data.message);
    }
  };

  const deleteResource = async (resourceId) => {
    if (!selectedCourse) return;

    const formBody = new URLSearchParams({ id: String(resourceId) }).toString();
    const data = await fetchApi(`${API_BASE}/php-backend/api/delete_resource.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });

    if (data.success) {
      setResources(resources.filter(r => r.id !== resourceId));
    } else {
      console.error("Kaynak silinemedi:", data.message);
    }
  };

  const SelectionColumn = ({ title, items, selectedItem, onSelect, displayProperty = 'ad' }) => (
    <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 12 }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#111827' }}>{title}</h4>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            style={{
              width: '100%',
              padding: '10px 12px',
              textAlign: 'left',
              background: selectedItem?.id === item.id ? '#6a1b9a15' : 'transparent',
              color: selectedItem?.id === item.id ? '#6a1b9a' : '#374151',
              border: 'none',
              borderRadius: 6,
              marginBottom: 4,
              cursor: 'pointer',
              fontWeight: selectedItem?.id === item.id ? 600 : 400,
            }}
          >
            {item[displayProperty]}
          </button>
        ))}
      </div>
    </div>
  );

  const ResourceEditor = () => (
    <div style={{ marginTop: 20, background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ color: '#111827', fontSize: 16 }}>
          Kaynak Yönetimi: <span style={{ color: '#6a1b9a' }}>{selectedCourse.ders_adi}</span>
        </h4>
        <button onClick={() => { setIsResourceEditorOpen(false); setEditingResource(null); setResourceForm({ kaynak_adi: '' }); }} style={{background: 'none', border: 'none', fontSize: 18, cursor: 'pointer'}}>&times;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 160px auto', gap: 10, marginBottom: 16 }}>
        <input
          ref={resourceInputRef}
          value={resourceForm.kaynak_adi}
          onChange={e => setResourceForm(f => ({ ...f, kaynak_adi: e.target.value }))}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          autoComplete="off"
          placeholder="Kitap Adı"
          style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px' }}
        />
        <select
          value={resourceForm.seviye || 'orta'}
          onChange={e => setResourceForm(f => ({ ...f, seviye: e.target.value }))}
          style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px' }}
        >
          <option value="kolay">Kolay</option>
          <option value="orta">Orta</option>
          <option value="zor">Zor</option>
        </select>
        <button onClick={saveResource} style={{ background: '#6a1b9a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Kaydet</button>
      </div>
      <div>
        {resources.map(res => (
          <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{res.kaynak_adi}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{res.seviye ? `Seviye: ${res.seviye}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditingResource(res); setResourceForm({ kaynak_adi: res.kaynak_adi, seviye: res.seviye || 'orta' }); }} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white' }}>Düzenle</button>
              <button onClick={() => deleteResource(res.id)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #ef4444', background: '#ef4444', color: 'white' }}>Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <SelectionColumn title="Sınav Seçin" items={exams} selectedItem={selectedExam} onSelect={handleExamSelect} />
        {components.length > 0 && <SelectionColumn title="Bileşen Seçin" items={rootComponents} selectedItem={selectedComponent} onSelect={handleComponentSelect} />}
        {selectedComponent && (subComponents.length > 0 || virtualOturumlar.length > 0) && (
          <SelectionColumn
            title="Oturum Seçin"
            items={subComponents.length > 0 ? subComponents : virtualOturumlar}
            selectedItem={selectedSubComponent}
            onSelect={handleSubComponentSelect}
          />
        )}
        {courses.length > 0 && <SelectionColumn title="Ders Seçin" items={courses} selectedItem={selectedCourse} onSelect={handleCourseSelect} displayProperty="ders_adi" />}
      </div>

      {selectedCourse && !isResourceEditorOpen && (
        <div style={{ marginTop: 20, background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ color: '#111827', fontSize: 16 }}>
              Konu ve Kaynak Yönetimi: <span style={{ color: '#6a1b9a' }}>{selectedCourse.ders_adi}</span>
            </h3>
            <button onClick={handleManageResources} style={{ background: '#6a1b9a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
              Kaynakları Yönet
            </button>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="topics">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {topics.map((topic, index) => (
                    <Draggable key={topic.id} draggableId={topic.id} index={index} isDragDisabled={topic.type === 'sub'}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => setSelectedTopic(topic)}
                          style={{
                            userSelect: 'none',
                            padding: '12px',
                            margin: '0 0 8px 0',
                            backgroundColor: selectedTopic?.id === topic.id ? '#6a1b9a0f' : 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            marginLeft: topic.type === 'sub' ? '24px' : '0',
                            borderLeft: topic.type === 'sub' ? '4px solid #6a1b9a' : '1px solid #e5e7eb',
                            fontSize: topic.type === 'sub' ? '14px' : '15px',
                            ...provided.draggableProps.style,
                          }}
                        >
                          {topic.konu_adi}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      
      {selectedCourse && isResourceEditorOpen && <ResourceEditor />}
    </div>
  );
};

const SimpleModal = ({ isOpen, onClose, title, children, onSave }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 400, maxWidth: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <FontAwesomeIcon icon={faTimes} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>
                {children}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>İptal</button>
                    <button onClick={onSave} style={{ padding: '6px 12px', borderRadius: 4, border: 'none', background: '#6a1b9a', color: 'white', cursor: 'pointer' }}>Kaydet</button>
                </div>
            </div>
        </div>
    );
};

const ManagementColumn = ({ title, items, selectedItem, onSelect, onAdd, onEdit, onDelete, renderItem, isDraggable = false, onDragEnd }) => {
    
    const renderList = () => {
        if (items.length === 0) {
            return <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Kayıt yok.</div>;
        }

        const renderItemContent = (item, provided = null, index) => (
            <div
                key={item.id}
                ref={provided?.innerRef}
                {...(provided?.draggableProps || {})}
                {...(provided?.dragHandleProps || {})}
                onClick={() => onSelect && onSelect(item)}
                style={{
                    padding: '10px',
                    marginBottom: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: selectedItem?.id === item.id ? '#6a1b9a10' : '#f9fafb',
                    border: selectedItem?.id === item.id ? '1px solid #6a1b9a' : '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    ...(provided?.draggableProps.style || {})
                }}
            >
                <div style={{ flex: 1, marginRight: 8 }}>{renderItem ? renderItem(item, index) : item.ad || item.ders_adi || item.konu_adi}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <FontAwesomeIcon icon={faEdit} style={{ color: '#4b5563', fontSize: 12, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onEdit && onEdit(item); }} />
                    <FontAwesomeIcon icon={faTrash} style={{ color: '#ef4444', fontSize: 12, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onDelete && onDelete(item); }} />
                </div>
            </div>
        );

        if (isDraggable && onDragEnd) {
            return (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="management-list">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {items.map((item, index) => (
                                    <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                                        {(provided) => renderItemContent(item, provided, index)}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            );
        }

        return items.map((item, index) => renderItemContent(item, null, index));
    };

    return (
        <div style={{ minWidth: 280, flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#111827' }}>{title}</h3>
                <button onClick={onAdd} style={{ background: '#6a1b9a', color: 'white', border: 'none', borderRadius: 4, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 12 }} />
                </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {renderList()}
            </div>
        </div>
    );
};

const ExamManagementTab = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [components, setComponents] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null); // Ana bileşen (Alan)
    const [selectedSubComponent, setSelectedSubComponent] = useState(null); // Alt bileşen (Oturum)
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [subTopics, setSubTopics] = useState([]);

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, data: null });
    const [formData, setFormData] = useState({});

    // Bileşenleri hiyerarşik olarak ayır ve YKS grupları -> TYT/AYT kurgusunu düzelt
    const rootComponents = useMemo(() => {
        const tops = components.filter(c => !c.parent_id);
        const groupKeywords = ['SAYISAL', 'SÖZEL', 'EŞİT AĞIRLIK', 'DİL'];
        const hasYksGroup = tops.some(c => (c.ad || '').toUpperCase().includes('YKS')) || tops.some(c => groupKeywords.some(k => (c.ad || '').toUpperCase().includes(k)));
        if (!hasYksGroup) return tops;
        return tops.filter(c => !['TYT', 'AYT'].includes((c.ad || '').toUpperCase()));
    }, [components]);
    const subComponents = useMemo(() => selectedComponent ? components.filter(c => c.parent_id === selectedComponent.id) : [], [components, selectedComponent]);
    const virtualOturumlar = useMemo(() => {
        if (!selectedComponent || subComponents.length > 0) return [];
        const tops = components.filter(c => !c.parent_id);
        return tops.filter(c => ['TYT', 'AYT'].includes((c.ad || '').toUpperCase()));
    }, [components, selectedComponent, subComponents]);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        const data = await fetchApi(`${API_BASE}/php-backend/api/get_exams.php`);
        if (data.success) setExams(data.exams || []);
    };

    const fetchComponents = async (sinavId) => {
        const data = await fetchApi(`${API_BASE}/php-backend/api/get_components.php?sinavId=${sinavId}`);
        if (data.success) setComponents(data.components || []);
        else setComponents([]);
    };

    const fetchSubjects = async (sinavId, componentId = null) => {
        let url = `${API_BASE}/php-backend/api/get_exam_subjects.php?sinavId=${sinavId}`;
        if (componentId) url += `&componentId=${componentId}`;
        const data = await fetchApi(url);
        if (data.success) setSubjects(data.subjects || []);
        else setSubjects([]);
    };

    const fetchTopics = async (dersId) => {
        const data = await fetchApi(`${API_BASE}/php-backend/api/get_subject_topics.php?dersId=${dersId}&t=${Date.now()}`);
        if (data.success) setTopics(data.topics || []);
        else setTopics([]);
    };

    const fetchSubTopics = async (topicId) => {
        const data = await fetchApi(`${API_BASE}/php-backend/api/get_subject_topics.php?parentId=${topicId}&t=${Date.now()}`);
        if (data.success) setSubTopics(data.topics || []);
        else setSubTopics([]);
    };

    const handleSelectExam = async (exam) => {
        setSelectedExam(exam);
        setSelectedComponent(null);
        setSelectedSubComponent(null);
        setSelectedSubject(null);
        setTopics([]);
        setSelectedTopic(null);
        setSubTopics([]);
        // Bileşenleri yükle ve yoksa sınavın genel derslerini getir
        const compData = await fetchApi(`${API_BASE}/php-backend/api/get_components.php?sinavId=${exam.id}`);
        if (compData.success && Array.isArray(compData.components)) {
            setComponents(compData.components);
            if (compData.components.length === 0) {
                const subjData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?sinavId=${exam.id}`);
                if (subjData.success) setSubjects(subjData.subjects || []);
                else setSubjects([]);
            } else {
                setSubjects([]);
            }
        } else {
            setComponents([]);
            const subjData = await fetchApi(`${API_BASE}/php-backend/api/get_exam_subjects.php?sinavId=${exam.id}`);
            if (subjData.success) setSubjects(subjData.subjects || []);
            else setSubjects([]);
        }
    };

    const handleSelectComponent = (comp) => {
        setSelectedComponent(comp);
        setSelectedSubComponent(null);
        setSelectedSubject(null);
        setTopics([]);
        setSelectedTopic(null);
        setSubTopics([]);
        
        // Eğer alt bileşenleri varsa dersleri getirme, alt bileşen seçmesini bekle
        // Ancak bu kontrolü render sırasında değil burada yapmak için güncel components listesine ihtiyacımız var
        // State güncellenmeden önceki components listesini kullanabiliriz
        const hasSub = components.some(c => c.parent_id === comp.id);
        const tops = components.filter(c => !c.parent_id);
        const hasTopLevelOturum = tops.some(c => ['TYT','AYT'].includes((c.ad || '').toUpperCase()));
        if (hasSub) {
            setSubjects([]);
        } else if (hasTopLevelOturum) {
            // TYT/AYT üstte duruyorsa sanal alt bileşen gibi göster, ders fetch etme
            setSubjects([]);
        } else {
            fetchSubjects(selectedExam.id, comp.id);
        }
    };

    const handleSelectSubComponent = (subComp) => {
        setSelectedSubComponent(subComp);
        setSelectedSubject(null);
        setTopics([]);
        setSelectedTopic(null);
        setSubTopics([]);
        fetchSubjects(selectedExam.id, subComp.id);
    };

    const handleSelectSubject = (subj) => {
        setSelectedSubject(subj);
        setSelectedTopic(null);
        setSubTopics([]);
        fetchTopics(subj.id);
    };

    const handleSelectTopic = (topic) => {
        setSelectedTopic(topic);
        fetchSubTopics(topic.id);
    };

    const handleTopicDragEnd = async (result) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;
        
        const newTopics = Array.from(topics);
        const [reorderedItem] = newTopics.splice(result.source.index, 1);
        newTopics.splice(result.destination.index, 0, reorderedItem);
        
        setTopics(newTopics);
        
        const newOrder = newTopics.map(t => t.id);
        await fetchApi(`${API_BASE}/php-backend/api/update_topic_order.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic_ids: newOrder, type: 'topic' })
        });
    };

    const handleSubTopicDragEnd = async (result) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;
        
        const newSubTopics = Array.from(subTopics);
        const [reorderedItem] = newSubTopics.splice(result.source.index, 1);
        newSubTopics.splice(result.destination.index, 0, reorderedItem);
        
        setSubTopics(newSubTopics);
        
        const newOrder = newSubTopics.map(t => t.id);
        await fetchApi(`${API_BASE}/php-backend/api/update_topic_order.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic_ids: newOrder, type: 'subTopic' })
        });
    };

    const openModal = (type, data = null) => {
        setModalConfig({ isOpen: true, type, data });
        if (data) {
            setFormData({ ...data }); 
        } else {
            setFormData({}); 
        }
    };

    const handleSave = async () => {
        const { type, data } = modalConfig;
        let url = '', body = {};
        const isEdit = !!data;

        if (type === 'exam') {
            url = isEdit ? 'update_exam.php' : 'create_exam.php';
            body = { ...formData };
            if (isEdit) body.id = data.id;
        } else if (type === 'component' || type === 'subComponent') {
            url = isEdit ? 'update_component.php' : 'create_component.php';
            body = { 
                ...formData, 
                sinavId: selectedExam.id,
                parentId: type === 'subComponent' ? selectedComponent.id : null
            };
            if (isEdit) body.id = data.id;
        } else if (type === 'subject') {
            url = isEdit ? 'update_exam_subject.php' : 'create_exam_subject.php';
            // Ders, seçili alt bileşene veya seçili ana bileşene bağlıdır
            const targetCompId = selectedSubComponent ? selectedSubComponent.id : (selectedComponent ? selectedComponent.id : null);
            body = { ...formData, sinavId: selectedExam.id, componentId: targetCompId };
            if (isEdit) body.id = data.id;
        } else if (type === 'topic' || type === 'subTopic') {
            url = isEdit ? 'update_subject_topic.php' : 'create_subject_topic.php';
            body = { ...formData, dersId: selectedSubject.id };
            if (type === 'subTopic') {
                body.parentId = selectedTopic.id;
            }
            if (isEdit) body.id = data.id;
        }

        const res = await fetchApi(`${API_BASE}/php-backend/api/${url}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (res.success) {
            setModalConfig({ isOpen: false, type: null, data: null });
            if (type === 'exam') fetchExams();
            else if (type === 'component' || type === 'subComponent') fetchComponents(selectedExam.id);
            else if (type === 'subject') fetchSubjects(selectedExam.id, selectedSubComponent?.id || selectedComponent?.id);
            else if (type === 'topic') fetchTopics(selectedSubject.id);
            else if (type === 'subTopic') fetchSubTopics(selectedTopic.id);
        } else {
            alert(res.message || 'Bir hata oluştu');
        }
    };
    
    const handleDelete = async (type, item) => {
        if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
        let url = '';
        if (type === 'exam') url = 'delete_exam.php';
        else if (type === 'component' || type === 'subComponent') url = 'delete_component.php';
        else if (type === 'subject') url = 'delete_exam_subject.php';
        else if (type === 'topic' || type === 'subTopic') url = 'delete_subject_topic.php';
        
        const res = await fetchApi(`${API_BASE}/php-backend/api/${url}`, {
            method: 'POST',
            body: JSON.stringify({ id: item.id })
        });
        
        if (res.success) {
             if (type === 'exam') {
                 fetchExams();
                 setSelectedExam(null);
             }
            else if (type === 'component' || type === 'subComponent') {
                fetchComponents(selectedExam.id);
                if (type === 'component' && selectedComponent?.id === item.id) setSelectedComponent(null);
                if (type === 'subComponent' && selectedSubComponent?.id === item.id) setSelectedSubComponent(null);
            }
            else if (type === 'subject') {
                fetchSubjects(selectedExam.id, selectedSubComponent?.id || selectedComponent?.id);
                if (selectedSubject?.id === item.id) setSelectedSubject(null);
            }
            else if (type === 'topic') fetchTopics(selectedSubject.id);
            else if (type === 'subTopic') fetchSubTopics(selectedTopic.id);
        } else {
            alert(res.message || 'Silinemedi');
        }
    };

    return (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 100px)', overflowX: 'auto', paddingBottom: 10 }}>
            <ManagementColumn 
                title="Sınavlar" 
                items={exams} 
                selectedItem={selectedExam} 
                onSelect={handleSelectExam}
                onAdd={() => openModal('exam')}
                onEdit={(item) => openModal('exam', item)}
                onDelete={(item) => handleDelete('exam', item)}
            />
            
            {selectedExam && (
                <ManagementColumn 
                    title="Alanlar / Gruplar" 
                    items={rootComponents} 
                    selectedItem={selectedComponent} 
                    onSelect={handleSelectComponent}
                    onAdd={() => openModal('component')}
                    onEdit={(item) => openModal('component', item)}
                    onDelete={(item) => handleDelete('component', item)}
                    renderItem={(item) => <span>{item.ad} <span style={{fontSize:11, color:'#666'}}>({item.tur})</span></span>}
                />
            )}

            {selectedComponent && (subComponents.length > 0 || virtualOturumlar.length > 0) && (
                <ManagementColumn 
                    title="Oturumlar / Alt Bileşenler" 
                    items={subComponents.length > 0 ? subComponents : virtualOturumlar} 
                    selectedItem={selectedSubComponent} 
                    onSelect={handleSelectSubComponent}
                    onAdd={() => openModal('subComponent')}
                    onEdit={(item) => openModal('subComponent', item)}
                    onDelete={(item) => handleDelete('subComponent', item)}
                    renderItem={(item) => <span>{item.ad} <span style={{fontSize:11, color:'#666'}}>({item.tur})</span></span>}
                />
            )}
            
            {(selectedSubComponent || (selectedComponent && subComponents.length === 0) || (selectedExam && rootComponents.length === 0)) && (
                <ManagementColumn 
                    title={
                        selectedSubComponent 
                            ? `${selectedSubComponent.ad} Dersleri` 
                            : selectedComponent 
                                ? `${selectedComponent.ad} Dersleri` 
                                : `${selectedExam.ad} Dersleri`
                    } 
                    items={subjects} 
                    selectedItem={selectedSubject} 
                    onSelect={handleSelectSubject}
                    onAdd={() => openModal('subject')}
                    onEdit={(item) => openModal('subject', item)}
                    onDelete={(item) => handleDelete('subject', item)}
                    renderItem={(item) => <span>{item.ders_adi} <span style={{fontSize:11, color:'#666'}}>({item.soru_sayisi || 0} soru)</span></span>}
                />
            )}
            
            {selectedSubject && (
                <ManagementColumn 
                    title={`${selectedSubject.ders_adi} Konuları`} 
                    items={topics} 
                    selectedItem={selectedTopic} 
                    onSelect={handleSelectTopic}
                    onAdd={() => openModal('topic')}
                    onEdit={(item) => openModal('topic', item)}
                    onDelete={(item) => handleDelete('topic', item)}
                    renderItem={(item, index) => `${index + 1}. ${item.konu_adi}`}
                    isDraggable={true}
                    onDragEnd={handleTopicDragEnd}
                />
            )}

            {selectedTopic && (
                <ManagementColumn 
                    title={`${selectedTopic.konu_adi} Alt Konuları`} 
                    items={subTopics} 
                    selectedItem={null} 
                    onSelect={null}
                    onAdd={() => openModal('subTopic')}
                    onEdit={(item) => openModal('subTopic', item)}
                    onDelete={(item) => handleDelete('subTopic', item)}
                    renderItem={(item, index) => `${index + 1}. ${item.alt_konu_adi || item.konu_adi}`}
                    isDraggable={true}
                    onDragEnd={handleSubTopicDragEnd}
                />
            )}

            <SimpleModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                title={
                    modalConfig.type === 'exam' ? 'Sınav Ekle/Düzenle' : 
                    modalConfig.type === 'component' ? 'Alan/Grup Ekle/Düzenle' : 
                    modalConfig.type === 'subComponent' ? 'Oturum/Alt Bileşen Ekle/Düzenle' : 
                    modalConfig.type === 'subject' ? 'Ders Ekle/Düzenle' : 
                    modalConfig.type === 'topic' ? 'Konu Ekle/Düzenle' : 'Alt Konu Ekle/Düzenle'
                }
                onSave={handleSave}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {modalConfig.type === 'exam' && (
                        <>
                            <input placeholder="Sınav Adı (Örn: YKS)" value={formData.ad || ''} onChange={e => setFormData({...formData, ad: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                            <input placeholder="Açıklama" value={formData.aciklama || ''} onChange={e => setFormData({...formData, aciklama: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                            <select value={formData.sinav_tipi || ''} onChange={e => setFormData({...formData, sinav_tipi: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}>
                                <option value="">Sınav Tipi Seçin</option>
                                <option value="YKS">YKS</option>
                                <option value="LGS">LGS</option>
                                <option value="DGS">DGS</option>
                                <option value="KPSS">KPSS</option>
                            </select>
                        </>
                    )}
                    {(modalConfig.type === 'component' || modalConfig.type === 'subComponent') && (
                        <>
                            <input placeholder="Bileşen Adı (Örn: Sayısal, TYT)" value={formData.ad || ''} onChange={e => setFormData({...formData, ad: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                            <select value={formData.tur || ''} onChange={e => setFormData({...formData, tur: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}>
                                <option value="">Tür Seçin</option>
                                <option value="alan">Alan (Sayısal, Sözel vs)</option>
                                <option value="oturum">Oturum (TYT, AYT vs)</option>
                            </select>
                        </>
                    )}
                    {modalConfig.type === 'subject' && (
                        <>
                            <input placeholder="Ders Adı" value={formData.dersAdi || formData.ders_adi || ''} onChange={e => setFormData({...formData, dersAdi: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                            <input type="number" placeholder="Soru Sayısı" value={formData.soruSayisi || formData.soru_sayisi || ''} onChange={e => setFormData({...formData, soruSayisi: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                        </>
                    )}
                    {(modalConfig.type === 'topic' || modalConfig.type === 'subTopic') && (
                        <>
                            <input placeholder={modalConfig.type === 'subTopic' ? "Alt Konu Adı" : "Konu Adı"} value={formData.konuAdi || formData.konu_adi || ''} onChange={e => setFormData({...formData, konuAdi: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                        </>
                    )}
                </div>
            </SimpleModal>
        </div>
    );
};

const UsersTab = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      const data = await fetchApi(`${API_BASE}/php-backend/api/get_teachers.php`);
      if (data.success) {
        setTeachers(data.teachers || []);
      }
    };
    fetchTeachers();
  }, []);

  const handleTeacherSelect = async (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedStudent(null);
    setStudents([]);
    
    const data = await fetchApi(`${API_BASE}/php-backend/api/get_teacher_hierarchy.php?teacherId=${teacher.id}`);
    if (data.success) {
      setStudents(data.students || []);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 100px)' }}>
      {/* Öğretmenler Listesi */}
      <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, color: '#111827' }}>Öğretmenler</h3>
        {teachers.map(teacher => (
          <div
            key={teacher.id}
            onClick={() => handleTeacherSelect(teacher)}
            style={{
              padding: '12px',
              marginBottom: 8,
              borderRadius: 8,
              cursor: 'pointer',
              background: selectedTeacher?.id === teacher.id ? '#6a1b9a10' : '#f9fafb',
              border: selectedTeacher?.id === teacher.id ? '1px solid #6a1b9a' : '1px solid #e5e7eb',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 600, color: '#1f2937' }}>{teacher.firstName} {teacher.lastName}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{teacher.email}</div>
          </div>
        ))}
      </div>

      {/* Seçili Öğretmen Detayı ve Öğrencileri */}
      {selectedTeacher && (
        <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, color: '#111827' }}>Öğretmen Detayı</h3>
          
          <div style={{ marginBottom: 24, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedTeacher.firstName} {selectedTeacher.lastName}</div>
            <div style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>Paket: <span style={{ fontWeight: 600, color: '#6a1b9a' }}>Standart Paket</span></div>
            <div style={{ fontSize: 14, color: '#4b5563', marginTop: 2 }}>Telefon: {selectedTeacher.phone || '-'}</div>
          </div>

          <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Kayıtlı Öğrenciler ({students.length})</h4>
          {students.length > 0 ? (
            students.map(student => (
              <div
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                style={{
                  padding: '10px',
                  marginBottom: 8,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selectedStudent?.id === student.id ? '#6a1b9a10' : '#fff',
                  border: selectedStudent?.id === student.id ? '1px solid #6a1b9a' : '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={faUserGraduate} style={{ fontSize: 14, color: '#6b7280' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{student.firstName} {student.lastName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{student.className} - {student.alan}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>Öğrenci bulunamadı.</div>
          )}
        </div>
      )}

      {/* Seçili Öğrenci ve Veli Detayı */}
      {selectedStudent && (
        <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, color: '#111827' }}>Öğrenci Bilgileri</h3>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <FontAwesomeIcon icon={faUserGraduate} style={{ fontSize: 24, color: '#6b7280' }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{selectedStudent.email}</div>
            
            <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>Sınıf</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{selectedStudent.className}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>Alan</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{selectedStudent.alan}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>Telefon</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{selectedStudent.phone || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>Toplantı</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{selectedStudent.meetingDay} {selectedStudent.meetingDate ? `(${selectedStudent.meetingDate})` : ''}</span>
                </div>
            </div>
          </div>

          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>Veli Bilgileri</h4>
          {selectedStudent.parent ? (
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedStudent.parent.firstName} {selectedStudent.parent.lastName}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{selectedStudent.parent.email}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{selectedStudent.parent.phone}</div>
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Veli bilgisi bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'muhasebe' && <AdminMuhasebeTab />}
        {activeTab === 'exam-management' && <ExamManagementTab />}
        {activeTab === 'ders-detay' && <DersDetayTab />}
        {activeTab === 'course-style' && <CourseStyleTab />}
        {activeTab === 'reports' && <div><h2>Raporlar</h2><p>Bu alan yapım aşamasındadır.</p></div>}
      </main>
    </div>
  );
};

export default AdminDashboard;
