<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once '../config/database.php';
$db = (new Database())->getConnection();
$dersId = isset($_GET['dersId']) ? $_GET['dersId'] : '';
if ($dersId === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'dersId gerekli']); exit; }
try {
    $stmt = $db->prepare("SELECT id, ders_id, konu_adi, sira, createdAt, updatedAt FROM sinav_konulari WHERE ders_id = ? ORDER BY sira ASC, konu_adi ASC");
    $stmt->execute([$dersId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true,'topics'=>$rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
