<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = ['id' => $_POST['id'] ?? null]; }
$id = isset($data['id']) ? intval($data['id']) : 0;
try {
    $db->exec("CREATE TABLE IF NOT EXISTS ogrenci_kaynak_onerileri (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(24) NOT NULL,
        teacher_id VARCHAR(24) NOT NULL,
        ders_id VARCHAR(24) NOT NULL,
        kaynak_adi VARCHAR(255) NOT NULL,
        kaynak_tipi VARCHAR(32) DEFAULT 'kitap',
        kaynak_url VARCHAR(1024) DEFAULT '',
        seviye VARCHAR(16) DEFAULT 'orta',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'id gerekli']); exit; }
    $stmt = $db->prepare("DELETE FROM ogrenci_kaynak_onerileri WHERE id = ?");
    $ok = $stmt->execute([$id]);
    if ($ok) { echo json_encode(['success'=>true]); }
    else { http_response_code(503); echo json_encode(['success'=>false,'message'=>'Silinemedi']); }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
