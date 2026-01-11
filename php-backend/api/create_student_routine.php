<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

    if (!is_array($data)) {
        throw new Exception('Geçersiz istek gövdesi');
    }

    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;
    $gunler = $data['gunler'] ?? null;
    $baslangicSaati = $data['baslangicSaati'] ?? ($data['saat'] ?? null);
    $programTipi = $data['programTipi'] ?? null;
    $ders = $data['ders'] ?? null;
    $konu = $data['konu'] ?? null;
    $kaynak = $data['kaynak'] ?? null;
    $aciklama = $data['aciklama'] ?? null;
    $soruSayisi = $data['soruSayisi'] ?? null;
    $aktif = array_key_exists('aktif', $data) ? (int) !!$data['aktif'] : 1;

    if (
        !$studentId ||
        !$teacherId ||
        !is_array($gunler) ||
        empty($gunler) ||
        !$baslangicSaati ||
        !$programTipi ||
        !$ders
    ) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // Saat formatını HH:MM:SS şekline zorla
    $baslangicDateTime = date_create($baslangicSaati);
    if ($baslangicDateTime === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Başlangıç saati formatı geçersiz'
        ]);
        exit;
    }
    $baslangicSaatiFormatted = $baslangicDateTime->format('H:i:s');

    $gunlerJson = json_encode(array_values($gunler), JSON_UNESCAPED_UNICODE);
    if ($gunlerJson === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Günler JSON formatına dönüştürülemedi'
        ]);
        exit;
    }

    $id = bin2hex(random_bytes(12));

    $query = "INSERT INTO ogrenci_rutinleri
        (id, ogrenci_id, ogretmen_id, gunler, baslangic_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, aktif)
        VALUES (:id, :ogrenci_id, :ogretmen_id, :gunler, :baslangic_saati, :program_tipi, :ders, :konu, :kaynak, :aciklama, :soru_sayisi, :aktif)";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $id,
        ':ogrenci_id' => $studentId,
        ':ogretmen_id' => $teacherId,
        ':gunler' => $gunlerJson,
        ':baslangic_saati' => $baslangicSaatiFormatted,
        ':program_tipi' => $programTipi,
        ':ders' => $ders,
        ':konu' => $konu,
        ':kaynak' => $kaynak,
        ':aciklama' => $aciklama,
        ':soru_sayisi' => $soruSayisi,
        ':aktif' => $aktif
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Rutin başarıyla oluşturuldu',
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


