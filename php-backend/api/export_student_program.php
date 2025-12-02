<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
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
    $studentId = isset($_GET['studentId']) ? $_GET['studentId'] : null;
    $teacherId = isset($_GET['teacherId']) ? $_GET['teacherId'] : null;
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;

    if (!$studentId || !$teacherId || !$startDate || !$endDate) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $startDateObj = date_create($startDate);
    $endDateObj = date_create($endDate);

    if ($startDateObj === false || $endDateObj === false) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz tarih formatı'
        ]);
        exit;
    }

    $startDateFormatted = $startDateObj->format('Y-m-d');
    $endDateFormatted = $endDateObj->format('Y-m-d');

    $programQuery = "SELECT id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, 
                            program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum, olusturma_tarihi, guncelleme_tarihi
                     FROM ogrenci_programlari
                     WHERE ogrenci_id = :ogrenci_id
                       AND ogretmen_id = :ogretmen_id
                       AND tarih BETWEEN :start_date AND :end_date
                     ORDER BY tarih ASC, baslangic_saati ASC";

    $programStmt = $db->prepare($programQuery);
    $programStmt->execute([
        ':ogrenci_id' => $studentId,
        ':ogretmen_id' => $teacherId,
        ':start_date' => $startDateFormatted,
        ':end_date' => $endDateFormatted
    ]);
    $programsRaw = $programStmt->fetchAll(PDO::FETCH_ASSOC);
    $programs = array_map(function ($program) {
        return [
            'id' => $program['id'],
            'ogrenci_id' => $program['ogrenci_id'],
            'ogretmen_id' => $program['ogretmen_id'],
            'routine_id' => $program['routine_id'],
            'tarih' => $program['tarih'],
            'baslangic_saati' => $program['baslangic_saati'],
            'bitis_saati' => $program['bitis_saati'],
            'program_tipi' => $program['program_tipi'],
            'ders' => $program['ders'],
            'konu' => $program['konu'],
            'kaynak' => $program['kaynak'],
            'aciklama' => $program['aciklama'],
            'soru_sayisi' => $program['soru_sayisi'] !== null ? (int)$program['soru_sayisi'] : null,
            'durum' => $program['durum'],
            'olusturma_tarihi' => $program['olusturma_tarihi'],
            'guncelleme_tarihi' => $program['guncelleme_tarihi']
        ];
    }, $programsRaw);

    $routineQuery = "SELECT id, ogrenci_id, ogretmen_id, gunler, baslangic_saati, program_tipi, ders, konu, kaynak, soru_sayisi, aktif, olusturma_tarihi, guncelleme_tarihi
                     FROM ogrenci_rutinleri
                     WHERE ogrenci_id = :ogrenci_id
                       AND ogretmen_id = :ogretmen_id";

    $routineStmt = $db->prepare($routineQuery);
    $routineStmt->execute([
        ':ogrenci_id' => $studentId,
        ':ogretmen_id' => $teacherId
    ]);
    $routinesRaw = $routineStmt->fetchAll(PDO::FETCH_ASSOC);
    $routines = array_map(function ($routine) {
        $gunlerDecoded = json_decode($routine['gunler'], true);
        if (!is_array($gunlerDecoded)) {
            $gunlerDecoded = [];
        }

        return [
            'id' => $routine['id'],
            'ogrenci_id' => $routine['ogrenci_id'],
            'ogretmen_id' => $routine['ogretmen_id'],
            'gunler' => array_values($gunlerDecoded),
            'baslangic_saati' => $routine['baslangic_saati'],
            'program_tipi' => $routine['program_tipi'],
            'ders' => $routine['ders'],
            'konu' => $routine['konu'],
            'kaynak' => $routine['kaynak'],
            'soru_sayisi' => $routine['soru_sayisi'] !== null ? (int)$routine['soru_sayisi'] : null,
            'aktif' => (int)$routine['aktif'],
            'olusturma_tarihi' => $routine['olusturma_tarihi'],
            'guncelleme_tarihi' => $routine['guncelleme_tarihi']
        ];
    }, $routinesRaw);

    $exportData = [
        'meta' => [
            'studentId' => $studentId,
            'teacherId' => $teacherId,
            'startDate' => $startDateFormatted,
            'endDate' => $endDateFormatted,
            'generatedAt' => date('c')
        ],
        'programs' => $programs,
        'routines' => $routines
    ];

    $fileName = sprintf(
        'ogrenci_program_%s_%s_%s.json',
        substr($studentId, 0, 8),
        $startDateFormatted,
        $endDateFormatted
    );

    header('Content-Type: application/json; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo json_encode($exportData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>


