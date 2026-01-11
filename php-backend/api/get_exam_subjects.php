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
$componentId = isset($_GET['componentId']) ? $_GET['componentId'] : '';

if ($sinavId === '' && $componentId === '') { 
    http_response_code(400); 
    echo json_encode(['success'=>false,'message'=>'sinavId veya componentId gerekli']); 
    exit; 
}

try {
    if ($componentId !== '') {
        $stmt = $db->prepare("SELECT id, sinav_id, component_id, ders_adi, soru_sayisi, sira, icon_url, color, createdAt, updatedAt FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
        $stmt->execute([$componentId]);
    } else {
        // Eğer componentId yoksa, sadece o sınavın genel (bir bileşene bağlı olmayan) derslerini getir
        // Veya tüm dersleri getirmek istiyorsanız WHERE sinav_id = ? yeterli.
        // Hiyerarşik yapıda genellikle üst seviyede sadece genel dersler istenir.
        $stmt = $db->prepare("SELECT id, sinav_id, component_id, ders_adi, soru_sayisi, sira, icon_url, color, createdAt, updatedAt FROM sinav_dersleri WHERE sinav_id = ? AND (component_id IS NULL OR component_id = '') ORDER BY sira ASC, ders_adi ASC");
        $stmt->execute([$sinavId]);
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true,'subjects'=>$rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
