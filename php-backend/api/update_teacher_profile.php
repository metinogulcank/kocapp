<?php
ob_start();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!$data || !isset($data->id)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik veri: id gerekli'
        ]);
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    // Güncellenecek alanları hazırla
    $fields = [];
    $params = [];

    if (isset($data->firstName)) {
        $fields[] = "firstName = ?";
        $params[] = $data->firstName;
    }
    if (isset($data->lastName)) {
        $fields[] = "lastName = ?";
        $params[] = $data->lastName;
    }
    if (isset($data->email)) {
        $fields[] = "email = ?";
        $params[] = $data->email;
    }
    if (isset($data->phone)) {
        $fields[] = "phone = ?";
        $params[] = $data->phone;
    }
    if (isset($data->branch)) {
        $fields[] = "branch = ?";
        $params[] = $data->branch;
    }
    if (isset($data->yok_atlas_link)) {
        $fields[] = "yok_atlas_link = ?";
        $params[] = $data->yok_atlas_link;
    }
    
    // Şifre güncelleme
    if (isset($data->newPassword) && !empty($data->newPassword)) {
        $passwordHash = password_hash($data->newPassword, PASSWORD_BCRYPT);
        $fields[] = "passwordHash = ?";
        $params[] = $passwordHash;
    }

    if (empty($fields)) {
        echo json_encode([
            'success' => true,
            'message' => 'Güncellenecek alan yok'
        ]);
        exit;
    }

    $params[] = $data->id;
    $query = "UPDATE users SET " . implode(", ", $fields) . ", updatedAt = NOW() WHERE _id = ?";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode([
            'success' => true,
            'message' => 'Profil başarıyla güncellendi'
        ]);
    } else {
        throw new Exception("Güncelleme başarısız");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
