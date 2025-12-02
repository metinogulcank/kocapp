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

    $programId = $data['programId'] ?? null;
    $tarih = $data['tarih'] ?? null;
    $programTipi = $data['programTipi'] ?? null;
    $ders = $data['ders'] ?? null;
    $konu = $data['konu'] ?? null;
    $kaynak = $data['kaynak'] ?? null;
    $aciklama = $data['aciklama'] ?? null;
    $soruSayisi = $data['soruSayisi'] ?? null;
    $baslangicSaati = $data['baslangicSaati'] ?? null;
    $bitisSaati = $data['bitisSaati'] ?? null;
    // Öğretmen programı güncellediğinde durum otomatik olarak 'yapilmadi' olsun
    $durum = $data['durum'] ?? 'yapilmadi';

    if (!$programId || !$tarih || !$programTipi || !$ders || !$baslangicSaati || !$bitisSaati) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // Saat formatını HH:MM:SS şekline zorla
    if (strlen($baslangicSaati) === 5) {
        $baslangicSaati .= ':00';
    }
    if (strlen($bitisSaati) === 5) {
        $bitisSaati .= ':00';
    }

    $query = "UPDATE ogrenci_programlari 
              SET tarih = ?, baslangic_saati = ?, bitis_saati = ?, program_tipi = ?, ders = ?, konu = ?, kaynak = ?, aciklama = ?, soru_sayisi = ?, durum = ? 
              WHERE id = ?";
    
    $stmt = $db->prepare($query);
    $success = $stmt->execute([
        $tarih,
        $baslangicSaati,
        $bitisSaati,
        $programTipi,
        $ders,
        $konu,
        $kaynak,
        $aciklama,
        $soruSayisi,
        $durum,
        $programId
    ]);

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Program başarıyla güncellendi'
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        echo json_encode([
            'success' => false,
            'message' => 'Program güncellenemedi: ' . ($errorInfo[2] ?? 'Bilinmeyen hata')
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

