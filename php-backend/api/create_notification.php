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

// Şema düzeltmeleri (Otomatik migration)
try {
    // notifications.sender_id kontrolü
    $stmt = $db->query("DESCRIBE notifications sender_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && stripos($row['Type'], 'int') !== false) {
        $db->exec("ALTER TABLE notifications MODIFY sender_id VARCHAR(255)");
    }
    
    // notifications.recipient_id kontrolü
    $stmt = $db->query("DESCRIBE notifications recipient_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && stripos($row['Type'], 'int') !== false) {
        $db->exec("ALTER TABLE notifications MODIFY recipient_id VARCHAR(255)");
    }
    
    // user_notifications.user_id kontrolü
    $stmt = $db->query("DESCRIBE user_notifications user_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && stripos($row['Type'], 'int') !== false) {
        $db->exec("ALTER TABLE user_notifications MODIFY user_id VARCHAR(255)");
    }
} catch (Exception $e) {
    // Şema hatası olursa logla ama devam et (belki yetki yoktur vs)
    error_log("Schema fix error: " . $e->getMessage());
}

// Oturum/Token kontrolü
$user = getAuthUser();
$userId = null;
$userRole = null;

// Input'tan userId al (Eğer varsa)
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['userId'])) {
    $userId = $input['userId'];
    if ($user) {
        $userRole = $user['role'];
    } else {
        $userRole = 'ogretmen'; // Varsayılan
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

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Geçersiz veri formatı']);
    exit;
}

// Gerekli alanları kontrol et
$required_fields = ['title', 'message', 'recipient_type', 'type'];
foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "{$field} alanı zorunludur"]);
        exit;
    }
}

$sender_id = $userId;
// Map user role to sender type
$sender_type = 'teacher';
if ($userRole === 'admin') $sender_type = 'admin';
// 'ogretmen' -> 'teacher' is default

$title = trim($input['title']);
$message = trim($input['message']);
$recipient_type = $input['recipient_type']; // 'student', 'parent', 'class', 'all'
$recipient_id = $input['recipient_id'] ?? null;
$type = $input['type']; // 'announcement', 'reminder', 'exam', 'homework', 'meeting'
$priority = $input['priority'] ?? 'medium';
$scheduled_at = $input['scheduled_at'] ?? null;

try {
    $db->beginTransaction();
    
    // Bildirimi oluştur
    $notification_query = "
        INSERT INTO notifications 
        (sender_id, sender_type, recipient_type, recipient_id, title, message, type, priority, scheduled_at, created_at) 
        VALUES (:sender_id, :sender_type, :recipient_type, :recipient_id, :title, :message, :type, :priority, :scheduled_at, NOW())
    ";
    // Not: 'message' kolonu kullanılıyor (eski 'content' yerine)
    
    $stmt = $db->prepare($notification_query);
    $stmt->bindParam(':sender_id', $sender_id);
    $stmt->bindParam(':sender_type', $sender_type);
    $stmt->bindParam(':recipient_type', $recipient_type);
    $stmt->bindParam(':recipient_id', $recipient_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':message', $message); // 'message' kolonuna gidecek
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':priority', $priority);
    $stmt->bindParam(':scheduled_at', $scheduled_at);
    $stmt->execute();
    
    $notification_id = $db->lastInsertId();
    
    // Alıcılara göre kullanıcı bildirimleri oluştur
    $user_ids = [];
    
    if ($recipient_type === 'student' && $recipient_id) {
        // Belirli bir öğrenciye
        $user_ids[] = ['user_id' => $recipient_id, 'user_type' => 'student'];
        
        // Velisine de gönder (varsa)
        $parent_query = "SELECT veli_id FROM ogrenciler WHERE id = :student_id AND veli_id IS NOT NULL";
        $parent_stmt = $db->prepare($parent_query);
        $parent_stmt->bindParam(':student_id', $recipient_id);
        $parent_stmt->execute();
        
        if ($parent = $parent_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $parent['veli_id'], 'user_type' => 'parent'];
        }
        
    } elseif ($recipient_type === 'parent' && $recipient_id) {
        // Belirli bir öğrencinin velisine
        // Frontend'den recipient_id olarak öğrenci ID'si geliyor
        $parent_query = "SELECT veli_id FROM ogrenciler WHERE id = :student_id AND veli_id IS NOT NULL";
        $parent_stmt = $db->prepare($parent_query);
        $parent_stmt->bindParam(':student_id', $recipient_id);
        $parent_stmt->execute();
        
        if ($parent = $parent_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $parent['veli_id'], 'user_type' => 'parent'];
        } else {
             // Veli bulunamadıysa hata dönülebilir veya sessizce geçilebilir
             // Loglamak iyi olur
             error_log("Veli bulunamadı. Öğrenci ID: " . $recipient_id);
        }

    } elseif ($recipient_type === 'class' && $recipient_id) {
        // Belirli bir sınıfa
        $class_query = "
            SELECT DISTINCT o.id as student_id, o.veli_id 
            FROM ogrenciler o 
            WHERE o.sinif_id = :class_id
        ";
        $class_stmt = $db->prepare($class_query);
        $class_stmt->bindParam(':class_id', $recipient_id);
        $class_stmt->execute();
        
        while ($student = $class_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $student['student_id'], 'user_type' => 'student'];
            if ($student['veli_id']) {
                $user_ids[] = ['user_id' => $student['veli_id'], 'user_type' => 'parent'];
            }
        }
        
    } elseif ($recipient_type === 'all_students') {
        // Sadece tüm öğrenciler
        $student_query = "SELECT id FROM ogrenciler";
        $student_stmt = $db->prepare($student_query);
        $student_stmt->execute();
        while ($student = $student_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $student['id'], 'user_type' => 'student'];
        }

    } elseif ($recipient_type === 'all_parents') {
        // Sadece tüm veliler
        $parent_query = "SELECT DISTINCT veli_id FROM ogrenciler WHERE veli_id IS NOT NULL";
        $parent_stmt = $db->prepare($parent_query);
        $parent_stmt->execute();
        while ($parent = $parent_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $parent['veli_id'], 'user_type' => 'parent'];
        }

    } elseif ($recipient_type === 'all') {
        // Tüm kullanıcılara
        // Öğrenciler
        $student_query = "SELECT id FROM ogrenciler";
        $student_stmt = $db->prepare($student_query);
        $student_stmt->execute();
        while ($student = $student_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $student['id'], 'user_type' => 'student'];
        }
        
        // Veliler
        $parent_query = "SELECT DISTINCT veli_id FROM ogrenciler WHERE veli_id IS NOT NULL";
        $parent_stmt = $db->prepare($parent_query);
        $parent_stmt->execute();
        while ($parent = $parent_stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_ids[] = ['user_id' => $parent['veli_id'], 'user_type' => 'parent'];
        }
    }
    
    // Kullanıcı bildirimlerini oluştur
    $user_notification_query = "
        INSERT INTO user_notifications (user_id, user_type, notification_id, is_read) 
        VALUES (:user_id, :user_type, :notification_id, FALSE)
    ";
    
    $user_stmt = $db->prepare($user_notification_query);
    
    foreach ($user_ids as $user) {
        $user_stmt->bindParam(':user_id', $user['user_id']);
        $user_stmt->bindParam(':user_type', $user['user_type']);
        $user_stmt->bindParam(':notification_id', $notification_id);
        $user_stmt->execute();
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Bildirim başarıyla oluşturuldu',
        'notification_id' => $notification_id,
        'recipient_count' => count($user_ids)
    ]);
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    error_log("Bildirim oluşturma hatası: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Bildirim oluşturulurken hata oluştu: ' . $e->getMessage()]);
}
?>
