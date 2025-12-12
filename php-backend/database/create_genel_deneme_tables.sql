CREATE TABLE IF NOT EXISTS genel_denemeler (
    id VARCHAR(24) PRIMARY KEY,
    student_id VARCHAR(24) NOT NULL,
    deneme_adi VARCHAR(255) NOT NULL,
    deneme_tarihi DATE NOT NULL,
    notlar TEXT DEFAULT NULL,
    sinav_tipi VARCHAR(10) DEFAULT 'tyt',
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_genel_student (student_id),
    INDEX idx_genel_tarih (deneme_tarihi),
    INDEX idx_genel_sinav_tipi (sinav_tipi),
    CONSTRAINT fk_genel_student FOREIGN KEY (student_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS genel_deneme_ders_sonuclari (
    id VARCHAR(24) PRIMARY KEY,
    genel_deneme_id VARCHAR(24) NOT NULL,
    ders VARCHAR(255) NOT NULL,
    soru_sayisi INT DEFAULT 0,
    dogru INT DEFAULT 0,
    yanlis INT DEFAULT 0,
    bos INT DEFAULT 0,
    net DECIMAL(6,2) DEFAULT 0,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_genel_ders_deneme (genel_deneme_id),
    CONSTRAINT fk_genel_ders_deneme FOREIGN KEY (genel_deneme_id) REFERENCES genel_denemeler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS genel_deneme_degerlendirme (
    id VARCHAR(24) PRIMARY KEY,
    genel_deneme_id VARCHAR(24) NOT NULL,
    zaman_yeterli INT DEFAULT NULL,
    odaklanma INT DEFAULT NULL,
    kaygi_duzeyi INT DEFAULT NULL,
    en_zorlayan_ders VARCHAR(255) DEFAULT NULL,
    kendini_hissediyorsun INT DEFAULT NULL,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_genel_degerlendirme_deneme (genel_deneme_id),
    CONSTRAINT fk_genel_degerlendirme_deneme FOREIGN KEY (genel_deneme_id) REFERENCES genel_denemeler(id) ON DELETE CASCADE,
    UNIQUE KEY unique_genel_degerlendirme (genel_deneme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

