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

    if (!$data || !isset($data['studentId']) || !isset($data['ders']) || !isset($data['denemeAdi']) || !isset($data['denemeTarihi'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler: studentId, ders, denemeAdi, denemeTarihi gerekli'
        ]);
        exit;
    }

    $id = isset($data['id']) ? $data['id'] : generateId();
    $studentId = $data['studentId'];
    $alan = isset($data['alan']) ? $data['alan'] : null;
    $ders = $data['ders'];
    $denemeAdi = $data['denemeAdi'];
    $denemeTarihi = $data['denemeTarihi'];

    $soruSayisi = isset($data['soruSayisi']) ? (int)$data['soruSayisi'] : 0;
    $dogru = isset($data['dogru']) ? (int)$data['dogru'] : 0;
    $yanlis = isset($data['yanlis']) ? (int)$data['yanlis'] : 0;
    $bos = isset($data['bos']) ? (int)$data['bos'] : 0;
    $konular = isset($data['konular']) && is_array($data['konular']) ? $data['konular'] : [];

    $net = $dogru - ($yanlis * 0.25);
    $net = round($net, 2);

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

    // Insert or update deneme
    $exists = false;
    if (isset($data['id'])) {
        $checkStmt = $db->prepare("SELECT id FROM brans_denemeleri WHERE id = ? AND student_id = ?");
        $checkStmt->execute([$data['id'], $studentId]);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    if ($exists) {
        $updateQuery = "UPDATE brans_denemeleri 
                        SET alan = ?, ders = ?, deneme_adi = ?, deneme_tarihi = ?, soru_sayisi = ?, dogru = ?, yanlis = ?, bos = ?, net = ? 
                        WHERE id = ? AND student_id = ?";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([$alan, $ders, $denemeAdi, $denemeTarihi, $soruSayisi, $dogru, $yanlis, $bos, $net, $id, $studentId]);

        // Eski konu sonuçlarını sil
        $delTopics = $db->prepare("DELETE FROM brans_deneme_konu_sonuclari WHERE brans_deneme_id = ?");
        $delTopics->execute([$id]);
    } else {
        $insertQuery = "INSERT INTO brans_denemeleri 
                        (id, student_id, alan, ders, deneme_adi, deneme_tarihi, soru_sayisi, dogru, yanlis, bos, net) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->execute([$id, $studentId, $alan, $ders, $denemeAdi, $denemeTarihi, $soruSayisi, $dogru, $yanlis, $bos, $net]);
    }

    // Konu sonuçları ekle
    if (!empty($konular)) {
        $insertTopicQuery = "INSERT INTO brans_deneme_konu_sonuclari 
            (id, brans_deneme_id, konu, sira, dogru, yanlis, bos, yuzde) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $topicStmt = $db->prepare($insertTopicQuery);

        foreach ($konular as $idx => $konu) {
            $konuId = generateId();
            $konuAdi = isset($konu['konu']) ? trim($konu['konu']) : '';
            if (empty($konuAdi)) continue;
            
            $sira = isset($konu['sira']) ? (int)$konu['sira'] : ($idx + 1);
            $kDogru = isset($konu['dogru']) ? (int)$konu['dogru'] : 0;
            $kYanlis = isset($konu['yanlis']) ? (int)$konu['yanlis'] : 0;
            $kBos = isset($konu['bos']) ? (int)$konu['bos'] : 0;
            $toplam = $kDogru + $kYanlis + $kBos;
            
            // Başarı yüzdesi hesapla veya gelen değeri kullan
            $yuzde = 0;
            if (isset($konu['basariYuzde']) && is_numeric($konu['basariYuzde'])) {
                $yuzde = round((float)$konu['basariYuzde'], 2);
            } else if ($toplam > 0) {
                $yuzde = round(($kDogru / $toplam) * 100, 2);
            }

            $topicStmt->execute([$konuId, $id, $konuAdi, $sira, $kDogru, $kYanlis, $kBos, $yuzde]);
        }
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'id' => $id,
        'net' => $net,
        'message' => 'Branş denemesi kaydedildi'
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
