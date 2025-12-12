CREATE TABLE IF NOT EXISTS brans_denemeleri (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(24) NOT NULL,
    alan VARCHAR(50) NOT NULL,
    ders VARCHAR(255) NOT NULL,
    deneme_adi VARCHAR(255) NOT NULL,
    deneme_tarihi DATE NOT NULL,
    soru_sayisi INT DEFAULT 0,
    dogru INT DEFAULT 0,
    yanlis INT DEFAULT 0,
    bos INT DEFAULT 0,
    net DECIMAL(6,2) DEFAULT 0,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_ders (student_id, ders),
    CONSTRAINT fk_brans_denemeleri_student FOREIGN KEY (student_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brans_deneme_konulari (
    id VARCHAR(36) PRIMARY KEY,
    deneme_id VARCHAR(36) NOT NULL,
    konu VARCHAR(255) NOT NULL,
    dogru INT DEFAULT 0,
    yanlis INT DEFAULT 0,
    bos INT DEFAULT 0,
    basari_yuzde DECIMAL(6,2) DEFAULT 0,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_brans_deneme_konulari_deneme FOREIGN KEY (deneme_id) REFERENCES brans_denemeleri(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS brans_denemeleri (
    id VARCHAR(24) PRIMARY KEY,
    student_id VARCHAR(24) NOT NULL,
    alan VARCHAR(50) DEFAULT NULL,
    ders VARCHAR(255) NOT NULL,
    deneme_adi VARCHAR(255) NOT NULL,
    deneme_tarihi DATE NOT NULL,
    soru_sayisi INT DEFAULT 0,
    dogru INT DEFAULT 0,
    yanlis INT DEFAULT 0,
    bos INT DEFAULT 0,
    net DECIMAL(5,2) DEFAULT 0,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bran_student (student_id),
    INDEX idx_bran_ders (ders),
    INDEX idx_bran_tarih (deneme_tarihi),
    CONSTRAINT fk_bran_student FOREIGN KEY (student_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brans_deneme_konu_sonuclari (
    id VARCHAR(24) PRIMARY KEY,
    brans_deneme_id VARCHAR(24) NOT NULL,
    konu VARCHAR(255) NOT NULL,
    sira INT DEFAULT 0,
    dogru INT DEFAULT 0,
    yanlis INT DEFAULT 0,
    bos INT DEFAULT 0,
    yuzde DECIMAL(5,2) DEFAULT 0,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bran_konu_deneme (brans_deneme_id),
    CONSTRAINT fk_bran_deneme FOREIGN KEY (brans_deneme_id) REFERENCES brans_denemeleri(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

