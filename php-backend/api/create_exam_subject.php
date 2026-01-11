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
    $dersAdi = trim($data->dersAdi ?? '');
    $soru = isset($data->soruSayisi) ? intval($data->soruSayisi) : null;
    $sira = isset($data->sira) ? intval($data->sira) : null;
    $componentId = (isset($data->componentId) && $data->componentId !== '') ? trim($data->componentId) : null;
    
    // sinav_id ve component_id kontrolü
    if (!$sinavId && $componentId) {
        try {
            $compStmt = $db->prepare("SELECT sinav_id FROM sinav_bilesenleri WHERE id = ?");
            $compStmt->execute([$componentId]);
            $foundSinavId = $compStmt->fetchColumn();
            if ($foundSinavId) {
                $sinavId = $foundSinavId;
            }
        } catch (Exception $ce) {
            // Tablo yoksa veya hata oluşursa logla
            error_log("create_exam_subject sinav_id fetch error: " . $ce->getMessage());
        }
    }

    if ($dersAdi === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'dersAdi gerekli']); exit; }
    if (!$sinavId) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'sinavId bulunamadı']); exit; }

    // component_id sütunu var mı kontrol et
    $hasComponentCol = false;
    try {
        $colStmt = $db->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sinav_dersleri' AND COLUMN_NAME = 'component_id'");
        $colStmt->execute();
        $hasComponentCol = ($colStmt->fetchColumn() > 0);
    } catch (Exception $ie) { $hasComponentCol = false; }

    if ($hasComponentCol) {
        $stmt = $db->prepare("INSERT INTO sinav_dersleri (id, sinav_id, component_id, ders_adi, soru_sayisi, sira, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $ok = $stmt->execute([$id, $sinavId, $componentId, $dersAdi, $soru, $sira]);
    } else {
        $stmt = $db->prepare("INSERT INTO sinav_dersleri (id, sinav_id, ders_adi, soru_sayisi, sira, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
        $ok = $stmt->execute([$id, $sinavId, $dersAdi, $soru, $sira]);
    }
    echo json_encode(['success'=>$ok, 'id'=>$id]);
} catch (Exception $e) {
    error_log("create_exam_subject error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
