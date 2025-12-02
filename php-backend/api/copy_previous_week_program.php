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

    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;
    $previousWeekStart = $data['previousWeekStart'] ?? null;
    $previousWeekEnd = $data['previousWeekEnd'] ?? null;
    $currentWeekStart = $data['currentWeekStart'] ?? null;

    if (!$studentId || !$teacherId || !$previousWeekStart || !$previousWeekEnd || !$currentWeekStart) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // Geçen haftanın programlarını getir (rutin olmayanlar)
    $query = "SELECT * FROM ogrenci_programlari 
              WHERE ogrenci_id = ? 
              AND tarih >= ? 
              AND tarih <= ?
              AND routine_id IS NULL
              ORDER BY tarih ASC, baslangic_saati ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$studentId, $previousWeekStart, $previousWeekEnd]);
    $previousPrograms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($previousPrograms)) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçen hafta için program bulunamadı'
        ]);
        exit;
    }

    // Hafta başlangıç tarihlerini hesapla
    $previousStartDate = new DateTime($previousWeekStart);
    $currentStartDate = new DateTime($currentWeekStart);
    $dayDifference = $previousStartDate->diff($currentStartDate)->days;

    // Transaction başlat
    $db->beginTransaction();

    try {
        $insertQuery = "INSERT INTO ogrenci_programlari 
                       (id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $db->prepare($insertQuery);

        foreach ($previousPrograms as $program) {
            // Yeni tarihi hesapla
            $oldDate = new DateTime($program['tarih']);
            $newDate = clone $oldDate;
            $newDate->modify("+{$dayDifference} days");
            $newTarih = $newDate->format('Y-m-d');

            // Yeni ID oluştur
            $newId = bin2hex(random_bytes(12));

            $insertStmt->execute([
                $newId,
                $studentId,
                $teacherId,
                null, // routine_id
                $newTarih,
                $program['baslangic_saati'],
                $program['bitis_saati'],
                $program['program_tipi'],
                $program['ders'],
                $program['konu'],
                $program['kaynak'],
                $program['aciklama'],
                $program['soru_sayisi'],
                $program['durum'] ?? 'yapilmadi' // Önceki haftadaki durum korunur
            ]);
        }

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Geçen haftanın programı başarıyla kopyalandı',
            'copiedCount' => count($previousPrograms)
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

