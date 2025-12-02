<?php
ob_clean();
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
    $studentId = isset($_GET['studentId']) ? $_GET['studentId'] : null;
    $onlyActive = isset($_GET['active']) ? (int) $_GET['active'] : null;

    if (!$studentId) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $query = "SELECT id, ogrenci_id, ogretmen_id, gunler, baslangic_saati, program_tipi, ders, konu, kaynak, soru_sayisi, aktif, olusturma_tarihi, guncelleme_tarihi
              FROM ogrenci_rutinleri
              WHERE ogrenci_id = :ogrenci_id";

    $params = [':ogrenci_id' => $studentId];

    if ($onlyActive !== null) {
        $query .= " AND aktif = :aktif";
        $params[':aktif'] = $onlyActive;
    }

    $query .= " ORDER BY baslangic_saati ASC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $routines = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $routines = array_map(function ($routine) {
        $routine['gunler'] = json_decode($routine['gunler'], true) ?? [];
        return $routine;
    }, $routines);

    echo json_encode([
        'success' => true,
        'routines' => $routines
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>


