<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        throw new Exception('Geçersiz istek gövdesi');
    }

    $firstName = $data['firstName'] ?? null;
    $lastName = $data['lastName'] ?? null;
    $email = $data['email'] ?? null;
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;
    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;

    if (!$firstName || !$lastName || !$email || !$password || !$studentId || !$teacherId) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // E-mail unique kontrolü (users tablosunda)
    $checkEmailStmt = $db->prepare("SELECT _id FROM users WHERE email = ? LIMIT 1");
    $checkEmailStmt->execute([$email]);
    if ($checkEmailStmt->fetchColumn()) {
        echo json_encode([
            'success' => false,
            'message' => 'Bu e-posta zaten kayıtlı!'
        ]);
        exit;
    }

    // Öğrenci ID kontrolü
    $checkStudentStmt = $db->prepare("SELECT id FROM ogrenciler WHERE id = ? LIMIT 1");
    $checkStudentStmt->execute([$studentId]);
    if (!$checkStudentStmt->fetchColumn()) {
        echo json_encode([
            'success' => false,
            'message' => 'Öğrenci bulunamadı!'
        ]);
        exit;
    }

    // Veli ID oluştur
    $veliId = bin2hex(random_bytes(12));

    // Şifreyi hashle
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Users tablosuna veli ekle
    $insertUserStmt = $db->prepare("
        INSERT INTO users (_id, firstName, lastName, email, phone, passwordHash, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 'veli', NOW(), NOW())
    ");
    
    $insertUserSuccess = $insertUserStmt->execute([
        $veliId,
        $firstName,
        $lastName,
        $email,
        $phone,
        $passwordHash
    ]);

    if (!$insertUserSuccess) {
        throw new Exception('Kullanıcı oluşturulamadı');
    }

    // Öğrenci-veli ilişkisini kaydet (ogrenciler tablosuna veli_id ekle)
    // Önce ogrenciler tablosunda veli_id kolonu var mı kontrol et, yoksa ekle
    try {
        $checkColumnStmt = $db->query("SHOW COLUMNS FROM ogrenciler LIKE 'veli_id'");
        if ($checkColumnStmt->rowCount() === 0) {
            // veli_id kolonu yoksa ekle
            $db->exec("ALTER TABLE ogrenciler ADD COLUMN veli_id VARCHAR(24) NULL AFTER ogretmen_id");
            $db->exec("ALTER TABLE ogrenciler ADD INDEX idx_veli_id (veli_id)");
        }
    } catch (Exception $e) {
        // Kolon zaten varsa veya başka bir hata varsa devam et
    }

    // Öğrenciye veli ID'sini ekle
    $updateStudentStmt = $db->prepare("UPDATE ogrenciler SET veli_id = ? WHERE id = ?");
    $updateStudentSuccess = $updateStudentStmt->execute([$veliId, $studentId]);

    if (!$updateStudentSuccess) {
        // Users tablosundan veliyi sil (rollback)
        $db->prepare("DELETE FROM users WHERE _id = ?")->execute([$veliId]);
        throw new Exception('Öğrenci-veli ilişkisi kaydedilemedi');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Veli başarıyla oluşturuldu',
        'id' => $veliId
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

