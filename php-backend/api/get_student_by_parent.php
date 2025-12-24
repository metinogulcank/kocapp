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
    $parentId = isset($_GET['parentId']) ? $_GET['parentId'] : null;

    if (!$parentId) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametre: parentId gerekli'
        ]);
        exit;
    }

    // ogrenciler tablosunda veli_id ile eşleşen öğrenciyi bul
    // Birden fazla öğrenci varsa ilkini döner
    $stmt = $db->prepare("SELECT id, firstName, lastName, email, phone, className, alan, profilePhoto, meetingDay, meetingDate, sinav_tarihi 
                          FROM ogrenciler 
                          WHERE veli_id = ? 
                          ORDER BY createdAt DESC 
                          LIMIT 1");
    $stmt->execute([$parentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode([
            'success' => true,
            'student' => null
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
            'sinavTarihi' => $student['sinav_tarihi']
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
