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

    $studentId = $data['studentId'] ?? null;
    $teacherId = $data['teacherId'] ?? null;
    $replaceExisting = isset($data['replaceExisting']) ? (bool)$data['replaceExisting'] : true;
    $importData = $data['importData'] ?? null;

    if (!$studentId || !$teacherId || !is_array($importData)) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $programs = isset($importData['programs']) && is_array($importData['programs']) ? $importData['programs'] : [];
    $routines = isset($importData['routines']) && is_array($importData['routines']) ? $importData['routines'] : [];
    $meta = isset($importData['meta']) && is_array($importData['meta']) ? $importData['meta'] : [];

    $startDate = $meta['startDate'] ?? null;
    $endDate = $meta['endDate'] ?? null;

    if (!$startDate || !$endDate) {
        $dates = array_column($programs, 'tarih');
        if (!empty($dates)) {
            sort($dates);
            $startDate = $dates[0];
            $endDate = $dates[count($dates) - 1];
        }
    }

    if (!$startDate || !$endDate) {
        echo json_encode([
            'success' => false,
            'message' => 'İçe aktarılacak program için tarih aralığı belirlenemedi.'
        ]);
        exit;
    }

    $startDateObj = date_create($startDate);
    $endDateObj = date_create($endDate);

    if ($startDateObj === false || $endDateObj === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz tarih formatı'
        ]);
        exit;
    }

    $startDateFormatted = $startDateObj->format('Y-m-d');
    $endDateFormatted = $endDateObj->format('Y-m-d');

    $db->beginTransaction();

    if ($replaceExisting) {
        $deleteProgramsStmt = $db->prepare(
            "DELETE FROM ogrenci_programlari 
             WHERE ogrenci_id = :ogrenci_id 
               AND tarih BETWEEN :start_date AND :end_date"
        );
        $deleteProgramsStmt->execute([
            ':ogrenci_id' => $studentId,
            ':start_date' => $startDateFormatted,
            ':end_date' => $endDateFormatted
        ]);
    }

    foreach ($programs as $program) {
        $tarih = $program['tarih'] ?? null;
        $baslangicSaati = $program['baslangic_saati'] ?? null;
        $bitisSaati = $program['bitis_saati'] ?? null;
        $programTipi = $program['program_tipi'] ?? null;
        $ders = $program['ders'] ?? null;

        if (!$tarih || !$baslangicSaati || !$bitisSaati || !$programTipi || !$ders) {
            continue;
        }

        $id = bin2hex(random_bytes(12));
        $insertProgramStmt = $db->prepare(
            "INSERT INTO ogrenci_programlari 
                (id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum)
             VALUES 
                (:id, :ogrenci_id, :ogretmen_id, NULL, :tarih, :baslangic_saati, :bitis_saati, :program_tipi, :ders, :konu, :kaynak, :aciklama, :soru_sayisi, :durum)"
        );

        $insertProgramStmt->execute([
            ':id' => $id,
            ':ogrenci_id' => $studentId,
            ':ogretmen_id' => $teacherId,
            ':tarih' => $tarih,
            ':baslangic_saati' => $baslangicSaati,
            ':bitis_saati' => $bitisSaati,
            ':program_tipi' => $programTipi,
            ':ders' => $ders,
            ':konu' => $program['konu'] ?? null,
            ':kaynak' => $program['kaynak'] ?? null,
            ':aciklama' => $program['aciklama'] ?? null,
            ':soru_sayisi' => isset($program['soru_sayisi']) ? $program['soru_sayisi'] : null,
            ':durum' => $program['durum'] ?? 'yapilmadi'
        ]);
    }

    if ($replaceExisting) {
        $deleteRoutinesStmt = $db->prepare(
            "DELETE FROM ogrenci_rutinleri 
             WHERE ogrenci_id = :ogrenci_id 
               AND ogretmen_id = :ogretmen_id"
        );
        $deleteRoutinesStmt->execute([
            ':ogrenci_id' => $studentId,
            ':ogretmen_id' => $teacherId
        ]);
    }

    foreach ($routines as $routine) {
        $gunler = isset($routine['gunler']) ? $routine['gunler'] : null;
        $baslangicSaati = $routine['baslangic_saati'] ?? null;
        $programTipi = $routine['program_tipi'] ?? null;
        $ders = $routine['ders'] ?? null;

        if (!is_array($gunler) || empty($gunler) || !$baslangicSaati || !$programTipi || !$ders) {
            continue;
        }

        $routineId = bin2hex(random_bytes(12));
        $insertRoutineStmt = $db->prepare(
            "INSERT INTO ogrenci_rutinleri
                (id, ogrenci_id, ogretmen_id, gunler, baslangic_saati, program_tipi, ders, konu, kaynak, soru_sayisi, aktif)
             VALUES
                (:id, :ogrenci_id, :ogretmen_id, :gunler, :baslangic_saati, :program_tipi, :ders, :konu, :kaynak, :soru_sayisi, :aktif)"
        );

        $insertRoutineStmt->execute([
            ':id' => $routineId,
            ':ogrenci_id' => $studentId,
            ':ogretmen_id' => $teacherId,
            ':gunler' => json_encode(array_values($gunler), JSON_UNESCAPED_UNICODE),
            ':baslangic_saati' => $baslangicSaati,
            ':program_tipi' => $programTipi,
            ':ders' => $ders,
            ':konu' => $routine['konu'] ?? null,
            ':kaynak' => $routine['kaynak'] ?? null,
            ':soru_sayisi' => isset($routine['soru_sayisi']) ? $routine['soru_sayisi'] : null,
            ':aktif' => isset($routine['aktif']) ? (int)$routine['aktif'] : 1
        ]);
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Program başarıyla içe aktarıldı'
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


