<?php
ob_start();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $studentId = isset($_GET['studentId']) ? trim($_GET['studentId']) : null;
    $ders = isset($_GET['ders']) ? trim($_GET['ders']) : null;

    if (!$studentId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametre: studentId gerekli'
        ]);
        exit;
    }

    if ($ders) {
        $query = "SELECT * FROM brans_denemeleri WHERE student_id = ? AND ders = ? ORDER BY deneme_tarihi DESC, olusturma_tarihi DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([$studentId, $ders]);
    } else {
        $query = "SELECT * FROM brans_denemeleri WHERE student_id = ? ORDER BY deneme_tarihi DESC, olusturma_tarihi DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([$studentId]);
    }

    $denemeler = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Konu detaylarını ekle
    $result = [];
    $topicStmt = $db->prepare("SELECT id, konu, sira, dogru, yanlis, bos, yuzde FROM brans_deneme_konu_sonuclari WHERE brans_deneme_id = ? ORDER BY sira ASC, id ASC");
    
    foreach ($denemeler as $deneme) {
        $topicStmt->execute([$deneme['id']]);
        $konular = $topicStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Tip dönüşümleri ve alan adı dönüşümleri
        $result[] = [
            'id' => $deneme['id'],
            'alan' => $deneme['alan'] ?? null,
            'ders' => $deneme['ders'],
            'denemeAdi' => $deneme['deneme_adi'],
            'denemeTarihi' => $deneme['deneme_tarihi'],
            'soruSayisi' => isset($deneme['soru_sayisi']) ? (int)$deneme['soru_sayisi'] : 0,
            'dogru' => isset($deneme['dogru']) ? (int)$deneme['dogru'] : 0,
            'yanlis' => isset($deneme['yanlis']) ? (int)$deneme['yanlis'] : 0,
            'bos' => isset($deneme['bos']) ? (int)$deneme['bos'] : 0,
            'net' => isset($deneme['net']) ? (float)$deneme['net'] : 0,
            'konular' => array_map(function($k) {
                return [
                    'id' => $k['id'],
                    'konu' => $k['konu'],
                    'sira' => isset($k['sira']) ? (int)$k['sira'] : 0,
                    'dogru' => isset($k['dogru']) ? (int)$k['dogru'] : 0,
                    'yanlis' => isset($k['yanlis']) ? (int)$k['yanlis'] : 0,
                    'bos' => isset($k['bos']) ? (int)$k['bos'] : 0,
                    'basariYuzde' => isset($k['yuzde']) ? (float)$k['yuzde'] : 0
                ];
            }, $konular)
        ];
    }

    echo json_encode([
        'success' => true,
        'denemeler' => $result
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
