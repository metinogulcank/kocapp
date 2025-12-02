<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;
    $startDate = $data['startDate'] ?? null;

    if (!$templateId || !$studentId || !$teacherId || !$startDate) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    // Şablon detaylarını getir
    $query = "SELECT * FROM sablon_program_detaylari WHERE sablon_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$templateId]);
    $templatePrograms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Şablon rutin detaylarını getir
    $routineQuery = "SELECT * FROM sablon_rutin_detaylari WHERE sablon_id = ?";
    $routineStmt = $db->prepare($routineQuery);
    $routineStmt->execute([$templateId]);
    $templateRoutines = $routineStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($templatePrograms) && empty($templateRoutines)) {
        echo json_encode([
            'success' => false,
            'message' => 'Şablon bulunamadı veya boş'
        ]);
        exit;
    }

    // Transaction başlat
    $db->beginTransaction();

    try {
        $startDateObj = new DateTime($startDate);
        
        // Her program detayı için öğrenci programı oluştur
        $insertQuery = "INSERT INTO ogrenci_programlari 
                        (id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $db->prepare($insertQuery);

        foreach ($templatePrograms as $templateProgram) {
            // Haftanın gününü hesapla (1=Pazartesi, 7=Pazar)
            $dayNo = $templateProgram['gun_no'];
            $daysToAdd = $dayNo - 1; // Pazartesi = 0 gün ekle
            
            $programDate = clone $startDateObj;
            $programDate->modify("+{$daysToAdd} days");
            $tarih = $programDate->format('Y-m-d');

            $programId = bin2hex(random_bytes(12)); // 24 karakter
            $insertStmt->execute([
                $programId,
                $studentId,
                $teacherId,
                null,
                $tarih,
                $templateProgram['baslangic_saati'],
                $templateProgram['bitis_saati'],
                $templateProgram['program_tipi'],
                $templateProgram['ders'],
                $templateProgram['konu'],
                $templateProgram['kaynak'] ?? null,
                $templateProgram['aciklama'] ?? null,
                $templateProgram['soru_sayisi'],
                'yapilmadi'
            ]);
        }

        // Rutin görevlerini ekle
        if (!empty($templateRoutines)) {
            $routineInsertQuery = "INSERT INTO ogrenci_rutinleri
                                  (id, ogrenci_id, ogretmen_id, gunler, baslangic_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, aktif)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $routineInsertStmt = $db->prepare($routineInsertQuery);

            foreach ($templateRoutines as $templateRoutine) {
                $routineId = bin2hex(random_bytes(12));
                $routineInsertStmt->execute([
                    $routineId,
                    $studentId,
                    $teacherId,
                    $templateRoutine['gunler'],
                    $templateRoutine['baslangic_saati'],
                    $templateRoutine['program_tipi'],
                    $templateRoutine['ders'],
                    $templateRoutine['konu'] ?? null,
                    $templateRoutine['kaynak'] ?? null,
                    $templateRoutine['aciklama'] ?? null,
                    $templateRoutine['soru_sayisi'] ?? null,
                    1 // aktif
                ]);
            }
        }

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Şablon başarıyla uygulandı',
            'count' => count($templatePrograms),
            'routineCount' => count($templateRoutines)
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

