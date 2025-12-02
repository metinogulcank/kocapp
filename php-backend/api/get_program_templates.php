<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $teacherId = isset($_GET['teacherId']) ? $_GET['teacherId'] : null;

    if (!$teacherId) {
        echo json_encode([
            'success' => false,
            'message' => 'Öğretmen ID gerekli'
        ]);
        exit;
    }

    $query = "SELECT * FROM program_sablonlari 
              WHERE ogretmen_id = ? 
              ORDER BY olusturma_tarihi DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$teacherId]);
    $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'templates' => $templates
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

