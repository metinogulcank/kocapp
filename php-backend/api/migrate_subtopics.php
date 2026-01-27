<?php
require_once '../config/database.php';
$db = (new Database())->getConnection();

try {
    // Önce tabloyu sil (temiz başlangıç)
    $db->exec("DROP TABLE IF EXISTS sinav_alt_konulari");

    // 1. Tabloyu oluştur (Foreign Key olmadan)
    $sql = "CREATE TABLE sinav_alt_konulari (
        id VARCHAR(24) PRIMARY KEY,
        konu_id VARCHAR(24) NOT NULL,
        alt_konu_adi VARCHAR(255) NOT NULL,
        sira INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_konu_id (konu_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "Tablo olusturuldu.\n";

    // 2. Mevcut alt konuları taşı
    $stmt = $db->prepare("SELECT * FROM sinav_konulari WHERE parent_id IS NOT NULL AND parent_id != '' AND parent_id != '0'");
    $stmt->execute();
    $subtopics = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Tasinalacak alt konu sayisi: " . count($subtopics) . "\n";

    $insertStmt = $db->prepare("INSERT INTO sinav_alt_konulari (id, konu_id, alt_konu_adi, sira, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
    $deleteStmt = $db->prepare("DELETE FROM sinav_konulari WHERE id = ?");

    $db->beginTransaction();
    foreach ($subtopics as $topic) {
        $insertStmt->execute([
            $topic['id'],
            $topic['parent_id'],
            $topic['konu_adi'],
            $topic['sira'],
            $topic['createdAt'],
            $topic['updatedAt']
        ]);
        $deleteStmt->execute([$topic['id']]);
    }
    $db->commit();
    echo "Tasima islemi basariyla tamamlandi.\n";

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo "Hata: " . $e->getMessage() . "\n";
}
?>