<?php
ob_clean();

header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Preflight OPTIONS request'i handle et
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// TeacherId parametresini al
$teacherId = isset($_GET['teacherId']) ? $_GET['teacherId'] : null;

if (empty($teacherId)) {
    http_response_code(400);
    echo json_encode(['message' => 'Teacher ID gerekli']);
    exit;
}

// Öğretmenin öğrencilerini çek
$query = "SELECT id, firstName, lastName, email, phone, className, alan, profilePhoto, meetingDay, meetingDate, online_status, son_giris_tarihi, createdAt 
          FROM ogrenciler 
          WHERE teacherId = ? 
          ORDER BY createdAt DESC";
$stmt = $db->prepare($query);
$stmt->execute([$teacherId]);
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['students' => $students]);
?>

