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
    
    if (!isset($data['studentId']) || !isset($data['ders']) || !isset($data['konular'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $studentId = $data['studentId'];
    $ders = $data['ders'];
    $konular = $data['konular'];

    $db->beginTransaction();

    // Önce mevcut konuları ve kaynaklarını sil (cascade ile kaynaklar otomatik silinir)
    $deleteQuery = "DELETE FROM ogrenci_konu_ilerlemesi WHERE student_id = ? AND ders = ?";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->execute([$studentId, $ders]);

    // Yeni konuları ekle
    foreach ($konular as $konu) {
        $konuAdi = isset($konu['konu']) ? $konu['konu'] : '';
        $sira = isset($konu['sira']) ? (int)$konu['sira'] : 1;
        $durum = isset($konu['durum']) ? $konu['durum'] : 'Konuya Gelinmedi';
        $tarih = isset($konu['tarih']) && !empty($konu['tarih']) ? $konu['tarih'] : null;

        // Tarih formatını kontrol et
        if ($tarih) {
            $tarihObj = date_create($tarih);
            if ($tarihObj === false) {
                $tarih = null;
            } else {
                $tarih = $tarihObj->format('Y-m-d');
            }
        }

        $insertKonuQuery = "INSERT INTO ogrenci_konu_ilerlemesi 
                            (student_id, ders, konu, sira, durum, tarih) 
                            VALUES (?, ?, ?, ?, ?, ?)";
        $insertKonuStmt = $db->prepare($insertKonuQuery);
        $insertKonuStmt->execute([$studentId, $ders, $konuAdi, $sira, $durum, $tarih]);
        
        $konuIlerlemeId = $db->lastInsertId();

        // Kaynakları ekle
        if (isset($konu['kaynaklar']) && is_array($konu['kaynaklar'])) {
            foreach ($konu['kaynaklar'] as $kaynak) {
                $kaynakAdi = isset($kaynak['kaynak_adi']) ? $kaynak['kaynak_adi'] : '';
                $tamamlandi = isset($kaynak['tamamlandi']) ? (int)$kaynak['tamamlandi'] : 0;

                if (!empty($kaynakAdi)) {
                    $insertKaynakQuery = "INSERT INTO ogrenci_konu_kaynaklari 
                                          (konu_ilerleme_id, kaynak_adi, tamamlandi) 
                                          VALUES (?, ?, ?)";
                    $insertKaynakStmt = $db->prepare($insertKaynakQuery);
                    $insertKaynakStmt->execute([$konuIlerlemeId, $kaynakAdi, $tamamlandi]);
                }
            }
        }
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Konu ilerlemesi kaydedildi'
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

