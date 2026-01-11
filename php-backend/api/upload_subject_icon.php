<?php
ob_clean();
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

if (!isset($_FILES['icon']) || $_FILES['icon']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dosya gerekli']);
    exit;
}
if (!isset($_POST['ders_id']) || $_POST['ders_id'] === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ders_id gerekli']);
    exit;
}
$file = $_FILES['icon'];
$dersId = $_POST['ders_id'];
if ($file['type'] !== 'image/png') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Sadece PNG']);
    exit;
}
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Max 5MB']);
    exit;
}
$baseDir = dirname(dirname(__DIR__));
$uploadDir = $baseDir . '/uploads/subjects/' . $dersId;
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Klasör oluşturulamadı']);
        exit;
    }
}
$fileName = 'icon.png';
$filePath = $uploadDir . '/' . $fileName;
if (file_exists($filePath)) { unlink($filePath); }
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Dosya kaydedilemedi']);
    exit;
}
$publicUrl = 'https://kocapp.com/uploads/subjects/' . $dersId . '/' . $fileName;

require_once '../config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE sinav_dersleri SET icon_url = ?, updatedAt = NOW() WHERE id = ?");
$stmt->execute([$publicUrl, $dersId]);

echo json_encode(['success' => true, 'url' => $publicUrl]);
?>
