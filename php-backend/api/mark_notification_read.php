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

if ($user) {
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
    echo json_encode(['success' => false, 'error' => 'Oturum açılmamış']);
    exit;
}

// JSON verisini al
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['notification_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'notification_id alanı zorunludur']);
    exit;
}

$notification_id = $input['notification_id'];

try {
    // Kullanıcının bu bildirime erişim hakkı olduğunu kontrol et
    // user_type kontrolü için map'leme yapabiliriz ama şimdilik sadece user_id kontrolü yeterli olabilir
    // Ancak tablodaki user_type önemliyse:
    // Token role: 'ogretmen', 'ogrenci', 'veli'
    // DB user_type: 'teacher', 'student', 'parent' (muhtemelen ingilizce)
    
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
    
    $check_query = "
        SELECT id 
        FROM user_notifications 
        WHERE notification_id = :notification_id 
        AND user_id = :user_id 
        AND user_type = :user_type
    ";
    
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([
        'notification_id' => $notification_id, 
        'user_id' => $userId,
        'user_type' => $targetType
    ]);
    
    if (!$check_stmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Bildirim bulunamadı veya yetkiniz yok']);
        exit;
    }
    
    $update_query = "
        UPDATE user_notifications 
        SET is_read = 1, read_at = NOW() 
        WHERE notification_id = :notification_id 
        AND user_id = :user_id
        AND user_type = :user_type
    ";
    
    $update_stmt = $db->prepare($update_query);
    $update_stmt->execute([
        'notification_id' => $notification_id, 
        'user_id' => $userId,
        'user_type' => $targetType
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Bildirim okundu olarak işaretlendi'
    ]);
    
} catch (Exception $e) {
    error_log("Bildirim okundu işaretleme hatası: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Bildirim güncellenirken hata oluştu: ' . $e->getMessage()]);
}
?>
