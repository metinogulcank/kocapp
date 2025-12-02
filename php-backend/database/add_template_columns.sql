-- Şablon program detayları tablosuna kaynak ve aciklama alanlarını ekle
ALTER TABLE sablon_program_detaylari
ADD COLUMN kaynak VARCHAR(255) DEFAULT NULL AFTER konu,
ADD COLUMN aciklama TEXT DEFAULT NULL AFTER kaynak;

-- Şablon rutin detayları tablosu (rutin görevler için)
CREATE TABLE IF NOT EXISTS sablon_rutin_detaylari (
    id VARCHAR(24) PRIMARY KEY,
    sablon_id VARCHAR(24) NOT NULL,
    gunler TEXT NOT NULL COMMENT 'JSON encoded array of week day numbers (1=Monday, 7=Sunday)',
    baslangic_saati TIME NOT NULL,
    program_tipi ENUM('soru_cozum', 'konu_anlatim', 'deneme') NOT NULL,
    ders VARCHAR(100) NOT NULL,
    konu VARCHAR(255) DEFAULT NULL,
    kaynak VARCHAR(255) DEFAULT NULL,
    soru_sayisi INT DEFAULT NULL,
    INDEX idx_sablon (sablon_id),
    CONSTRAINT fk_sablon_rutin_sablon FOREIGN KEY (sablon_id) 
        REFERENCES program_sablonlari(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

