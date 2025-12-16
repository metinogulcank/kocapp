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

    $programId = $data['programId'] ?? null;
    $status = $data['status'] ?? null;
    // 0 değeri de geçerli, bu yüzden array_key_exists kullanıyoruz
    $dogru = array_key_exists('dogru', $data) ? (int)$data['dogru'] : null;
    $yanlis = array_key_exists('yanlis', $data) ? (int)$data['yanlis'] : null;
    $bos = array_key_exists('bos', $data) ? (int)$data['bos'] : null;
    $isRoutineInstance = $data['isRoutineInstance'] ?? false;
    $routineId = $data['routineId'] ?? null;
    $ogrenciId = $data['ogrenciId'] ?? null;
    $targetDate = $data['targetDate'] ?? null;

    if (!$programId || !$status) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $allowedStatuses = ['yapildi', 'eksik_yapildi', 'yapilmadi'];
    if (!in_array($status, $allowedStatuses, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz durum değeri'
        ]);
        exit;
    }

    if ($isRoutineInstance) {
        if (!$routineId || !$ogrenciId || !$targetDate) {
            echo json_encode([
                'success' => false,
                'message' => 'Rutin durumu için eksik parametreler'
            ]);
            exit;
        }

        // Rutin durumunu güncelle
        $query = "INSERT INTO ogrenci_rutin_durumlari (routine_id, ogrenci_id, tarih, durum)
                  VALUES (?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE durum = VALUES(durum)";
        $stmt = $db->prepare($query);
        $success = $stmt->execute([$routineId, $ogrenciId, $targetDate, $status]);

        // Eğer dogru/yanlis/bos değerleri gönderilmişse, ogrenci_programlari tablosunda kayıt oluştur veya güncelle
        if ($success && (array_key_exists('dogru', $data) || array_key_exists('yanlis', $data) || array_key_exists('bos', $data))) {
            // Önce rutin bilgilerini çek
            $routineQuery = "SELECT * FROM ogrenci_rutinleri WHERE id = ?";
            $routineStmt = $db->prepare($routineQuery);
            $routineStmt->execute([$routineId]);
            $routine = $routineStmt->fetch(PDO::FETCH_ASSOC);

            if ($routine) {
                // ogrenci_programlari tablosunda bu rutin programı için kayıt var mı kontrol et
                $checkQuery = "SELECT id FROM ogrenci_programlari WHERE routine_id = ? AND ogrenci_id = ? AND tarih = ?";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->execute([$routineId, $ogrenciId, $targetDate]);
                $existingProgram = $checkStmt->fetch(PDO::FETCH_ASSOC);

                $dogruValue = $dogru !== null ? $dogru : 0;
                $yanlisValue = $yanlis !== null ? $yanlis : 0;
                $bosValue = $bos !== null ? $bos : 0;

                if ($existingProgram) {
                    // Mevcut kaydı güncelle
                    $updateQuery = "UPDATE ogrenci_programlari SET durum = ?, dogru = ?, yanlis = ?, bos = ? WHERE id = ?";
                    $updateStmt = $db->prepare($updateQuery);
                    $success = $updateStmt->execute([$status, $dogruValue, $yanlisValue, $bosValue, $existingProgram['id']]);
                } else {
                    // Yeni kayıt oluştur
                    $programId = bin2hex(random_bytes(12));
                    $insertQuery = "INSERT INTO ogrenci_programlari 
                                   (id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, 
                                    program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum, dogru, yanlis, bos) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    $insertStmt = $db->prepare($insertQuery);
                    $success = $insertStmt->execute([
                        $programId,
                        $ogrenciId,
                        $routine['ogretmen_id'],
                        $routineId,
                        $targetDate,
                        $routine['baslangic_saati'],
                        $routine['baslangic_saati'],
                        $routine['program_tipi'],
                        $routine['ders'],
                        $routine['konu'] ?? null,
                        $routine['kaynak'] ?? null,
                        $routine['aciklama'] ?? null,
                        $routine['soru_sayisi'] ?? null,
                        $status,
                        $dogruValue,
                        $yanlisValue,
                        $bosValue
                    ]);
                }
            }
        }
    } else {
        // Soru çözümü programları için doğru/yanlış/boş değerlerini her zaman güncelle
        // Eğer değerler gönderilmişse (array_key_exists ile kontrol ediyoruz, 0 değeri de geçerli)
        if (array_key_exists('dogru', $data) || array_key_exists('yanlis', $data) || array_key_exists('bos', $data)) {
            $query = "UPDATE ogrenci_programlari SET durum = ?, dogru = ?, yanlis = ?, bos = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            // null değerleri 0 olarak kaydet (çünkü 0 geçerli bir değer)
            $dogruValue = $dogru !== null ? $dogru : 0;
            $yanlisValue = $yanlis !== null ? $yanlis : 0;
            $bosValue = $bos !== null ? $bos : 0;
            
            // Debug için log
            error_log("Updating program $programId with dogru=$dogruValue, yanlis=$yanlisValue, bos=$bosValue, status=$status");
            
            $success = $stmt->execute([$status, $dogruValue, $yanlisValue, $bosValue, $programId]);
            
            if (!$success) {
                $errorInfo = $stmt->errorInfo();
                error_log("Update failed: " . print_r($errorInfo, true));
            }
        } else {
            // Sadece durum güncelle
            $query = "UPDATE ogrenci_programlari SET durum = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $success = $stmt->execute([$status, $programId]);
        }
    }

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Durum güncellendi'
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        echo json_encode([
            'success' => false,
            'message' => 'Durum güncellenemedi: ' . ($errorInfo[2] ?? 'Bilinmeyen hata')
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sunucu hatası: ' . $e->getMessage()
    ]);
}
?>

