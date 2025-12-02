<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;
    $tarih = $data['tarih'] ?? null;
    $programTipi = $data['programTipi'] ?? null;
    $ders = $data['ders'] ?? null;
    $konu = $data['konu'] ?? null;
    $routineId = $data['routineId'] ?? null;
    $kaynak = $data['kaynak'] ?? null;
    $aciklama = $data['aciklama'] ?? null;
    $soruSayisi = $data['soruSayisi'] ?? null;
    $baslangicSaati = $data['baslangicSaati'] ?? null;
    $bitisSaati = $data['bitisSaati'] ?? null;
    $durum = 'yapilmadi'; // Varsayılan durum, öğretmen güncelleyemez

    if (!$studentId || !$teacherId || !$tarih || !$programTipi || !$ders || !$baslangicSaati || !$bitisSaati) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // ID oluştur (24 karakter)
    $id = bin2hex(random_bytes(12));

    $query = "INSERT INTO ogrenci_programlari 
              (id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        $id,
        $studentId,
        $teacherId,
        $routineId,
        $tarih,
        $baslangicSaati,
        $bitisSaati,
        $programTipi,
        $ders,
        $konu,
        $kaynak,
        $aciklama,
        $soruSayisi,
        $durum
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Program başarıyla kaydedildi',
        'id' => $id
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

