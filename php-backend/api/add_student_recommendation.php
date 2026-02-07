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
if (!is_array($data)) {
    $data = [
        'studentId' => $_POST['studentId'] ?? null,
        'teacherId' => $_POST['teacherId'] ?? null,
        'dersId' => $_POST['dersId'] ?? null,
        'kaynakAdi' => $_POST['kaynakAdi'] ?? null,
        'kaynakTipi' => $_POST['kaynakTipi'] ?? 'kitap',
        'kaynakUrl' => $_POST['kaynakUrl'] ?? '',
        'seviye' => $_POST['seviye'] ?? 'orta'
    ];
}
$studentId = isset($data['studentId']) ? trim($data['studentId']) : '';
$teacherId = isset($data['teacherId']) ? trim($data['teacherId']) : '';
$dersId = isset($data['dersId']) ? trim($data['dersId']) : '';
$kaynakAdi = isset($data['kaynakAdi']) ? trim($data['kaynakAdi']) : '';
$kaynakTipi = isset($data['kaynakTipi']) ? trim($data['kaynakTipi']) : 'kitap';
$kaynakUrl = isset($data['kaynakUrl']) ? trim($data['kaynakUrl']) : '';
$seviye = isset($data['seviye']) ? trim($data['seviye']) : 'orta';
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
    if ($studentId === '' || $teacherId === '' || $dersId === '' || $kaynakAdi === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Veri eksik']); exit; }
    $stmt = $db->prepare("INSERT INTO ogrenci_kaynak_onerileri (student_id, teacher_id, ders_id, kaynak_adi, kaynak_tipi, kaynak_url, seviye) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $ok = $stmt->execute([$studentId, $teacherId, $dersId, $kaynakAdi, $kaynakTipi, $kaynakUrl, $seviye]);
    if ($ok) {
        echo json_encode(['success'=>true, 'id'=>intval($db->lastInsertId())]);
    } else {
        http_response_code(503);
        echo json_encode(['success'=>false,'message'=>'Kaynak önerisi eklenemedi']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
