<?php
ob_clean();
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

try {
    $stmt = $db->prepare("SELECT _id, firstName, lastName, email, phone, createdAt FROM users WHERE role = 'ogretmen' ORDER BY createdAt DESC");
    $stmt->execute();
    $teachers = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $teachers[] = [
            'id' => $row['_id'],
            'firstName' => $row['firstName'],
            'lastName' => $row['lastName'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'createdAt' => $row['createdAt']
        ];
    }
    echo json_encode(['success' => true, 'teachers' => $teachers]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
