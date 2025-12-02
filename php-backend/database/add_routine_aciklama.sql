-- Rutin görevler tablosuna aciklama alanı ekle
ALTER TABLE ogrenci_rutinleri
ADD COLUMN aciklama TEXT DEFAULT NULL AFTER kaynak;

-- Şablon rutin detayları tablosuna aciklama alanı ekle
ALTER TABLE sablon_rutin_detaylari
ADD COLUMN aciklama TEXT DEFAULT NULL AFTER kaynak;

