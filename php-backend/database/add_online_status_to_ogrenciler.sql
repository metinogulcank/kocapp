-- ogrenciler tablosuna online durumu ve sınav tarihi ekle
-- Önce kolonların var olup olmadığını kontrol et (manuel kontrol gerekebilir)

-- online_status kolonu ekle (eğer yoksa)
ALTER TABLE ogrenciler 
ADD COLUMN online_status TINYINT(1) DEFAULT 0 AFTER meetingDate;

-- son_giris_tarihi kolonu ekle (eğer yoksa)
ALTER TABLE ogrenciler 
ADD COLUMN son_giris_tarihi DATETIME DEFAULT NULL AFTER online_status;

-- sinav_tarihi kolonu ekle (eğer yoksa)
ALTER TABLE ogrenciler 
ADD COLUMN sinav_tarihi DATE DEFAULT NULL AFTER son_giris_tarihi;

-- İndeks ekle (opsiyonel, performans için)
ALTER TABLE ogrenciler 
ADD INDEX idx_online_status (online_status);

ALTER TABLE ogrenciler 
ADD INDEX idx_son_giris (son_giris_tarihi);

