<?php
ob_start();
if (ob_get_length()) ob_clean();

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

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Template ID required']);
    exit;
}

$query = "DELETE FROM notification_templates WHERE id = ?";
$stmt = $db->prepare($query);

if ($stmt->execute([$data->id])) {
    echo json_encode(['success' => true, 'message' => 'Template deleted']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to delete template']);
}
?>
