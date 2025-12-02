-- Foreign Key'leri eklemeden önce tabloların yapısını kontrol edin
-- Eğer tablolar farklı engine'lerde ise (MyISAM vs InnoDB), önce engine'i değiştirin

-- 1. Önce tabloların engine'ini InnoDB yapın (eğer değilse)
-- ALTER TABLE ogrenciler ENGINE=InnoDB;
-- ALTER TABLE users ENGINE=InnoDB;
-- ALTER TABLE ogrenci_programlari ENGINE=InnoDB;
-- ALTER TABLE program_sablonlari ENGINE=InnoDB;
-- ALTER TABLE sablon_program_detaylari ENGINE=InnoDB;

-- 2. Karakter seti ve collation'ı kontrol edin ve eşleştirin
-- Eğer farklıysa, önce eşleştirin:
-- ALTER TABLE ogrenci_programlari CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE ogrenci_programlari MODIFY ogrenci_id VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE ogrenci_programlari MODIFY ogretmen_id VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Foreign key'leri ekleyin (sadece InnoDB engine'de çalışır)
-- Önce mevcut foreign key'leri kontrol edin:
-- SELECT * FROM information_schema.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = 'vanotoc1_kocapp' 
-- AND TABLE_NAME = 'ogrenci_programlari' 
-- AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Eğer foreign key yoksa, ekleyin:
ALTER TABLE ogrenci_programlari 
ADD CONSTRAINT fk_ogrenci_program_ogrenci 
FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE;

ALTER TABLE ogrenci_programlari 
ADD CONSTRAINT fk_ogrenci_program_ogretmen 
FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE;

ALTER TABLE program_sablonlari 
ADD CONSTRAINT fk_sablon_ogretmen 
FOREIGN KEY (ogretmen_id) REFERENCES users(_id) ON DELETE CASCADE;

ALTER TABLE sablon_program_detaylari 
ADD CONSTRAINT fk_sablon_detay_sablon 
FOREIGN KEY (sablon_id) REFERENCES program_sablonlari(id) ON DELETE CASCADE;

