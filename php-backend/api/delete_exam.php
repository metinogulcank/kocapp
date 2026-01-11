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
    $db->beginTransaction();
    $stmt1 = $db->prepare("DELETE FROM sinav_konulari WHERE ders_id IN (SELECT id FROM sinav_dersleri WHERE sinav_id = ?)");
    $stmt1->execute([$id]);
    $stmt2 = $db->prepare("DELETE FROM sinav_dersleri WHERE sinav_id = ?");
    $stmt2->execute([$id]);
    $stmt3 = $db->prepare("DELETE FROM sinavlar WHERE id = ?");
    $ok = $stmt3->execute([$id]);
    $db->commit();
    echo json_encode(['success'=>$ok]);
} catch (Exception $e) {
    if ($db->inTransaction()) { $db->rollBack(); }
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
