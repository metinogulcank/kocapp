<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
$data = json_decode(file_get_contents('php://input'));
try {
    $id = trim($data->id ?? '');
    if ($id === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'id gerekli']); exit; }
    $stmt = $db->prepare("DELETE FROM sinav_konulari WHERE id = ?");
    $ok = $stmt->execute([$id]);
    echo json_encode(['success'=>$ok]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
