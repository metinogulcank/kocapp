<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
$dersId = isset($_GET['ders_id']) ? trim($_GET['ders_id']) : '';
$konuId = isset($_GET['konu_id']) ? trim($_GET['konu_id']) : '';
try {
    // Tablo yoksa oluştur
    $db->exec("CREATE TABLE IF NOT EXISTS ders_kaynaklari (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ders_id VARCHAR(24) NOT NULL,
        kaynak_adi VARCHAR(255) NOT NULL,
        kaynak_tipi VARCHAR(32) DEFAULT 'kitap',
        kaynak_url VARCHAR(1024) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ders_id (ders_id)
    )");

    // konu_id geldiyse ders_id'ye çevir
    if ($konuId && !$dersId) {
        $map = $db->prepare("SELECT ders_id FROM sinav_konulari WHERE id = ? LIMIT 1");
        $map->execute([$konuId]);
        $dersId = $map->fetchColumn() ?: '';
    }
    if ($dersId === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ders_id gerekli']); exit; }

    $stmt = $db->prepare("SELECT id, ders_id, kaynak_adi, kaynak_tipi, kaynak_url, created_at FROM ders_kaynaklari WHERE ders_id = ? ORDER BY created_at DESC, id DESC");
    $stmt->execute([$dersId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    echo json_encode(['success'=>true,'resources'=>$rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
