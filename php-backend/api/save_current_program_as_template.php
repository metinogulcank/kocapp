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

    $teacherId = $data['teacherId'] ?? null;
    $templateName = $data['templateName'] ?? null;
    $templateDescription = $data['templateDescription'] ?? null;
    $programs = $data['programs'] ?? [];
    $routines = $data['routines'] ?? [];

    if (!$teacherId || !$templateName || (empty($programs) && empty($routines))) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // Transaction başlat
    $db->beginTransaction();

    try {
        // Şablonu kaydet
        $templateId = bin2hex(random_bytes(12));
        $query = "INSERT INTO program_sablonlari (id, ogretmen_id, sablon_adi, aciklama) 
                  VALUES (?, ?, ?, ?)";
        $stmt = $db->prepare($query);
        $stmt->execute([$templateId, $teacherId, $templateName, $templateDescription]);

        // Program detaylarını kaydet
        $detailQuery = "INSERT INTO sablon_program_detaylari 
                        (id, sablon_id, gun_no, baslangic_saati, bitis_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
                $program['kaynak'] ?? null,
                $program['aciklama'] ?? null,
                $program['soruSayisi'] ?? null
            ]);
        }

        // Rutin görevlerini kaydet
        if (!empty($routines)) {
            $routineQuery = "INSERT INTO sablon_rutin_detaylari 
                            (id, sablon_id, gunler, baslangic_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $routineStmt = $db->prepare($routineQuery);

            foreach ($routines as $routine) {
                $routineId = bin2hex(random_bytes(12));
                $gunlerJson = json_encode(array_values($routine['gunler']), JSON_UNESCAPED_UNICODE);
                $routineStmt->execute([
                    $routineId,
                    $templateId,
                    $gunlerJson,
                    $routine['baslangicSaati'],
                    $routine['programTipi'],
                    $routine['ders'],
                    $routine['konu'] ?? null,
                    $routine['kaynak'] ?? null,
                    $routine['aciklama'] ?? null,
                    $routine['soruSayisi'] ?? null
                ]);
            }
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

