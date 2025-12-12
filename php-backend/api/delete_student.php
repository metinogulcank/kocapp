<?php
ob_clean();

header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Preflight OPTIONS request'i handle et
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents('php://input'));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Öğrenci ID gerekli!']);
    exit;
}

$studentId = $data->id;

// Öğrencinin var olup olmadığını kontrol et
$checkStmt = $db->prepare("SELECT id, teacherId FROM ogrenciler WHERE id = ? LIMIT 1");
$checkStmt->execute([$studentId]);
$existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$existing) {
    http_response_code(404);
    echo json_encode(['message' => 'Öğrenci bulunamadı!']);
    exit;
}

// Öğretmen kontrolü (opsiyonel - güvenlik için)
if (!empty($data->teacherId) && $existing['teacherId'] !== $data->teacherId) {
    http_response_code(403);
    echo json_encode(['message' => 'Bu öğrenciye erişim yetkiniz yok!']);
    exit;
}

// Transaction başlat (ilişkili verileri de silmek için)
$db->beginTransaction();

try {
    // Öğrenci programlarını sil
    $stmt1 = $db->prepare("DELETE FROM ogrenci_programlari WHERE ogrenci_id = ?");
    $stmt1->execute([$studentId]);
    
    // Öğrenci rutinlerini sil
    $stmt2 = $db->prepare("DELETE FROM ogrenci_rutinleri WHERE ogrenci_id = ?");
    $stmt2->execute([$studentId]);
    
    // Öğrenci rutin durumlarını sil
    $stmt3 = $db->prepare("DELETE FROM ogrenci_rutin_durumlari WHERE ogrenci_id = ?");
    $stmt3->execute([$studentId]);
    
    // Öğrenci analizlerini sil
    $stmt4 = $db->prepare("DELETE FROM ogrenci_analizleri WHERE ogrenci_id = ?");
    $stmt4->execute([$studentId]);
    
    // Öğrenciyi sil
    $stmt5 = $db->prepare("DELETE FROM ogrenciler WHERE id = ?");
    $stmt5->execute([$studentId]);
    
    // Transaction'ı commit et
    $db->commit();
    
    echo json_encode(['message' => 'Öğrenci başarıyla silindi!']);
} catch (Exception $e) {
    // Hata durumunda rollback
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['message' => 'Silme işlemi başarısız: ' . $e->getMessage()]);
}
?>

