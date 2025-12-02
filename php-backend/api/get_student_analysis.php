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
    $teacherId = isset($_GET['teacherId']) ? $_GET['teacherId'] : null;
    $weekStart = isset($_GET['weekStart']) ? $_GET['weekStart'] : null;

    if (!$studentId || !$teacherId || !$weekStart) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $weekStartDate = date_create($weekStart);
    if ($weekStartDate === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz hafta başlangıç tarihi'
        ]);
        exit;
    }
    $weekStartFormatted = $weekStartDate->format('Y-m-d');

    $query = "SELECT id, ogretmen_yorumu, ai_yorumu
              FROM ogrenci_analizleri
              WHERE ogrenci_id = :ogrenci_id
                AND ogretmen_id = :ogretmen_id
                AND hafta_baslangic = :hafta_baslangic
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':ogrenci_id' => $studentId,
        ':ogretmen_id' => $teacherId,
        ':hafta_baslangic' => $weekStartFormatted
    ]);

    $analysis = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'analysisId' => $analysis['id'] ?? null,
        'teacherComment' => $analysis['ogretmen_yorumu'] ?? '',
        'aiComment' => $analysis['ai_yorumu'] ?? ''
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>


