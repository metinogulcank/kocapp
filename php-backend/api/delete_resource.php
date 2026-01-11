<?php
ob_start(); if (ob_get_length()) ob_clean();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include_once '../config/database.php';
$db = (new Database())->getConnection();

// Tablo yoksa oluştur
try {
    $db->exec("CREATE TABLE IF NOT EXISTS ders_kaynaklari (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ders_id VARCHAR(24) NOT NULL,
        kaynak_adi VARCHAR(255) NOT NULL,
        kaynak_tipi VARCHAR(32) DEFAULT 'kitap',
        kaynak_url VARCHAR(1024) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ders_id (ders_id)
    )");
} catch (Exception $e) {
    // tablo oluşturulamazsa silme yine hata verecek; devam et
}
$raw = file_get_contents("php://input");
$data = json_decode($raw);
if (!$data) {
    $data = (object)[
        'id' => $_POST['id'] ?? null
    ];
}

$id = isset($data->id) ? htmlspecialchars(strip_tags($data->id)) : null;

if ($id) {
    try {
        $stmt = $db->prepare("DELETE FROM ders_kaynaklari WHERE id = ?");
        $ok = $stmt->execute([$id]);
        if ($ok) {
            echo json_encode(["success" => true, "message" => "Kaynak başarıyla silindi."]);
        } else {
            http_response_code(503);
            echo json_encode(["success" => false, "message" => "Kaynak silinemedi."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Kaynak silinemedi. Veri eksik."]);
}
?>
