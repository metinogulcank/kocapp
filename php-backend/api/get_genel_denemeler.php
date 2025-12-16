<?php
ob_start();
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
    $studentId = isset($_GET['studentId']) ? $_GET['studentId'] : '';

    if (empty($studentId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'studentId gerekli'
        ]);
        exit;
    }

    // Genel denemeleri çek (en yeniden en eskiye)
    $query = "SELECT id, deneme_adi, deneme_tarihi, notlar, sinav_tipi 
              FROM genel_denemeler 
              WHERE student_id = ? 
              ORDER BY deneme_tarihi DESC, olusturma_tarihi DESC";
    $stmt = $db->prepare($query);
    $stmt->execute([$studentId]);
    $denemeler = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Her deneme için ders sonuçlarını ve değerlendirmeyi çek
    $result = [];
    foreach ($denemeler as $deneme) {
        // Ders sonuçlarını çek
        $dersQuery = "SELECT ders, soru_sayisi, dogru, yanlis, bos, net 
                      FROM genel_deneme_ders_sonuclari 
                      WHERE genel_deneme_id = ? 
                      ORDER BY ders ASC";
        $dersStmt = $db->prepare($dersQuery);
        $dersStmt->execute([$deneme['id']]);
        $dersSonuclari = $dersStmt->fetchAll(PDO::FETCH_ASSOC);

        // Ders sonuçlarını formatla
        $formattedDersSonuclari = [];
        foreach ($dersSonuclari as $dersSonuc) {
            $formattedDersSonuclari[$dersSonuc['ders']] = [
                'soruSayisi' => (int)$dersSonuc['soru_sayisi'],
                'dogru' => (int)$dersSonuc['dogru'],
                'yanlis' => (int)$dersSonuc['yanlis'],
                'bos' => (int)$dersSonuc['bos'],
                'net' => (float)$dersSonuc['net']
            ];
        }

        // Değerlendirmeyi çek
        $degerlendirmeQuery = "SELECT zaman_yeterli, odaklanma, kaygi_duzeyi, en_zorlayan_ders, kendini_hissediyorsun 
                               FROM genel_deneme_degerlendirme 
                               WHERE genel_deneme_id = ?";
        $degerlendirmeStmt = $db->prepare($degerlendirmeQuery);
        $degerlendirmeStmt->execute([$deneme['id']]);
        $degerlendirme = $degerlendirmeStmt->fetch(PDO::FETCH_ASSOC);

        $result[] = [
            'id' => $deneme['id'],
            'denemeAdi' => $deneme['deneme_adi'],
            'denemeTarihi' => $deneme['deneme_tarihi'],
            'notlar' => $deneme['notlar'],
            // Do not use `||` here; it casts to bool. Fallback to 'tyt' only when empty/null.
            'sinavTipi' => !empty($deneme['sinav_tipi']) ? $deneme['sinav_tipi'] : 'tyt',
            'dersSonuclari' => $formattedDersSonuclari,
            'degerlendirme' => $degerlendirme ? [
                'zamanYeterli' => (int)$degerlendirme['zaman_yeterli'],
                'odaklanma' => (int)$degerlendirme['odaklanma'],
                'kaygiDuzeyi' => (int)$degerlendirme['kaygi_duzeyi'],
                'enZorlayanDers' => $degerlendirme['en_zorlayan_ders'],
                'kendiniHissediyorsun' => (int)$degerlendirme['kendini_hissediyorsun']
            ] : null
        ];
    }

    echo json_encode([
        'success' => true,
        'denemeler' => $result
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

