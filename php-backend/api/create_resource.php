<?php
ob_start(); if (ob_get_length()) ob_clean();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include_once '../config/database.php';
$db = (new Database())->getConnection();

$raw = file_get_contents("php://input");
$data = json_decode($raw);
if (!$data) {
    // form-encoded fallback
    $data = (object)[
        'ders_id' => $_POST['ders_id'] ?? null,
        'konu_id' => $_POST['konu_id'] ?? null,
        'kaynak_adi' => $_POST['kaynak_adi'] ?? null,
        'kaynak_url' => $_POST['kaynak_url'] ?? null,
        'kaynak_tipi' => $_POST['kaynak_tipi'] ?? null,
    ];
}

$ders_id = isset($data->ders_id) ? htmlspecialchars(strip_tags($data->ders_id)) : null;
$konu_id = isset($data->konu_id) ? htmlspecialchars(strip_tags($data->konu_id)) : null;
$kaynak_adi = isset($data->kaynak_adi) ? htmlspecialchars(strip_tags($data->kaynak_adi)) : null;
$kaynak_url = isset($data->kaynak_url) ? htmlspecialchars(strip_tags($data->kaynak_url)) : '';
$kaynak_tipi = isset($data->kaynak_tipi) && $data->kaynak_tipi !== '' ? htmlspecialchars(strip_tags($data->kaynak_tipi)) : 'kitap';

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
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
    exit;
}

// konu_id geldiyse ders_id'e çevir
if (!$ders_id && $konu_id) {
    try {
        $stmt = $db->prepare("SELECT ders_id FROM sinav_konulari WHERE id = ? LIMIT 1");
        $stmt->execute([$konu_id]);
        $ders_id = $stmt->fetchColumn() ?: null;
    } catch (Exception $e) {
        // ignore mapping error
    }
}

if ($ders_id && $kaynak_adi) {
    try {
        $stmt = $db->prepare("INSERT INTO ders_kaynaklari (ders_id, kaynak_adi, kaynak_tipi, kaynak_url, created_at) VALUES (?, ?, ?, ?, NOW())");
        $ok = $stmt->execute([$ders_id, $kaynak_adi, $kaynak_tipi, $kaynak_url]);
        if ($ok) {
            http_response_code(201);
            $last_id = $db->lastInsertId();
            echo json_encode([
                "success" => true,
                "message" => "Kaynak başarıyla oluşturuldu.",
                "resource" => [
                    "id" => $last_id,
                    "ders_id" => $ders_id,
                    "kaynak_adi" => $kaynak_adi,
                    "kaynak_tipi" => $kaynak_tipi,
                    "kaynak_url" => $kaynak_url
                ]
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["success" => false, "message" => "Kaynak oluşturulamadı."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Kaynak oluşturulamadı. Veri eksik."]);
}
?>
