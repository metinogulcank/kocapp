-- Öğrenci programları tablosuna yeni kolonlar ekle
ALTER TABLE ogrenci_programlari 
ADD COLUMN kaynak VARCHAR(255) NULL AFTER konu,
ADD COLUMN aciklama TEXT NULL AFTER kaynak,
ADD COLUMN durum ENUM('yapilmadi', 'eksik_yapildi', 'yapildi') DEFAULT 'yapilmadi' AFTER aciklama;

