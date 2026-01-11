<?php
ob_start();
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
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametre: studentId gerekli'
        ]);
        exit;
    }

    // Öğrenci bilgilerini çek
    $query = "SELECT id, firstName, lastName, email, phone, className, alan, profilePhoto, meetingDay, meetingDate, sinav_tarihi, online_status, son_giris_tarihi
              FROM ogrenciler 
              WHERE id = ? 
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Öğrenci bulunamadı'
        ]);
        exit;
    }

    // Alan adını çöz (Dinamik sınav/bileşen yapısı için)
    $alanName = $student['alan'];
    if (strpos($student['alan'], 'comp_') === 0) {
        $compId = str_replace('comp_', '', $student['alan']);
        // Daha garantici bir sorgu: COLLATE'i kaldırıp ham karşılaştırma yapalım, ama hata ihtimaline karşı try-catch ekleyelim
        try {
            $stmtAlan = $db->prepare("
                SELECT b.ad as b_ad, s.ad as s_ad 
                FROM sinav_bilesenleri b 
                JOIN sinavlar s ON b.sinav_id = s.id 
                WHERE b.id = ?
            ");
            $stmtAlan->execute([$compId]);
            $alanData = $stmtAlan->fetch(PDO::FETCH_ASSOC);
            if ($alanData) {
                $alanName = $alanData['s_ad'] . " - " . $alanData['b_ad'];
            } else {
                // Eğer bilesenlerde yoksa sadece sinav adını bulmaya çalış (yedek)
                $stmtBackup = $db->prepare("SELECT ad FROM sinavlar WHERE id = (SELECT sinav_id FROM sinav_bilesenleri WHERE id = ?)");
                $stmtBackup->execute([$compId]);
                $backupAd = $stmtBackup->fetchColumn();
                if ($backupAd) $alanName = $backupAd;
            }
        } catch (Exception $e) {
            // Hata durumunda COLLATE ile tekrar dene
            $stmtAlan = $db->prepare("
                SELECT b.ad as b_ad, s.ad as s_ad 
                FROM sinav_bilesenleri b 
                JOIN sinavlar s ON b.sinav_id COLLATE utf8mb4_general_ci = s.id COLLATE utf8mb4_general_ci 
                WHERE b.id COLLATE utf8mb4_general_ci = ?
            ");
            $stmtAlan->execute([$compId]);
            $alanData = $stmtAlan->fetch(PDO::FETCH_ASSOC);
            if ($alanData) {
                $alanName = $alanData['s_ad'] . " - " . $alanData['b_ad'];
            }
        }
    } elseif (strpos($student['alan'], 'exam_') === 0) {
        $examId = str_replace('exam_', '', $student['alan']);
        try {
            $stmtAlan = $db->prepare("SELECT ad FROM sinavlar WHERE id = ?");
            $stmtAlan->execute([$examId]);
            $alanName = $stmtAlan->fetchColumn() ?: $student['alan'];
        } catch (Exception $e) {
            $stmtAlan = $db->prepare("SELECT ad FROM sinavlar WHERE id COLLATE utf8mb4_general_ci = ?");
            $stmtAlan->execute([$examId]);
            $alanName = $stmtAlan->fetchColumn() ?: $student['alan'];
        }
    }

    $student['alanName'] = $alanName;
    $student['alan_debug'] = $student['alan'];

    echo json_encode([
        'success' => true,
        'student' => $student,
        'debug_info' => [
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

