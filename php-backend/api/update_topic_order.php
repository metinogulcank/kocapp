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
$json = json_decode($raw, true);

$ids = null;
if (is_array($json)) {
    if (isset($json['topic_ids']) && is_array($json['topic_ids'])) $ids = $json['topic_ids'];
    elseif (isset($json['topics']) && is_array($json['topics'])) $ids = $json['topics'];
}

if ($ids === null) {
    if (isset($_POST['topic_ids'])) {
        $ids = is_array($_POST['topic_ids']) ? $_POST['topic_ids'] : explode(',', $_POST['topic_ids']);
    } elseif (isset($_POST['topics'])) {
        $ids = is_array($_POST['topics']) ? $_POST['topics'] : explode(',', $_POST['topics']);
    }
}

if (!is_array($ids) || count($ids) === 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Geçersiz veri. Konu listesi gönderilmedi."]);
    exit;
}

try {
    $db->beginTransaction();
    $stmt = $db->prepare("UPDATE sinav_konulari SET sira = :sira WHERE id = :id");
    foreach ($ids as $index => $topicId) {
        $sira = $index + 1;
        $id = is_string($topicId) ? trim($topicId) : $topicId;
        $stmt->bindValue(':sira', $sira, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id);
        if (!$stmt->execute()) {
            throw new Exception("Konu sırası güncellenemedi.");
        }
    }
    $db->commit();
    echo json_encode(["success" => true, "message" => "Konu sırası başarıyla güncellendi."]);
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Konu sırası güncellenirken bir hata oluştu: " . $e->getMessage()]);
}
?>
