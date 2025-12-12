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

    echo json_encode([
        'success' => true,
        'student' => [
            'id' => $student['id'],
            'firstName' => $student['firstName'],
            'lastName' => $student['lastName'],
            'email' => $student['email'],
            'phone' => $student['phone'],
            'className' => $student['className'],
            'alan' => $student['alan'],
            'profilePhoto' => $student['profilePhoto'],
            'meetingDay' => $student['meetingDay'],
            'meetingDate' => $student['meetingDate'],
            'sinavTarihi' => $student['sinav_tarihi'],
            'onlineStatus' => $student['online_status'] ?? 0,
            'sonGirisTarihi' => $student['son_giris_tarihi']
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

