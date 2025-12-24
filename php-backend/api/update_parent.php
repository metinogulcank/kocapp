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

    $id = $data['_id'] ?? null;
    $firstName = $data['firstName'] ?? null;
    $lastName = $data['lastName'] ?? null;
    $email = $data['email'] ?? null;
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null; // Optional

    if (!$id || !$firstName || !$lastName || !$email) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // E-mail unique kontrolü (kendi e-postası hariç)
    $checkEmailStmt = $db->prepare("SELECT _id FROM users WHERE email = ? AND _id != ? LIMIT 1");
    $checkEmailStmt->execute([$email, $id]);
    if ($checkEmailStmt->fetchColumn()) {
        echo json_encode([
            'success' => false,
            'message' => 'Bu e-posta başka bir kullanıcı tarafından kullanılıyor!'
        ]);
        exit;
    }

    // Güncelleme sorgusunu hazırla
    $query = "UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, updatedAt = NOW()";
    $params = [$firstName, $lastName, $email, $phone];

    // Şifre varsa ekle
    if (!empty($password)) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $query .= ", passwordHash = ?";
        $params[] = $passwordHash;
    }

    $query .= " WHERE _id = ?";
    $params[] = $id;

    $stmt = $db->prepare($query);
    $success = $stmt->execute($params);

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Veli bilgileri güncellendi'
        ]);
    } else {
        throw new Exception('Güncelleme başarısız');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>