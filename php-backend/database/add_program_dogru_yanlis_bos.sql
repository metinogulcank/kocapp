-- ogrenci_programlari tablosuna dogru, yanlis, bos kolonlarını ekle

ALTER TABLE `ogrenci_programlari`
ADD COLUMN `dogru` INT(11) DEFAULT NULL AFTER `soru_sayisi`,
ADD COLUMN `yanlis` INT(11) DEFAULT NULL AFTER `dogru`,
ADD COLUMN `bos` INT(11) DEFAULT NULL AFTER `yanlis`;

