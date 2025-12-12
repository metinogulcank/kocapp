-- Kaynak ve Konu İlerlemesi Tabloları

-- Konu İlerlemesi Tablosu
CREATE TABLE IF NOT EXISTS `ogrenci_konu_ilerlemesi` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `student_id` VARCHAR(50) NOT NULL,
  `ders` VARCHAR(100) NOT NULL,
  `konu` VARCHAR(255) NOT NULL,
  `sira` INT(11) NOT NULL DEFAULT 1,
  `durum` VARCHAR(50) NOT NULL DEFAULT 'Konuya Gelinmedi',
  `tarih` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_student_ders` (`student_id`, `ders`),
  INDEX `idx_student_ders_sira` (`student_id`, `ders`, `sira`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Konu Kaynakları Tablosu
CREATE TABLE IF NOT EXISTS `ogrenci_konu_kaynaklari` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `konu_ilerleme_id` INT(11) NOT NULL,
  `kaynak_adi` VARCHAR(255) NOT NULL,
  `tamamlandi` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_konu_ilerleme` (`konu_ilerleme_id`),
  CONSTRAINT `fk_konu_kaynak_ilerleme` 
    FOREIGN KEY (`konu_ilerleme_id`) 
    REFERENCES `ogrenci_konu_ilerlemesi` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

