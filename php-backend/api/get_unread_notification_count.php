<?php
// Tüm önceki header'ları temizle
foreach (headers_list() as $header) {
    header_remove(strstr($header, ':', true));
}

// CORS header'larını ayarla
header('Content-Type: application/json');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS isteği için early return
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once 'auth_helper.php';

// Veritabanı bağlantısı
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Veritabanı bağlantı hatası']);
    exit;
}

// Oturum/Token kontrolü
$user = getAuthUser();
$userId = null;
$userRole = null;

// URL parametresinden userId al
if (isset($_GET['userId'])) {
    $userId = $_GET['userId'];
    if ($user) {
        $userRole = $user['role'];
    } elseif (isset($_GET['role'])) {
        $userRole = $_GET['role'];
    }
} elseif ($user) {
    $userId = $user['id'];
    $userRole = $user['role'];
} else {
    session_start();
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        $userRole = $_SESSION['user_type'] ?? 'ogretmen';
    }
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Oturum açılmamış (userId eksik)']);
    exit;
}

try {
    // Role mapping
    $typeMapping = [
        'ogrenci' => 'student',
        'student' => 'student',
        'veli' => 'parent',
        'parent' => 'parent',
        'ogretmen' => 'teacher',
        'teacher' => 'teacher',
        'admin' => 'admin'
    ];
    $targetType = $typeMapping[$userRole] ?? $userRole;

    $query = "SELECT COUNT(*) as count FROM user_notifications WHERE user_id = :user_id AND user_type = :user_type AND is_read = 0";
    $stmt = $db->prepare($query);
    $stmt->execute(['user_id' => $userId, 'user_type' => $targetType]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'count' => (int)$result['count']]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
