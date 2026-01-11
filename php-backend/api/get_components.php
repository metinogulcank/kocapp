<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
$sinavId = isset($_GET['sinavId']) ? $_GET['sinavId'] : '';
if ($sinavId === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'sinavId gerekli']); exit; }
try {
    $stmt = $db->prepare("SELECT id, sinav_id, parent_id, ad, tur, sira, createdAt, updatedAt FROM sinav_bilesenleri WHERE sinav_id = ? ORDER BY COALESCE(sira, 999999), ad ASC");
    $stmt->execute([$sinavId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true,'components'=>$rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
