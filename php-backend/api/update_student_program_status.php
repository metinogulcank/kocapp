<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    $data = json_decode(file_get_contents('php://input'), true);

    $programId = $data['programId'] ?? null;
    $status = $data['status'] ?? null;
    $dogru = isset($data['dogru']) ? (int)$data['dogru'] : null;
    $yanlis = isset($data['yanlis']) ? (int)$data['yanlis'] : null;
    $bos = isset($data['bos']) ? (int)$data['bos'] : null;
    $isRoutineInstance = $data['isRoutineInstance'] ?? false;
    $routineId = $data['routineId'] ?? null;
    $ogrenciId = $data['ogrenciId'] ?? null;
    $targetDate = $data['targetDate'] ?? null;

    if (!$programId || !$status) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $allowedStatuses = ['yapildi', 'eksik_yapildi', 'yapilmadi'];
    if (!in_array($status, $allowedStatuses, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz durum değeri'
        ]);
        exit;
    }

    if ($isRoutineInstance) {
        if (!$routineId || !$ogrenciId || !$targetDate) {
            echo json_encode([
                'success' => false,
                'message' => 'Rutin durumu için eksik parametreler'
            ]);
            exit;
        }

        $query = "INSERT INTO ogrenci_rutin_durumlari (routine_id, ogrenci_id, tarih, durum)
                  VALUES (?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE durum = VALUES(durum)";
        $stmt = $db->prepare($query);
        $success = $stmt->execute([$routineId, $ogrenciId, $targetDate, $status]);
    } else {
        if ($dogru !== null || $yanlis !== null || $bos !== null) {
            $query = "UPDATE ogrenci_programlari SET durum = ?, dogru = ?, yanlis = ?, bos = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $success = $stmt->execute([$status, $dogru, $yanlis, $bos, $programId]);
        } else {
            $query = "UPDATE ogrenci_programlari SET durum = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $success = $stmt->execute([$status, $programId]);
        }
    }

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Durum güncellendi'
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        echo json_encode([
            'success' => false,
            'message' => 'Durum güncellenemedi: ' . ($errorInfo[2] ?? 'Bilinmeyen hata')
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sunucu hatası: ' . $e->getMessage()
    ]);
}
?>

