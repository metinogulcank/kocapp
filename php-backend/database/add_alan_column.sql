-- Öğrenciler tablosuna alan kolonu ekle
ALTER TABLE ogrenciler 
ADD COLUMN alan VARCHAR(50) NULL 
AFTER className;

-- Mevcut kayıtlar için varsayılan değer (opsiyonel)
-- UPDATE ogrenciler SET alan = 'sayisal' WHERE alan IS NULL;

