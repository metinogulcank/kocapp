<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

$query = "SELECT * FROM notification_templates WHERE user_id = ? ORDER BY created_at DESC";
$stmt = $db->prepare($query);
$stmt->execute([$userId]);
$templates = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'templates' => $templates]);
?>
