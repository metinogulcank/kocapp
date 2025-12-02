<?php
ob_clean();

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Dosya yükleme kontrolü
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['message' => 'Fotoğraf yüklenemedi!']);
    exit;
}

$file = $_FILES['photo'];
$userId = isset($_POST['_id']) ? $_POST['_id'] : null;
$type = isset($_POST['type']) ? $_POST['type'] : 'teacher'; // 'teacher' veya 'student'

// Dosya tipi kontrolü
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['message' => 'Sadece resim dosyaları yüklenebilir! (JPG, PNG, GIF, WEBP)']);
    exit;
}

// Dosya boyutu kontrolü (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['message' => 'Dosya boyutu 5MB\'dan büyük olamaz!']);
    exit;
}

// Uploads klasörü yolu
$baseDir = dirname(dirname(__DIR__)); // php-backend'in bir üst dizini (public_html veya www)
$uploadBaseDir = $baseDir . '/uploads';

// Kullanıcı ID'si yoksa geçici klasör kullan
if (empty($userId) || $userId === 'tempid-for-stuadd-modal') {
    // Geçici klasör için timestamp kullan
    $userId = 'temp_' . time();
}

// Klasör yolu
$userDir = $uploadBaseDir . '/' . $userId;

// Klasör yoksa oluştur
if (!file_exists($userDir)) {
    if (!mkdir($userDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['message' => 'Klasör oluşturulamadı!']);
        exit;
    }
}

// Dosya uzantısını al
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (empty($extension)) {
    // MIME type'dan uzantı belirle
    $mimeMap = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $extension = isset($mimeMap[$file['type']]) ? $mimeMap[$file['type']] : 'jpg';
}

// Dosya adı
$fileName = 'profile.' . $extension;
$filePath = $userDir . '/' . $fileName;

// Eski dosyayı sil (varsa)
if (file_exists($filePath)) {
    unlink($filePath);
}

// Dosyayı yükle
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['message' => 'Dosya kaydedilemedi!']);
    exit;
}

// Public URL oluştur
// Eğer type student ise, students klasörüne kaydet
if ($type === 'student') {
    // Öğrenci fotoğrafları için ayrı klasör (öğrenci oluşturulduktan sonra taşınabilir)
    $studentDir = $uploadBaseDir . '/students/' . $userId;
    if (!file_exists($studentDir)) {
        mkdir($studentDir, 0755, true);
    }
    $studentFilePath = $studentDir . '/' . $fileName;
    if (file_exists($filePath)) {
        copy($filePath, $studentFilePath);
    }
    $url = 'https://vedatdaglarmuhendislik.com.tr/uploads/students/' . $userId . '/' . $fileName;
} else {
    // Öğretmen fotoğrafları için
    $url = 'https://vedatdaglarmuhendislik.com.tr/uploads/' . $userId . '/' . $fileName;
}

echo json_encode([
    'message' => 'Fotoğraf başarıyla yüklendi!',
    'url' => $url
]);
?>

