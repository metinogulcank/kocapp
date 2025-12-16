import React, { useState } from 'react';
import './Kaynaklar.css';

const Kaynaklar = ({ isStudent = false }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [filteredResources, setFilteredResources] = useState([]);

  // Örnek veriler
  const classes = [
    { value: '', label: 'Sınıf seçiniz' },
    { value: '9', label: '9. Sınıf' },
    { value: '10', label: '10. Sınıf' },
    { value: '11', label: '11. Sınıf' },
    { value: '12', label: '12. Sınıf' }
  ];

  const subjects = [
    { value: '', label: 'Ders seçiniz' },
    { value: 'matematik', label: 'Matematik' },
    { value: 'fizik', label: 'Fizik' },
    { value: 'kimya', label: 'Kimya' },
    { value: 'biyoloji', label: 'Biyoloji' },
    { value: 'turkce', label: 'Türkçe' },
    { value: 'tarih', label: 'Tarih' },
    { value: 'cografya', label: 'Coğrafya' }
  ];

  const levels = [
    { value: '', label: 'Kitap seviyesi seçiniz' },
    { value: 'temel', label: 'Temel Seviye' },
    { value: 'orta', label: 'Orta Seviye' },
    { value: 'ileri', label: 'İleri Seviye' },
    { value: 'yks', label: 'YKS Hazırlık' }
  ];

  // Örnek kaynak verileri
  const allResources = [
    {
      id: 1,
      title: 'Matematik Temel Kavramlar',
      author: 'Ahmet Yılmaz',
      publisher: 'Eğitim Yayınları',
      class: '9',
      subject: 'matematik',
      level: 'temel',
      image: '/api/placeholder/200/250',
      description: '9. sınıf matematik temel kavramları için kapsamlı kaynak kitap.',
      price: '45.00',
      isbn: '978-605-123-456-7'
    },
    {
      id: 2,
      title: 'Fizik Problem Çözme Teknikleri',
      author: 'Mehmet Kaya',
      publisher: 'Bilim Yayınları',
      class: '10',
      subject: 'fizik',
      level: 'orta',
      image: '/api/placeholder/200/250',
      description: '10. sınıf fizik problemlerini çözme teknikleri ve örnekler.',
      price: '52.00',
      isbn: '978-605-234-567-8'
    },
    {
      id: 3,
      title: 'YKS Matematik Soru Bankası',
      author: 'Ayşe Demir',
      publisher: 'Sınav Yayınları',
      class: '12',
      subject: 'matematik',
      level: 'yks',
      image: '/api/placeholder/200/250',
      description: 'YKS matematik için kapsamlı soru bankası ve çözümler.',
      price: '68.00',
      isbn: '978-605-345-678-9'
    },
    {
      id: 4,
      title: 'Kimya Laboratuvar Rehberi',
      author: 'Fatma Özkan',
      publisher: 'Kimya Yayınları',
      class: '11',
      subject: 'kimya',
      level: 'orta',
      image: '/api/placeholder/200/250',
      description: '11. sınıf kimya laboratuvar deneyleri ve açıklamaları.',
      price: '38.00',
      isbn: '978-605-456-789-0'
    },
    {
      id: 5,
      title: 'Biyoloji Konu Anlatımı',
      author: 'Ali Veli',
      publisher: 'Doğa Yayınları',
      class: '9',
      subject: 'biyoloji',
      level: 'temel',
      image: '/api/placeholder/200/250',
      description: '9. sınıf biyoloji konularının detaylı anlatımı.',
      price: '42.00',
      isbn: '978-605-567-890-1'
    },
    {
      id: 6,
      title: 'Türkçe Dil Bilgisi',
      author: 'Zeynep Ak',
      publisher: 'Dil Yayınları',
      class: '10',
      subject: 'turkce',
      level: 'orta',
      image: '/api/placeholder/200/250',
      description: '10. sınıf Türkçe dil bilgisi kuralları ve örnekler.',
      price: '35.00',
      isbn: '978-605-678-901-2'
    }
  ];

  const handleFilter = () => {
    let filtered = allResources;

    if (selectedClass) {
      filtered = filtered.filter(resource => resource.class === selectedClass);
    }

    if (selectedSubject) {
      filtered = filtered.filter(resource => resource.subject === selectedSubject);
    }

    if (selectedLevel) {
      filtered = filtered.filter(resource => resource.level === selectedLevel);
    }

    setFilteredResources(filtered);
  };

  const handleResourceClick = (resource) => {
    // Kaynak detayını göster
    alert(`Kaynak Detayı:\n\nBaşlık: ${resource.title}\nYazar: ${resource.author}\nYayınevi: ${resource.publisher}\nFiyat: ₺${resource.price}\nISBN: ${resource.isbn}\n\nAçıklama: ${resource.description}`);
  };

  // Filtre yoksa tüm kaynakları göster
  const hasAnyFilter = selectedClass || selectedSubject || selectedLevel;
  const displayResources = hasAnyFilter ? filteredResources : allResources;

  return (
    <div className="kaynaklar-container">
      {/* Title - Bildirimlerdeki başlık stili */}
      <h1 className="page-title">Kaynaklar</h1>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-dropdowns">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="filter-select"
          >
            {classes.map(classItem => (
              <option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="filter-select"
          >
            {subjects.map(subject => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="filter-select"
          >
            {levels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <button className="filter-button" onClick={handleFilter}>
          FİLTRELE VE GÖSTER
        </button>
      </div>

      {/* Resources Grid */}
      <div className="resources-content">
        {displayResources.length > 0 ? (
          <div className="resources-grid">
            {displayResources.map(resource => (
              <div 
                key={resource.id} 
                className="resource-card"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="resource-image">
                  <img src={resource.image} alt={resource.title} />
                </div>
                <div className="resource-info">
                  <h3 className="resource-title">{resource.title}</h3>
                  <p className="resource-author">Yazar: {resource.author}</p>
                  <p className="resource-publisher">Yayınevi: {resource.publisher}</p>
                  <div className="resource-meta">
                    <span className="resource-class">{resource.class}. Sınıf</span>
                    <span className="resource-level">{levels.find(l => l.value === resource.level)?.label}</span>
                  </div>
                  <div className="resource-price">₺{resource.price}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Henüz kaynak bulunmuyor</h3>
            <p>Filtreleme seçeneklerini kullanarak kaynakları görüntüleyin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kaynaklar;
