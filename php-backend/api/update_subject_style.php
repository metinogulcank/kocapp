<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Geçersiz veri']);
    exit;
}
$dersId = isset($data['ders_id']) ? $data['ders_id'] : '';
$color = isset($data['color']) ? $data['color'] : '';
$iconUrl = isset($data['icon_url']) ? $data['icon_url'] : '';
if ($dersId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ders_id gerekli']);
    exit;
}
require_once '../config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE sinav_dersleri SET color = ?, icon_url = ?, updatedAt = NOW() WHERE id = ?");
$ok = $stmt->execute([$color, $iconUrl, $dersId]);
if ($ok) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Güncellenemedi']);
}
?>
