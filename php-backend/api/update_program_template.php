<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

    $templateId = $data['templateId'] ?? null;
    $sablonAdi = $data['sablonAdi'] ?? null;
    $aciklama = $data['aciklama'] ?? null;
    $programs = $data['programs'] ?? [];

    if (!$templateId || !$sablonAdi) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $db->beginTransaction();
    try {
        // Şablon başlığını güncelle
        $stmt = $db->prepare("UPDATE program_sablonlari SET sablon_adi = ?, aciklama = ? WHERE id = ?");
        $stmt->execute([$sablonAdi, $aciklama, $templateId]);

        // Eski detayları sil ve yeniden ekle
        $db->prepare("DELETE FROM sablon_program_detaylari WHERE sablon_id = ?")->execute([$templateId]);

        if (!empty($programs)) {
            $detailQuery = "INSERT INTO sablon_program_detaylari (id, sablon_id, gun_no, baslangic_saati, bitis_saati, program_tipi, ders, konu, soru_sayisi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $detailStmt = $db->prepare($detailQuery);
            foreach ($programs as $program) {
                $detailId = bin2hex(random_bytes(12));
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
        }

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Şablon güncellendi']);
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


