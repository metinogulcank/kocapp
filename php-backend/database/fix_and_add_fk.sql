-- Adım 1: Tabloların engine'ini InnoDB yapın (eğer değilse)
-- Bu komutları tek tek çalıştırın ve hata alırsanız o tabloyu atlayın

ALTER TABLE ogrenciler ENGINE=InnoDB;
ALTER TABLE users ENGINE=InnoDB;

-- Adım 2: ogrenci_programlari tablosunu oluşturun (eğer yoksa)
-- Eğer tablo zaten varsa, bu adımı atlayın
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
    INDEX idx_ogrenci (ogrenci_id),
    INDEX idx_routine (routine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adım 3: Sütunların karakter setini ve collation'ını kontrol edin ve eşleştirin
ALTER TABLE ogrenci_programlari 
MODIFY ogrenci_id VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE ogrenci_programlari 
MODIFY ogretmen_id VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Adım 4: Referans edilen sütunların karakter setini kontrol edin
-- Eğer farklıysa, önce onları düzeltin:
-- ALTER TABLE ogrenciler MODIFY id VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE users MODIFY _id VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Adım 5: Foreign key'leri ekleyin
-- Önce mevcut foreign key'leri silin (eğer varsa)
ALTER TABLE ogrenci_programlari DROP FOREIGN KEY IF EXISTS fk_ogrenci_program_ogrenci;
ALTER TABLE ogrenci_programlari DROP FOREIGN KEY IF EXISTS fk_ogrenci_program_ogretmen;

-- Sonra yeni foreign key'leri ekleyin
ALTER TABLE ogrenci_programlari 
ADD CONSTRAINT fk_ogrenci_program_ogrenci 
FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE;

ALTER TABLE ogrenci_programlari 
ADD CONSTRAINT fk_ogrenci_program_ogretmen 
FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE;

