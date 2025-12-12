CREATE TABLE IF NOT EXISTS genel_deneme_ders_konu_sonuclari (
    id VARCHAR(24) PRIMARY KEY,
    genel_deneme_ders_id VARCHAR(24) NOT NULL,
    konu VARCHAR(255) NOT NULL,
    sira INT DEFAULT 0,
    dogru INT DEFAULT 0,
    yanlis INT DEFAULT 0,
    bos INT DEFAULT 0,
    yuzde DECIMAL(5,2) DEFAULT 0,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_genel_konu_ders (genel_deneme_ders_id),
    CONSTRAINT fk_genel_konu_ders FOREIGN KEY (genel_deneme_ders_id) REFERENCES genel_deneme_ders_sonuclari(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

