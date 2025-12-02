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

    $programId = $data['programId'] ?? null;
    $isRoutineInstance = $data['isRoutineInstance'] ?? false;
    $routineId = $data['routineId'] ?? null;
    $ogrenciId = $data['ogrenciId'] ?? null;
    $targetDate = $data['targetDate'] ?? null;

    if (!$programId) {
        echo json_encode([
            'success' => false,
            'message' => 'Program ID gerekli'
        ]);
        exit;
    }

    if ($isRoutineInstance) {
        if (!$routineId || !$ogrenciId || !$targetDate) {
            echo json_encode([
                'success' => false,
                'message' => 'Rutin silme için eksik parametreler'
            ]);
            exit;
        }

        // First, delete any existing program entry for this routine instance
        $deleteProgramQuery = "DELETE FROM ogrenci_programlari WHERE routine_id = ? AND tarih = ? AND ogrenci_id = ?";
        $deleteProgramStmt = $db->prepare($deleteProgramQuery);
        $deleteProgramStmt->execute([$routineId, $targetDate, $ogrenciId]);

        // Then, add to skip list to prevent it from appearing again
        $skipQuery = "INSERT INTO ogrenci_rutin_skipleri (routine_id, ogrenci_id, tarih)
                      VALUES (?, ?, ?)
                      ON DUPLICATE KEY UPDATE tarih = VALUES(tarih)";
        $skipStmt = $db->prepare($skipQuery);
        $success = $skipStmt->execute([$routineId, $ogrenciId, $targetDate]);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Rutin bu haftadan kaldırıldı'
            ]);
        } else {
            $errorInfo = $skipStmt->errorInfo();
            echo json_encode([
                'success' => false,
                'message' => 'Rutin kaldırılamadı: ' . ($errorInfo[2] ?? 'Bilinmeyen hata')
            ]);
        }
    } else {
        $query = "DELETE FROM ogrenci_programlari WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$programId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Program başarıyla silindi'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Program bulunamadı'
            ]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

