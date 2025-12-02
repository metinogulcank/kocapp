-- Rutin durumlarını tarih bazında tutmak için tablo
CREATE TABLE IF NOT EXISTS ogrenci_rutin_durumlari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    routine_id VARCHAR(24) NOT NULL,
    ogrenci_id VARCHAR(24) NOT NULL,
    tarih DATE NOT NULL,
    durum ENUM('yapilmadi', 'eksik_yapildi', 'yapildi') NOT NULL DEFAULT 'yapilmadi',
    UNIQUE KEY uniq_routine_date (routine_id, tarih),
    INDEX idx_routine_status_ogrenci (ogrenci_id),
    CONSTRAINT fk_rutin_durum_rutin FOREIGN KEY (routine_id) REFERENCES ogrenci_rutinleri(id) ON DELETE CASCADE,
    CONSTRAINT fk_rutin_durum_ogrenci FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Belirli bir tarihte gösterilmeyecek rutin örneklerini işaretlemek için tablo
CREATE TABLE IF NOT EXISTS ogrenci_rutin_skipleri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    routine_id VARCHAR(24) NOT NULL,
    ogrenci_id VARCHAR(24) NOT NULL,
    tarih DATE NOT NULL,
    UNIQUE KEY uniq_routine_skip (routine_id, tarih),
    INDEX idx_routine_skip_ogrenci (ogrenci_id),
    CONSTRAINT fk_rutin_skip_rutin FOREIGN KEY (routine_id) REFERENCES ogrenci_rutinleri(id) ON DELETE CASCADE,
    CONSTRAINT fk_rutin_skip_ogrenci FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

