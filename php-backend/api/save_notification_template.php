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

if (!isset($data->user_id) || !isset($data->name) || !isset($data->content)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$query = "INSERT INTO notification_templates (user_id, name, content) VALUES (?, ?, ?)";
$stmt = $db->prepare($query);

try {
    if ($stmt->execute([$data->user_id, $data->name, $data->content])) {
        $id = $db->lastInsertId();
        echo json_encode(['success' => true, 'message' => 'Template created', 'id' => $id]);
    } else {
        throw new Exception('Execute failed');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage(),
        'debug_user_id_type' => gettype($data->user_id)
    ]);
}

?>
