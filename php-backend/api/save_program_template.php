<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $data = json_decode(file_get_contents('php://input'), true);

    $teacherId = $data['teacherId'] ?? null;
    $sablonAdi = $data['sablonAdi'] ?? null;
    $aciklama = $data['aciklama'] ?? null;
    $programs = $data['programs'] ?? [];

    if (!$teacherId || !$sablonAdi || empty($programs)) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // Transaction başlat
    $db->beginTransaction();

    try {
        // Şablonu kaydet (24 karakter)
        $templateId = bin2hex(random_bytes(12));
        $query = "INSERT INTO program_sablonlari (id, ogretmen_id, sablon_adi, aciklama) 
                  VALUES (?, ?, ?, ?)";
        $stmt = $db->prepare($query);
        $stmt->execute([$templateId, $teacherId, $sablonAdi, $aciklama]);

        // Program detaylarını kaydet
        $detailQuery = "INSERT INTO sablon_program_detaylari 
                        (id, sablon_id, gun_no, baslangic_saati, bitis_saati, program_tipi, ders, konu, soru_sayisi) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $detailStmt = $db->prepare($detailQuery);

        foreach ($programs as $program) {
            $detailId = bin2hex(random_bytes(12)); // 24 karakter
            $detailStmt->execute([
                $detailId,
                $templateId,
                $program['gunNo'],
                $program['baslangicSaati'],
                $program['bitisSaati'],
                $program['programTipi'],
                $program['ders'],
                $program['konu'] ?? null,
                $program['soruSayisi'] ?? null
            ]);
        }

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Şablon başarıyla kaydedildi',
            'templateId' => $templateId
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

