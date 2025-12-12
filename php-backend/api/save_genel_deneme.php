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

function generateId() {
    return bin2hex(random_bytes(12));
}

$database = new Database();
$db = $database->getConnection();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['studentId']) || !isset($data['denemeAdi']) || !isset($data['denemeTarihi'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler: studentId, denemeAdi, denemeTarihi gerekli'
        ]);
        exit;
    }

    if (!isset($data['degerlendirme']) || 
        !isset($data['degerlendirme']['zamanYeterli']) ||
        !isset($data['degerlendirme']['odaklanma']) ||
        !isset($data['degerlendirme']['kaygiDuzeyi']) ||
        !isset($data['degerlendirme']['enZorlayanDers']) ||
        !isset($data['degerlendirme']['kendiniHissediyorsun'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Değerlendirme tamamlanmamış'
        ]);
        exit;
    }

    $id = generateId();
    $studentId = $data['studentId'];
    $denemeAdi = $data['denemeAdi'];
    $denemeTarihi = $data['denemeTarihi'];
    $notlar = isset($data['notlar']) ? $data['notlar'] : '';
    $sinavTipi = isset($data['sinavTipi']) ? $data['sinavTipi'] : 'tyt';
    $dersSonuclari = isset($data['dersSonuclari']) && is_array($data['dersSonuclari']) ? $data['dersSonuclari'] : [];
    $degerlendirme = $data['degerlendirme'];

    // Tarih doğrulama
    $tarihObj = date_create($denemeTarihi);
    if ($tarihObj === false) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz tarih formatı'
        ]);
        exit;
    }
    $denemeTarihi = $tarihObj->format('Y-m-d');

    $db->beginTransaction();

    // Genel deneme kaydet
    $insertQuery = "INSERT INTO genel_denemeler 
                    (id, student_id, deneme_adi, deneme_tarihi, notlar, sinav_tipi) 
                    VALUES (?, ?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([$id, $studentId, $denemeAdi, $denemeTarihi, $notlar, $sinavTipi]);

    // Ders sonuçlarını kaydet
    if (!empty($dersSonuclari)) {
        $insertDersQuery = "INSERT INTO genel_deneme_ders_sonuclari 
                            (id, genel_deneme_id, ders, soru_sayisi, dogru, yanlis, bos, net) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $dersStmt = $db->prepare($insertDersQuery);

        foreach ($dersSonuclari as $dersSonuc) {
            $dersId = generateId();
            $ders = isset($dersSonuc['ders']) ? trim($dersSonuc['ders']) : '';
            if (empty($ders)) continue;

            $soruSayisi = isset($dersSonuc['soruSayisi']) ? (int)$dersSonuc['soruSayisi'] : 0;
            $dogru = isset($dersSonuc['dogru']) ? (int)$dersSonuc['dogru'] : 0;
            $yanlis = isset($dersSonuc['yanlis']) ? (int)$dersSonuc['yanlis'] : 0;
            $bos = isset($dersSonuc['bos']) ? (int)$dersSonuc['bos'] : 0;
            $net = isset($dersSonuc['net']) ? round((float)$dersSonuc['net'], 2) : 0;

            $dersStmt->execute([$dersId, $id, $ders, $soruSayisi, $dogru, $yanlis, $bos, $net]);
        }
    }

    // Değerlendirmeyi kaydet
    $degerlendirmeId = generateId();
    $insertDegerlendirmeQuery = "INSERT INTO genel_deneme_degerlendirme 
                                  (id, genel_deneme_id, zaman_yeterli, odaklanma, kaygi_duzeyi, en_zorlayan_ders, kendini_hissediyorsun) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?)";
    $degerlendirmeStmt = $db->prepare($insertDegerlendirmeQuery);
    $degerlendirmeStmt->execute([
        $degerlendirmeId,
        $id,
        (int)$degerlendirme['zamanYeterli'],
        (int)$degerlendirme['odaklanma'],
        (int)$degerlendirme['kaygiDuzeyi'],
        $degerlendirme['enZorlayanDers'],
        (int)$degerlendirme['kendiniHissediyorsun']
    ]);

    $db->commit();

    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Genel deneme kaydedildi'
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

