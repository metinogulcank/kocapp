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
    $studentId = isset($_GET['studentId']) ? $_GET['studentId'] : null;

    if (!$studentId) {
        throw new Exception('Student ID gerekli');
    }

    // Check if veli_id column exists
    $checkColumn = $db->query("SHOW COLUMNS FROM ogrenciler LIKE 'veli_id'");
    if ($checkColumn->rowCount() === 0) {
        // Column doesn't exist, so no parent
        echo json_encode([
            'success' => true,
            'parent' => null
        ]);
        exit;
    }

    // Get veli_id from student
    $stmt = $db->prepare("SELECT veli_id FROM ogrenciler WHERE id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student || empty($student['veli_id'])) {
        echo json_encode([
            'success' => true,
            'parent' => null
        ]);
        exit;
    }

    // Get parent details
    $parentStmt = $db->prepare("SELECT _id, firstName, lastName, email, phone FROM users WHERE _id = ?");
    $parentStmt->execute([$student['veli_id']]);
    $parent = $parentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$parent) {
        echo json_encode([
            'success' => true,
            'parent' => null
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'parent' => $parent
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
