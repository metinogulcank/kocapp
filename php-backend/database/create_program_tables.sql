-- Öğrenci Programları Tablosu
CREATE TABLE IF NOT EXISTS ogrenci_programlari (
    id VARCHAR(24) PRIMARY KEY,
    ogrenci_id VARCHAR(24) NOT NULL,
    ogretmen_id VARCHAR(24) NOT NULL,
    routine_id VARCHAR(24) DEFAULT NULL,
    tarih DATE NOT NULL,
    baslangic_saati TIME NOT NULL,
    bitis_saati TIME NOT NULL,
    program_tipi ENUM('soru_cozum', 'konu_anlatim', 'deneme') NOT NULL,
    ders VARCHAR(100) NOT NULL,
    konu VARCHAR(255) DEFAULT NULL,
    soru_sayisi INT DEFAULT NULL,
    kaynak VARCHAR(255) DEFAULT NULL,
    aciklama TEXT DEFAULT NULL,
    durum ENUM('yapilmadi', 'eksik_yapildi', 'yapildi') DEFAULT 'yapilmadi',
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ogrenci_tarih (ogrenci_id, tarih),
    INDEX idx_ogretmen (ogretmen_id),
    INDEX idx_routine (routine_id),
    CONSTRAINT fk_ogrenci_program_ogrenci FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE,
    CONSTRAINT fk_ogrenci_program_ogretmen FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Program Şablonları Tablosu
CREATE TABLE IF NOT EXISTS program_sablonlari (
    id VARCHAR(24) PRIMARY KEY,
    ogretmen_id VARCHAR(24) NOT NULL,
    sablon_adi VARCHAR(255) NOT NULL,
    aciklama TEXT DEFAULT NULL,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ogretmen (ogretmen_id),
    CONSTRAINT fk_sablon_ogretmen FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Şablon Program Detayları Tablosu
CREATE TABLE IF NOT EXISTS sablon_program_detaylari (
    id VARCHAR(24) PRIMARY KEY,
    sablon_id VARCHAR(24) NOT NULL,
    gun_no INT NOT NULL COMMENT 'Haftanın günü (1=Pazartesi, 7=Pazar)',
    baslangic_saati TIME NOT NULL,
    bitis_saati TIME NOT NULL,
    program_tipi ENUM('soru_cozum', 'konu_anlatim', 'deneme') NOT NULL,
    ders VARCHAR(100) NOT NULL,
    konu VARCHAR(255) DEFAULT NULL,
    soru_sayisi INT DEFAULT NULL,
    INDEX idx_sablon (sablon_id),
    CONSTRAINT fk_sablon_detay_sablon FOREIGN KEY (sablon_id) REFERENCES program_sablonlari(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

