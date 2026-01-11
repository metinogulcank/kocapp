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

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$teacherId = isset($_GET['teacherId']) ? $_GET['teacherId'] : null;

if (empty($teacherId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Teacher ID gerekli']);
    exit;
}

try {
    $checkColumn = $db->query("SHOW COLUMNS FROM ogrenciler LIKE 'veli_id'");
    $hasParentColumn = $checkColumn && $checkColumn->rowCount() > 0;

    if ($hasParentColumn) {
        $stmt = $db->prepare("
            SELECT s.id, s.firstName, s.lastName, s.email, s.phone, s.className, s.alan, s.profilePhoto, s.meetingDay, s.meetingDate, s.online_status, s.son_giris_tarihi, s.createdAt,
                   p._id AS parentId, p.firstName AS parentFirstName, p.lastName AS parentLastName, p.email AS parentEmail, p.phone AS parentPhone
            FROM ogrenciler s
            LEFT JOIN users p ON p._id = s.veli_id
            WHERE s.teacherId = ?
            ORDER BY s.createdAt DESC
        ");
        $stmt->execute([$teacherId]);
    } else {
        $stmt = $db->prepare("
            SELECT s.id, s.firstName, s.lastName, s.email, s.phone, s.className, s.alan, s.profilePhoto, s.meetingDay, s.meetingDate, s.online_status, s.son_giris_tarihi, s.createdAt
            FROM ogrenciler s
            WHERE s.teacherId = ?
            ORDER BY s.createdAt DESC
        ");
        $stmt->execute([$teacherId]);
    }

    $students = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Alan adını çöz
        $alanName = $row['alan'];
        if (!empty($row['alan'])) {
            if (strpos($row['alan'], 'comp_') === 0) {
                $compId = str_replace('comp_', '', $row['alan']);
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
            } elseif (strpos($row['alan'], 'exam_') === 0) {
                $examId = str_replace('exam_', '', $row['alan']);
                try {
                    $stmtAlan = $db->prepare("SELECT ad FROM sinavlar WHERE id = ?");
                    $stmtAlan->execute([$examId]);
                    $fetchedName = $stmtAlan->fetchColumn();
                    if ($fetchedName) $alanName = $fetchedName;
                } catch (Exception $e) {
                    $stmtAlan = $db->prepare("SELECT ad FROM sinavlar WHERE id COLLATE utf8mb4_general_ci = ?");
                    $stmtAlan->execute([$examId]);
                    $fetchedName = $stmtAlan->fetchColumn();
                    if ($fetchedName) $alanName = $fetchedName;
                }
            }
        }

        $student = [
            'id' => $row['id'],
            'firstName' => $row['firstName'],
            'lastName' => $row['lastName'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'className' => $row['className'],
            'alan' => $alanName,
            'profilePhoto' => $row['profilePhoto'],
            'meetingDay' => $row['meetingDay'],
            'meetingDate' => $row['meetingDate'],
            'online_status' => isset($row['online_status']) ? intval($row['online_status']) : 0,
            'son_giris_tarihi' => $row['son_giris_tarihi'] ?? null,
            'createdAt' => $row['createdAt'],
            'parent' => null
        ];
        if ($hasParentColumn && isset($row['parentId']) && !empty($row['parentId'])) {
            $student['parent'] = [
                'id' => $row['parentId'],
                'firstName' => $row['parentFirstName'],
                'lastName' => $row['parentLastName'],
                'email' => $row['parentEmail'],
                'phone' => $row['parentPhone']
            ];
        }
        $students[] = $student;
    }

    echo json_encode(['success' => true, 'students' => $students]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
