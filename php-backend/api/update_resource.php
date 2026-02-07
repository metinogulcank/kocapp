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
    $data = (object)[
        'id' => $_POST['id'] ?? null,
        'kaynak_adi' => $_POST['kaynak_adi'] ?? null,
        'kaynak_url' => $_POST['kaynak_url'] ?? null,
    ];
}

$id = isset($data->id) ? htmlspecialchars(strip_tags($data->id)) : null;
$kaynak_adi = isset($data->kaynak_adi) ? htmlspecialchars(strip_tags($data->kaynak_adi)) : null;
$kaynak_url = isset($data->kaynak_url) ? htmlspecialchars(strip_tags($data->kaynak_url)) : '';
$seviye = isset($data->seviye) ? htmlspecialchars(strip_tags($data->seviye)) : null;

if ($id && $kaynak_adi) {
    try {
        if ($seviye !== null && $seviye !== '') {
            $stmt = $db->prepare("UPDATE ders_kaynaklari SET kaynak_adi = ?, kaynak_url = ?, seviye = ? WHERE id = ?");
            $ok = $stmt->execute([$kaynak_adi, $kaynak_url, $seviye, $id]);
        } else {
            $stmt = $db->prepare("UPDATE ders_kaynaklari SET kaynak_adi = ?, kaynak_url = ? WHERE id = ?");
            $ok = $stmt->execute([$kaynak_adi, $kaynak_url, $id]);
        }
        if ($ok) {
            echo json_encode(["success" => true, "message" => "Kaynak başarıyla güncellendi."]);
        } else {
            http_response_code(503);
            echo json_encode(["success" => false, "message" => "Kaynak güncellenemedi."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Kaynak güncellenemedi. Veri eksik."]);
}
?>
