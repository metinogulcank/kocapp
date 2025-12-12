<?php
ob_clean();

header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Preflight OPTIONS request'i handle et
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents('php://input'));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Öğrenci ID gerekli!']);
    exit;
}

$studentId = $data->id;

// Öğrencinin var olup olmadığını kontrol et
$checkStmt = $db->prepare("SELECT id, teacherId FROM ogrenciler WHERE id = ? LIMIT 1");
$checkStmt->execute([$studentId]);
$existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$existing) {
    http_response_code(404);
    echo json_encode(['message' => 'Öğrenci bulunamadı!']);
    exit;
}

// Öğretmen kontrolü (opsiyonel - güvenlik için)
if (!empty($data->teacherId) && $existing['teacherId'] !== $data->teacherId) {
    http_response_code(403);
    echo json_encode(['message' => 'Bu öğrenciye erişim yetkiniz yok!']);
    exit;
}

// Güncellenecek alanları hazırla
$updates = [];
$params = [];

if (isset($data->firstName)) {
    $updates[] = "firstName = ?";
    $params[] = $data->firstName;
}

if (isset($data->lastName)) {
    $updates[] = "lastName = ?";
    $params[] = $data->lastName;
}

if (isset($data->email)) {
    // E-mail unique kontrolü (kendi email'i hariç)
    $emailCheckStmt = $db->prepare("SELECT 1 FROM ogrenciler WHERE email = ? AND id != ? LIMIT 1");
    $emailCheckStmt->execute([$data->email, $studentId]);
    if ($emailCheckStmt->fetchColumn()) {
        http_response_code(409);
        echo json_encode(['message' => 'Bu e-posta zaten başka bir öğrenci tarafından kullanılıyor!']);
        exit;
    }
    $updates[] = "email = ?";
    $params[] = $data->email;
}

if (isset($data->phone)) {
    $updates[] = "phone = ?";
    $params[] = !empty($data->phone) ? $data->phone : null;
}

if (isset($data->className)) {
    $updates[] = "className = ?";
    $params[] = $data->className;
}

if (isset($data->alan)) {
    $updates[] = "alan = ?";
    $params[] = $data->alan;
}

if (isset($data->profilePhoto)) {
    $updates[] = "profilePhoto = ?";
    $params[] = !empty($data->profilePhoto) ? $data->profilePhoto : null;
}

// Şifre güncelleme (sadece yeni şifre verilmişse)
if (!empty($data->password)) {
    $updates[] = "passwordHash = ?";
    $params[] = password_hash($data->password, PASSWORD_DEFAULT);
}

// Görüşme tarihi güncelleme
if (isset($data->meetingDate)) {
    $meetingDate = null;
    if (!empty($data->meetingDate)) {
        $ts = strtotime($data->meetingDate);
        if ($ts !== false) {
            $meetingDate = date('Y-m-d', $ts);
            // meetingDay'i de güncelle (tarihten türet)
            $dow = (int)date('N', $ts); // 1 (Pzt) - 7 (Paz)
            if ($dow >= 1 && $dow <= 7) {
                $updates[] = "meetingDay = ?";
                $params[] = $dow;
            }
        }
    }
    $updates[] = "meetingDate = ?";
    $params[] = $meetingDate;
}

// Eğer güncellenecek alan yoksa
if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['message' => 'Güncellenecek alan belirtilmedi!']);
    exit;
}

// updatedAt'i ekle
$updates[] = "updatedAt = NOW()";

// ID'yi params'a ekle
$params[] = $studentId;

// UPDATE sorgusu
$query = "UPDATE ogrenciler SET " . implode(", ", $updates) . " WHERE id = ?";
$stmt = $db->prepare($query);
$success = $stmt->execute($params);

if ($success) {
    echo json_encode(['message' => 'Öğrenci başarıyla güncellendi!']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Veritabanı hatası!']);
}
?>

