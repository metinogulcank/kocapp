<?php
ob_start();

// Hata ayıklama için geçici olarak tüm çıktıları temizleyelim
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 3600');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

try {
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametre: id gerekli'
        ]);
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT _id as id, firstName, lastName, email, phone, role, profilePhoto, branch, yok_atlas_link FROM users WHERE _id = ? LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Hata ayıklama için sorguyu ve ID'yi kontrol edelim
        error_log("Kullanıcı bulunamadı: ID = " . $id);
        http_response_code(200); // 404 yerine 200 dönüp hata mesajı verelim (CORS için bazen daha güvenli)
        echo json_encode([
            'success' => false,
            'message' => 'Kullanıcı bulunamadı (ID: ' . $id . ')'
        ]);
        exit;
    }

    // Frontend _id beklediği için ekliyoruz
    $user['success'] = true;
    $user['_id'] = $user['id'];

    echo json_encode($user);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
