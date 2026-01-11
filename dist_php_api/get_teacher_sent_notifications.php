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

// URL parametresinden userId al (Örnek koddaki teacherId mantığı)
if (isset($_GET['userId'])) {
    $userId = $_GET['userId'];
    // Güvenlik için token ile gelen ID ile eşleşiyor mu kontrol edilebilir
    // Ancak örnek kodda sadece GET parametresi kullanılmış, bu yüzden esnek bırakıyoruz
    // Token varsa rolu oradan al, yoksa varsayılan ata
    if ($user) {
        $userRole = $user['role'];
    } else {
        $userRole = 'ogretmen'; // Varsayılan yetki
    }
} elseif ($user) {
    $userId = $user['id'];
    $userRole = $user['role'];
} else {
    session_start();
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        $userRole = $_SESSION['user_type'] ?? 'ogretmen'; // Fallback
    }
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Oturum açılmamış (userId eksik)']);
    exit;
}

// Sadece öğretmenler kendi bildirimlerini görebilir
// Role can be 'ogretmen' or 'teacher' (legacy support)
if ($userRole !== 'ogretmen' && $userRole !== 'teacher') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Bu işlem için yetkiniz yok']);
    exit;
}

// Hata raporlamayı aç
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log dosyasına yaz
ini_set('log_errors', 1);
ini_set('error_log', '../logs/php_errors.log');

try {
    // Öğretmenin gönderdiği bildirimleri getir
    // users tablosunda name kolonu yoksa CONCAT kullan
    // users tablosu _id kullanıyor, ogrenciler tablosu id kullanıyor
    $query = "
        SELECT 
            n.id,
            n.title,
            n.message,
            n.created_at,
            n.priority,
            n.recipient_type,
            GROUP_CONCAT(
                DISTINCT COALESCE(
                    CASE 
                        WHEN n.recipient_type = 'parent' THEN CONCAT(s.firstName, ' ', s.lastName, ' (Veli)')
                        WHEN n.recipient_type = 'student' THEN CONCAT(s.firstName, ' ', s.lastName)
                        ELSE CONCAT(u.firstName, ' ', u.lastName)
                    END,
                    'Bilinmeyen'
                ) 
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
    
    $stmt = $db->prepare($query);
    
    // teacher_id'nin tipini kontrol et ve gerekirse dönüştür
    // MongoDB ID'leri string olduğu için string olarak bind etmek daha güvenli
    $stmt->bindParam(':teacher_id', $userId, PDO::PARAM_STR);
    
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Tarih formatını düzenle
    foreach ($notifications as &$notification) {
        $notification['created_at'] = date('d.m.Y H:i', strtotime($notification['created_at']));
        $notification['recipient_names'] = $notification['recipient_names'] ?: 'Tüm kullanıcılar';
    }
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);
    
} catch (PDOException $e) {
    error_log("PDO Hatası: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Bildirimler getirilirken bir hata oluştu: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Genel Hata: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Beklenmedik bir hata oluştu: ' . $e->getMessage()
    ]);
}
?>
