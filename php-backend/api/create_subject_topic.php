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
function generateId($len=24){ return bin2hex(random_bytes($len/2)); }
try {
    $id = generateId();
    $dersId = trim($data->dersId ?? '');
    $konuAdi = trim($data->konuAdi ?? '');
    $sira = isset($data->sira) ? intval($data->sira) : null;
    if ($dersId === '' || $konuAdi === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'dersId ve konuAdi gerekli']); exit; }
    $stmt = $db->prepare("INSERT INTO sinav_konulari (id, ders_id, konu_adi, sira, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())");
    $ok = $stmt->execute([$id, $dersId, $konuAdi, $sira]);
    echo json_encode(['success'=>$ok, 'id'=>$id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
