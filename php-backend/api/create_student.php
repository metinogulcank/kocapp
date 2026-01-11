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

function generateRandomId($len = 24) {
    return bin2hex(random_bytes($len/2));
}

if (
    empty($data->firstName) || empty($data->lastName) ||
    empty($data->email) || empty($data->password) ||
    empty($data->teacherId) || empty($data->className) || empty($data->alan)
) {
    http_response_code(400);
    echo json_encode(['message' => 'Zorunlu alanlar eksik!']);
    exit;
}

// E-mail unique kontrolü
$stmt = $db->prepare("SELECT 1 FROM ogrenciler WHERE email = ? LIMIT 1");
$stmt->execute([$data->email]);
if ($stmt->fetchColumn()) {
    http_response_code(409);
    echo json_encode(['message' => 'Bu e-posta zaten kayıtlı!']);
    exit;
}

$id = generateRandomId();
$firstName = $data->firstName;
$lastName = $data->lastName;
$email = $data->email;
$phone = !empty($data->phone) ? $data->phone : null;
$className = $data->className;
$alan = $data->alan;
$profilePhoto = !empty($data->profilePhoto) ? $data->profilePhoto : null;
$passwordHash = password_hash($data->password, PASSWORD_DEFAULT);
$teacherId = $data->teacherId;
$meetingDayRaw = isset($data->meetingDay) ? intval($data->meetingDay) : 1;
$meetingDay = ($meetingDayRaw >= 1 && $meetingDayRaw <= 7) ? $meetingDayRaw : 1;

// Görüşme tarihi (YYYY-MM-DD). Geçerli bir tarih değilse NULL kalır.
$meetingDate = null;
if (!empty($data->meetingDate)) {
    $ts = strtotime($data->meetingDate);
    if ($ts !== false) {
        $meetingDate = date('Y-m-d', $ts);
        // meetingDay belirtilmemişse tarihten türet
        if ($meetingDayRaw === 1 && empty($data->meetingDay)) {
            $dow = (int)date('N', $ts); // 1 (Pzt) - 7 (Paz)
            if ($dow >= 1 && $dow <= 7) {
                $meetingDay = $dow;
            }
        }
    }
}

// Eğer fotoğraf URL'si geçici klasördeyse, öğrenci ID'sine taşı
if (!empty($profilePhoto) && strpos($profilePhoto, '/students/temp_') !== false) {
    // Geçici klasör yolunu bul
    $baseDir = dirname(dirname(__DIR__));
    $uploadBaseDir = $baseDir . '/uploads';
    
    // URL'den geçici ID'yi çıkar
    preg_match('/\/students\/(temp_\d+)\//', $profilePhoto, $matches);
    if (!empty($matches[1])) {
        $tempId = $matches[1];
        $tempDir = $uploadBaseDir . '/students/' . $tempId;
        $newDir = $uploadBaseDir . '/students/' . $id;
        
        // Dosya adını al
        $fileName = basename($profilePhoto);
        
        // Geçici klasördeki dosyayı öğrenci ID klasörüne taşı
        if (file_exists($tempDir . '/' . $fileName)) {
            // Yeni klasörü oluştur
            if (!file_exists($newDir)) {
                mkdir($newDir, 0755, true);
            }
            
            // Dosyayı taşı
            if (rename($tempDir . '/' . $fileName, $newDir . '/' . $fileName)) {
                // Eski geçici klasörü sil
                if (is_dir($tempDir)) {
                    array_map('unlink', glob($tempDir . '/*'));
                    rmdir($tempDir);
                }
                
                // Yeni URL'yi oluştur
                $profilePhoto = 'https://kocapp.com/uploads/students/' . $id . '/' . $fileName;
            }
        }
    }
}

$query = "INSERT INTO ogrenciler (id, firstName, lastName, email, phone, className, alan, profilePhoto, passwordHash, teacherId, meetingDay, meetingDate, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
$stmt = $db->prepare($query);
$params = [$id, $firstName, $lastName, $email, $phone, $className, $alan, $profilePhoto, $passwordHash, $teacherId, $meetingDay, $meetingDate];
$success = $stmt->execute($params);

if ($success) {
    echo json_encode(['message' => 'Öğrenci başarıyla kaydedildi!']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Veritabanı hatası!']);
}
?>

