<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
$studentId = isset($_GET['studentId']) ? trim($_GET['studentId']) : '';
$dersId = isset($_GET['dersId']) ? trim($_GET['dersId']) : '';
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student (student_id),
        INDEX idx_ders (ders_id),
        INDEX idx_teacher (teacher_id)
    )");
    if ($studentId === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'studentId gerekli']); exit; }
    $params = [$studentId];
    $sql = "SELECT id, student_id, teacher_id, ders_id, kaynak_adi, kaynak_tipi, kaynak_url, seviye, created_at FROM ogrenci_kaynak_onerileri WHERE student_id = ?";
    if ($dersId !== '') { $sql .= " AND ders_id = ?"; $params[] = $dersId; }
    $sql .= " ORDER BY created_at DESC, id DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    echo json_encode(['success'=>true,'recommendations'=>$rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
