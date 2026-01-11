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
    $sinavId = trim($data->sinavId ?? '');
    $parentId = isset($data->parentId) ? trim($data->parentId) : null;
    if ($parentId === '') { $parentId = null; }
    $ad = trim($data->ad ?? '');
    $tur = isset($data->tur) ? trim($data->tur) : '';
    $sira = (isset($data->sira) && $data->sira !== '') ? intval($data->sira) : 0;
    if ($sinavId === '' || $ad === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'sinavId ve ad gerekli']); exit; }
    if ($parentId !== null) {
        $check = $db->prepare("SELECT sinav_id FROM sinav_bilesenleri WHERE id = ?");
        $check->execute([$parentId]);
        $row = $check->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            // parent bulunamadı, null'a çek
            $parentId = null;
        } else if ($row['sinav_id'] !== $sinavId) {
            // parent farklı sınava ait, null'a çek
            $parentId = null;
        }
    }
    $stmt = $db->prepare("INSERT INTO sinav_bilesenleri (id, sinav_id, parent_id, ad, tur, sira, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $ok = $stmt->execute([$id, $sinavId, $parentId, $ad, $tur, $sira]);
    echo json_encode(['success'=>$ok, 'id'=>$id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
