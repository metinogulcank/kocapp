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
    // 1. Eğer alt konu ise sil
    $stmt = $db->prepare("DELETE FROM sinav_alt_konulari WHERE id = ?");
    $stmt->execute([$id]);
    $deletedSub = $stmt->rowCount();

    // 2. Eğer ana konu ise, önce bağlı alt konuları sil (yeni tablo)
    $stmt = $db->prepare("DELETE FROM sinav_alt_konulari WHERE konu_id = ?");
    $stmt->execute([$id]);

    // 3. Eski yapıdaki alt konuları sil (sinav_konulari tablosunda parent_id olanlar)
    $stmt = $db->prepare("DELETE FROM sinav_konulari WHERE parent_id = ?");
    $stmt->execute([$id]);

    // 4. Ana konuyu sil
    $stmt = $db->prepare("DELETE FROM sinav_konulari WHERE id = ?");
    $stmt->execute([$id]);
    $deletedMain = $stmt->rowCount();

    echo json_encode(['success'=> ($deletedSub > 0 || $deletedMain > 0)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
