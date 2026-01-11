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
    $fields = []; $params = [];
    foreach (['ad'=>'ad','tur'=>'tur','sira'=>'sira','parentId'=>'parent_id'] as $k=>$col) {
        if (isset($data->$k)) { $fields[] = "$col = ?"; $params[] = $data->$k; }
    }
    if (!$fields) { echo json_encode(['success'=>true]); exit; }
    $sql = "UPDATE sinav_bilesenleri SET ".implode(', ',$fields).", updatedAt = NOW() WHERE id = ?";
    $params[] = $id;
    $stmt = $db->prepare($sql);
    $ok = $stmt->execute($params);
    echo json_encode(['success'=>$ok]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
