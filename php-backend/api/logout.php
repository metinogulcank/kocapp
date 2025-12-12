<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Eğer öğrenci logout yapıyorsa online durumunu 0 yap
$data = json_decode(file_get_contents("php://input"), true);
if (isset($data['studentId']) && !empty($data['studentId'])) {
    try {
        $updateQuery = "UPDATE ogrenciler SET online_status = 0 WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute([$data['studentId']]);
    } catch (Exception $e) {
        // Hata olsa bile logout devam etsin
        error_log("Logout online status update error: " . $e->getMessage());
    }
}

http_response_code(200);
echo json_encode(array("message" => "Çıkış başarılı", "ok" => true));
?>
