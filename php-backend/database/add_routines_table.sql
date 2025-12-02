-- Öğrenci rutin görevleri tablosu
CREATE TABLE IF NOT EXISTS ogrenci_rutinleri (
    id VARCHAR(24) PRIMARY KEY,
    ogrenci_id VARCHAR(24) NOT NULL,
    ogretmen_id VARCHAR(24) NOT NULL,
    gunler TEXT NOT NULL COMMENT 'JSON encoded array of week day numbers (1=Monday, 7=Sunday)',
    baslangic_saati TIME NOT NULL,
    program_tipi ENUM('soru_cozum', 'konu_anlatim', 'deneme') NOT NULL,
    ders VARCHAR(100) NOT NULL,
    konu VARCHAR(255) DEFAULT NULL,
    kaynak VARCHAR(255) DEFAULT NULL,
    soru_sayisi INT DEFAULT NULL,
    aktif TINYINT(1) DEFAULT 1,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ogrenci (ogrenci_id),
    INDEX idx_ogretmen (ogretmen_id),
    CONSTRAINT fk_rutin_ogrenci FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE,
    CONSTRAINT fk_rutin_ogretmen FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Öğrenci programları tablosuna rutin referansı ekle
ALTER TABLE ogrenci_programlari
ADD COLUMN routine_id VARCHAR(24) NULL AFTER ogretmen_id,
ADD INDEX idx_routine_id (routine_id);


