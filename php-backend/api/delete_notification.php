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
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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

// Auth check
$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
$user_id = $user['id'];
$userRole = $user['role'];

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

// Get POST data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->notification_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Notification ID is required']);
    exit;
}

$notification_id = $data->notification_id;

try {
    // 1. user_notifications tablosuna is_deleted kolonu ekle (eğer yoksa)
    try {
        $stmt = $db->query("DESCRIBE user_notifications is_deleted");
        if (!$stmt->fetch()) {
            $db->exec("ALTER TABLE user_notifications ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
        }
    } catch (Exception $e) {
        // Kolon ekleme hatası (belki yetki yok), logla ama devam et
        error_log("Column add error: " . $e->getMessage());
    }

    // 2. notifications tablosuna is_deleted kolonu ekle (eğer yoksa)
    try {
        $stmt = $db->query("DESCRIBE notifications is_deleted");
        if (!$stmt->fetch()) {
            $db->exec("ALTER TABLE notifications ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
        }
    } catch (Exception $e) {
        error_log("Column add error: " . $e->getMessage());
    }

    // Check if the notification belongs to the user (received) or was sent by the user
    // First check user_notifications (received)
    $stmt = $db->prepare("SELECT id FROM user_notifications WHERE notification_id = :notification_id AND user_id = :user_id AND user_type = :user_type");
    $stmt->execute([':notification_id' => $notification_id, ':user_id' => $user_id, ':user_type' => $targetType]);
    
    if ($stmt->rowCount() > 0) {
        // It's a received notification, SOFT DELETE (mark as deleted)
        $update_stmt = $db->prepare("UPDATE user_notifications SET is_deleted = 1 WHERE notification_id = :notification_id AND user_id = :user_id AND user_type = :user_type");
        $update_stmt->execute([':notification_id' => $notification_id, ':user_id' => $user_id, ':user_type' => $targetType]);
        
        echo json_encode(['success' => true, 'message' => 'Bildirim silindi (arşivlendi)']);
        exit;
    }
    
    // Check if it was sent by the user (notifications table)
    // sender_type usually matches user_type (teacher/admin)
    $stmt = $db->prepare("SELECT id FROM notifications WHERE id = :notification_id AND sender_id = :sender_id AND sender_type = :sender_type");
    $stmt->execute([':notification_id' => $notification_id, ':sender_id' => $user_id, ':sender_type' => $targetType]);
    
    if ($stmt->rowCount() > 0) {
        // Sent notification, SOFT DELETE
        $update_stmt = $db->prepare("UPDATE notifications SET is_deleted = 1 WHERE id = :notification_id");
        $update_stmt->execute([':notification_id' => $notification_id]);
        
        echo json_encode(['success' => true, 'message' => 'Bildirim silindi (arşivlendi)']);
        exit;
    }
    
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Bildirim bulunamadı veya yetkiniz yok']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>