<?php
ob_start();
if (ob_get_length()) ob_clean();
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı bağlantısı kurulamadı."]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

// Veri doğrulama
$studentId = $input['studentId'] ?? null;
$ders = $input['ders'] ?? null;
$changes = $input['konular'] ?? null; // Değişiklik listesi

if (!$studentId || !$ders || !is_array($changes)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Eksik veri: studentId, ders ve konular (array) gereklidir."]);
    exit;
}

try {
    // 1. Dinamik Kolon Kontrolü (student_id vs ogrenci_id)
    $colsStmt = $db->query("DESCRIBE ogrenci_konu_ilerlemesi");
    $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $hasOgrenciId = in_array('ogrenci_id', $cols);
    $hasStudentId = in_array('student_id', $cols);

    // Okuma işlemi için birini seç (tercihen ogrenci_id)
    $readIdCol = $hasOgrenciId ? 'ogrenci_id' : ($hasStudentId ? 'student_id' : null);
    
    if (!$readIdCol) {
        throw new Exception("Tablo yapısı uyumsuz (ogrenci_id veya student_id bulunamadı).");
    }

    // 2. Mevcut Veriyi Çek
    $stmtGet = $db->prepare("SELECT konular_json FROM ogrenci_konu_ilerlemesi WHERE $readIdCol = ? AND ders = ? LIMIT 1");
    $stmtGet->execute([$studentId, $ders]);
    $currentJson = $stmtGet->fetchColumn();

    $userDataMap = [];
    if ($currentJson) {
        $decoded = json_decode($currentJson, true);
        if (is_array($decoded)) {
            foreach ($decoded as $item) {
                // ID varsa ID'ye göre, yoksa Konu ismine göre key oluştur
                if (isset($item['id']) && $item['id']) {
                    $userDataMap[$item['id']] = $item;
                } elseif (isset($item['konu'])) {
                    $userDataMap['NAME_' . $item['konu']] = $item;
                }
            }
        }
    }

    // 3. Gelen Değişiklikleri Birleştir (Merge)
    foreach ($changes as $change) {
        $key = null;
        if (isset($change['id']) && $change['id']) {
            $key = $change['id'];
        } elseif (isset($change['konu'])) {
            $key = 'NAME_' . $change['konu'];
        }

        if (!$key) continue; // Tanımsız veri

        if (!isset($userDataMap[$key])) {
            $userDataMap[$key] = [];
        }

        // Alanları güncelle (Sadece gelen alanları değiştir, diğerlerini koru)
        foreach ($change as $field => $value) {
            // Güvenlik: Sadece izin verilen alanları al
            if (in_array($field, ['id', 'konu', 'sira', 'durum', 'tarih', 'kaynaklar'])) {
                 $userDataMap[$key][$field] = $value;
            }
        }
    }

    // 4. Tekrar listeye çevir
    $finalList = array_values($userDataMap);
    $newJson = json_encode($finalList, JSON_UNESCAPED_UNICODE);

    // 5. Kaydet (UPSERT)
    // Hem ogrenci_id hem student_id varsa ikisini de doldur
    $insertCols = ['ders', 'konular_json'];
    $params = [$ders, $newJson];
    
    if ($hasOgrenciId) {
        array_unshift($insertCols, 'ogrenci_id');
        array_unshift($params, $studentId);
    }
    if ($hasStudentId) {
        array_unshift($insertCols, 'student_id');
        array_unshift($params, $studentId);
    }

    $colNames = implode(', ', $insertCols) . ", created_at";
    $placeholders = implode(', ', array_fill(0, count($insertCols), '?')) . ", NOW()";
    
    // ON DUPLICATE KEY UPDATE için her zaman ders ve konular_json güncellenmeli (created_at hariç)
    // ID kolonları zaten key olduğu için update'e gerek yok
    $sql = "INSERT INTO ogrenci_konu_ilerlemesi ($colNames) 
            VALUES ($placeholders) 
            ON DUPLICATE KEY UPDATE konular_json = VALUES(konular_json), updated_at = NOW()";
            
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true, "message" => "Kaydedildi"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Hata: " . $e->getMessage()]);
}
?>