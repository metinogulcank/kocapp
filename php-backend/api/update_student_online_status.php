<?php
ob_start();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['studentId']) || !isset($data['onlineStatus'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $studentId = $data['studentId'];
    $onlineStatus = (int)$data['onlineStatus']; // 0 veya 1

    // Online yaparken son_giris_tarihi'ni de güncelle
    if ($onlineStatus === 1) {
        $updateQuery = "UPDATE ogrenciler SET online_status = 1, son_giris_tarihi = NOW() WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute([$studentId]);
    } else {
        $updateQuery = "UPDATE ogrenciler SET online_status = 0 WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute([$studentId]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Online durum güncellendi'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

