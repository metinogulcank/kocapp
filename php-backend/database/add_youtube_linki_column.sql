-- Öğrenci Programları tablosuna youtube_linki kolonu ekle
ALTER TABLE ogrenci_programlari 
ADD COLUMN youtube_linki VARCHAR(500) DEFAULT NULL 
AFTER aciklama;

