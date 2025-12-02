<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $templateId = isset($_GET['templateId']) ? $_GET['templateId'] : null;

    if (!$templateId) {
        echo json_encode([
            'success' => false,
            'message' => 'templateId gerekli'
        ]);
        exit;
    }

    // Şablon temel bilgiler
    $stmt = $db->prepare("SELECT id, ogretmen_id, sablon_adi, aciklama FROM program_sablonlari WHERE id = ? LIMIT 1");
    $stmt->execute([$templateId]);
    $template = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Şablon bulunamadı']);
        exit;
    }

    // Detaylar
    $stmt2 = $db->prepare("SELECT id, gun_no, baslangic_saati, bitis_saati, program_tipi, ders, konu, soru_sayisi FROM sablon_program_detaylari WHERE sablon_id = ? ORDER BY gun_no ASC, baslangic_saati ASC");
    $stmt2->execute([$templateId]);
    $details = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'template' => $template,
        'details' => $details
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>


