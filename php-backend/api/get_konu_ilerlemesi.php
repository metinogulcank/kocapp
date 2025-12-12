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
    $ders = isset($_GET['ders']) ? $_GET['ders'] : null;

    if (!$studentId || !$ders) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler: studentId ve ders gerekli'
        ]);
        exit;
    }

    // Konu ilerlemesini çek
    $query = "SELECT id, konu, sira, durum, tarih 
              FROM ogrenci_konu_ilerlemesi 
              WHERE student_id = ? AND ders = ? 
              ORDER BY sira ASC, id ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$studentId, $ders]);
    $konular = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Her konu için kaynakları çek
    $result = [];
    foreach ($konular as $konu) {
        $kaynakQuery = "SELECT id, kaynak_adi, tamamlandi 
                        FROM ogrenci_konu_kaynaklari 
                        WHERE konu_ilerleme_id = ? 
                        ORDER BY id ASC";
        $kaynakStmt = $db->prepare($kaynakQuery);
        $kaynakStmt->execute([$konu['id']]);
        $kaynaklar = $kaynakStmt->fetchAll(PDO::FETCH_ASSOC);

        $result[] = [
            'id' => $konu['id'],
            'konu' => $konu['konu'],
            'sira' => (int)$konu['sira'],
            'durum' => $konu['durum'],
            'tarih' => $konu['tarih'],
            'kaynaklar' => array_map(function($k) {
                return [
                    'id' => $k['id'],
                    'kaynak_adi' => $k['kaynak_adi'],
                    'tamamlandi' => (bool)$k['tamamlandi']
                ];
            }, $kaynaklar)
        ];
    }

    echo json_encode([
        'success' => true,
        'konular' => $result
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

