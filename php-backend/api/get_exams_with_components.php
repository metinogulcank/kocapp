<?php
ob_start();
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Veritabanı bağlantısı kurulamadı.");
    }

    // Tüm sınavları getir
    $stmt = $db->prepare("SELECT id, ad FROM sinavlar ORDER BY ad ASC");
    $stmt->execute();
    $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Her sınav için bileşenleri getir
    $results = [];
    foreach ($exams as $exam) {
        $stmtComp = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE sinav_id = ? AND parent_id IS NULL ORDER BY ad ASC");
        $stmtComp->execute([$exam['id']]);
        $components = $stmtComp->fetchAll(PDO::FETCH_ASSOC);

        $results[] = [
            'id' => $exam['id'],
            'ad' => $exam['ad'],
            'components' => $components
        ];
    }

    echo json_encode([
        'success' => true,
        'exams' => $results
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
