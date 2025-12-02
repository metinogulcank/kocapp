<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $templateId = $data['templateId'] ?? null;

    if (!$templateId) {
        echo json_encode(['success' => false, 'message' => 'templateId gerekli']);
        exit;
    }

    $db->beginTransaction();
    try {
        $db->prepare("DELETE FROM sablon_program_detaylari WHERE sablon_id = ?")->execute([$templateId]);
        $db->prepare("DELETE FROM program_sablonlari WHERE id = ?")->execute([$templateId]);
        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Şablon silindi']);
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>


