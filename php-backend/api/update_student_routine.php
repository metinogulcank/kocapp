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

    if (!is_array($data)) {
        throw new Exception('Geçersiz istek gövdesi');
    }

    $routineId = $data['routineId'] ?? null;
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

    if (
        !$routineId ||
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

    $query = "UPDATE ogrenci_rutinleri 
              SET gunler = :gunler,
                  baslangic_saati = :baslangic_saati,
                  program_tipi = :program_tipi,
                  ders = :ders,
                  konu = :konu,
                  kaynak = :kaynak,
                  aciklama = :aciklama,
                  soru_sayisi = :soru_sayisi
              WHERE id = :id AND ogrenci_id = :ogrenci_id AND ogretmen_id = :ogretmen_id";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':gunler' => $gunlerJson,
        ':baslangic_saati' => $baslangicSaatiFormatted,
        ':program_tipi' => $programTipi,
        ':ders' => $ders,
        ':konu' => $konu,
        ':kaynak' => $kaynak,
        ':aciklama' => $aciklama,
        ':soru_sayisi' => $soruSayisi,
        ':id' => $routineId,
        ':ogrenci_id' => $studentId,
        ':ogretmen_id' => $teacherId
    ]);

    if ($stmt->rowCount() === 0) {
        $checkQuery = "SELECT id FROM ogrenci_rutinleri WHERE id = :id AND ogrenci_id = :ogrenci_id AND ogretmen_id = :ogretmen_id LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([
            ':id' => $routineId,
            ':ogrenci_id' => $studentId,
            ':ogretmen_id' => $teacherId
        ]);

        if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                'success' => false,
                'message' => 'Rutin bulunamadı.'
            ]);
            exit;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Rutin başarıyla güncellendi'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>


