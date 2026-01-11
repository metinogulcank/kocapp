-- Mevcut genel_denemeler tablosuna sinav_tipi kolonu ekle
ALTER TABLE genel_denemeler 
ADD COLUMN sinav_tipi CHAR(24) DEFAULT 'tyt' AFTER notlar;

-- İndeks ekle (opsiyonel, performans için)
ALTER TABLE genel_denemeler 
ADD INDEX idx_genel_sinav_tipi (sinav_tipi);

