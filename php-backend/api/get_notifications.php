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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

    // Kullanıcıya ait bildirimleri getir
    // sender_name için users tablosuna join yap (sender_id = users.id)
    $query = "
        SELECT 
            n.id,
            n.sender_id,
            n.sender_type,
            n.title,
            n.message,
            n.priority,
            n.created_at,
            un.is_read,
            un.read_at,
            CASE 
                WHEN n.sender_type = 'admin' THEN 'Yönetici'
                WHEN u._id IS NOT NULL THEN CONCAT(u.firstName, ' ', u.lastName)
                ELSE 'Sistem'
            END as sender_name
        FROM user_notifications un
        JOIN notifications n ON un.notification_id = n.id
        LEFT JOIN users u ON n.sender_id = u._id
        WHERE un.user_id = :user_id 
          AND un.user_type = :user_type
          AND (un.is_deleted = 0 OR un.is_deleted IS NULL)
        ORDER BY n.created_at DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute(['user_id' => $userId, 'user_type' => $targetType]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Tarih formatı ve null değerler
    foreach ($notifications as &$notification) {
        $notification['created_at'] = date('d.m.Y H:i', strtotime($notification['created_at']));
    }
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Bildirimler getirilirken bir hata oluştu: ' . $e->getMessage()
    ]);
}
?>
