CREATE TABLE IF NOT EXISTS ogrenci_analizleri (
    id VARCHAR(24) PRIMARY KEY,
    ogrenci_id VARCHAR(24) NOT NULL,
    ogretmen_id VARCHAR(24) NOT NULL,
    hafta_baslangic DATE NOT NULL,
    ogretmen_yorumu TEXT DEFAULT NULL,
    ai_yorumu TEXT DEFAULT NULL,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_ogrenci_ogretmen_hafta (ogrenci_id, ogretmen_id, hafta_baslangic),
    CONSTRAINT fk_analiz_ogrenci FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE,
    CONSTRAINT fk_analiz_ogretmen FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


