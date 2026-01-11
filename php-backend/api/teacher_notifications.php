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

// Oturum kontrolü
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Oturum açılmamış']);
    exit;
}

$teacher_id = $_SESSION['user_id'];

// Sadece öğretmenler kendi bildirimlerini görebilir
if (($_SESSION['user_type'] ?? 'teacher') !== 'teacher') {
    http_response_code(403);
    echo json_encode(['error' => 'Bu işlem için yetkiniz yok']);
    exit;
}

try {
    // Öğretmenin gönderdiği bildirimleri getir
    $query = "
        SELECT 
            n.id,
            n.title,
            n.message as content,
            n.created_at,
            n.priority,
            n.recipient_type,
            GROUP_CONCAT(
                DISTINCT CASE 
                    WHEN n.recipient_type = 'parent' THEN CONCAT(s.firstName, ' ', s.lastName, ' (Veli)')
                    WHEN n.recipient_type = 'student' THEN CONCAT(s.firstName, ' ', s.lastName)
                    ELSE CONCAT(u.firstName, ' ', u.lastName)
                END
                SEPARATOR ', '
            ) as recipient_names
        FROM notifications n
        LEFT JOIN user_notifications un ON n.id = un.notification_id
        LEFT JOIN users u ON un.user_id = u._id
        LEFT JOIN ogrenciler s ON (
            CASE 
                WHEN n.recipient_type = 'parent' THEN n.recipient_id = s.id 
                WHEN n.recipient_type = 'student' THEN un.user_id = s.id
                ELSE un.user_id = s.id
            END
        )
        WHERE n.sender_id = :teacher_id
        GROUP BY n.id
        ORDER BY n.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute(['teacher_id' => $teacher_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Tarih formatını düzenle
    foreach ($notifications as &$notification) {
        $notification['created_at'] = date('d.m.Y H:i', strtotime($notification['created_at']));
        
        if (!$notification['recipient_names']) {
            if ($notification['recipient_type'] === 'all') {
                $notification['recipient_names'] = 'Tüm kullanıcılar';
            } else {
                $notification['recipient_names'] = 'Silinmiş Kullanıcı';
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Bildirimler getirilirken bir hata oluştu'
    ]);
}