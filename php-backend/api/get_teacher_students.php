<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']);
    exit;
}

// TeacherId parametresini al
$teacherId = isset($_GET['teacherId']) ? $_GET['teacherId'] : null;

if (empty($teacherId)) {
    http_response_code(400);
    echo json_encode(['message' => 'Teacher ID gerekli']);
    exit;
}

// Öğretmenin öğrencilerini çek
$query = "SELECT id, firstName, lastName, email, phone, className, alan, profilePhoto, meetingDay, meetingDate, online_status, son_giris_tarihi, createdAt, veli_id 
          FROM ogrenciler 
          WHERE teacherId = ? 
          ORDER BY createdAt DESC";
$stmt = $db->prepare($query);
$stmt->execute([$teacherId]);
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Alan adlarını çöz
foreach ($students as &$student) {
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
    $student['alan_debug'] = $student['alan']; // Debug için ham değeri de gönderelim
}

echo json_encode([
    'success' => true,
    'students' => $students,
    'debug_info' => [
        'count' => count($students),
        'timestamp' => date('Y-m-d H:i:s')
    ]
]);
?>

