<?php
ob_clean();
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

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        throw new Exception('Geçersiz istek gövdesi');
    }

    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;
    $weekStart = $data['weekStart'] ?? null;
    $teacherComment = $data['teacherComment'] ?? null;

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

    $selectQuery = "SELECT id FROM ogrenci_analizleri 
                    WHERE ogrenci_id = :ogrenci_id 
                      AND ogretmen_id = :ogretmen_id 
                      AND hafta_baslangic = :hafta_baslangic
                    LIMIT 1";
    $selectStmt = $db->prepare($selectQuery);
    $selectStmt->execute([
        ':ogrenci_id' => $studentId,
        ':ogretmen_id' => $teacherId,
        ':hafta_baslangic' => $weekStartFormatted
    ]);

    $existing = $selectStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $updateQuery = "UPDATE ogrenci_analizleri
                        SET ogretmen_yorumu = :ogretmen_yorumu,
                            guncelleme_tarihi = CURRENT_TIMESTAMP
                        WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([
            ':ogretmen_yorumu' => $teacherComment,
            ':id' => $existing['id']
        ]);
        $analysisId = $existing['id'];
    } else {
        $analysisId = bin2hex(random_bytes(12));
        $insertQuery = "INSERT INTO ogrenci_analizleri
            (id, ogrenci_id, ogretmen_id, hafta_baslangic, ogretmen_yorumu)
            VALUES (:id, :ogrenci_id, :ogretmen_id, :hafta_baslangic, :ogretmen_yorumu)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->execute([
            ':id' => $analysisId,
            ':ogrenci_id' => $studentId,
            ':ogretmen_id' => $teacherId,
            ':hafta_baslangic' => $weekStartFormatted,
            ':ogretmen_yorumu' => $teacherComment
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Analiz kaydedildi',
        'id' => $analysisId
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>


