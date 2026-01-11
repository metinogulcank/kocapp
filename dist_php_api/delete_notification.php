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

require_once 'auth_helper.php';
require_once 'db_connection.php';

// Auth check
$user_id = require_auth();

// Get POST data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->notification_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Notification ID is required']);
    exit;
}

$notification_id = $data->notification_id;

try {
    // Check if the notification belongs to the user (received) or was sent by the user
    // First check user_notifications (received)
    $stmt = $db->prepare("SELECT id FROM user_notifications WHERE notification_id = :notification_id AND user_id = :user_id");
    $stmt->execute([':notification_id' => $notification_id, ':user_id' => $user_id]);
    
    if ($stmt->rowCount() > 0) {
        // It's a received notification, just delete the link (or mark deleted)
        // For now, let's delete the user_notification record
        $delete_stmt = $db->prepare("DELETE FROM user_notifications WHERE notification_id = :notification_id AND user_id = :user_id");
        $delete_stmt->execute([':notification_id' => $notification_id, ':user_id' => $user_id]);
        
        echo json_encode(['success' => true, 'message' => 'Bildirim silindi']);
        exit;
    }
    
    // Check if it was sent by the user (notifications table)
    $stmt = $db->prepare("SELECT id FROM notifications WHERE id = :notification_id AND sender_id = :sender_id");
    $stmt->execute([':notification_id' => $notification_id, ':sender_id' => $user_id]);
    
    if ($stmt->rowCount() > 0) {
        $delete_stmt = $db->prepare("DELETE FROM notifications WHERE id = :notification_id");
        $delete_stmt->execute([':notification_id' => $notification_id]);
        
        echo json_encode(['success' => true, 'message' => 'Bildirim silindi']);
        exit;
    }
    
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Bildirim bulunamadı veya yetkiniz yok']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
