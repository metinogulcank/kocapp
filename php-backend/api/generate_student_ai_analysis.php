<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';

$db = (new Database())->getConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']);
    exit;
}

try {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS system_settings (
            name VARCHAR(64) PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $ignore) {}

    $studentId = isset($_GET['studentId']) ? trim($_GET['studentId']) : '';
    $teacherId = isset($_GET['teacherId']) ? trim($_GET['teacherId']) : '';
    $weekStart = isset($_GET['weekStart']) ? trim($_GET['weekStart']) : '';

    if ($studentId === '' || $teacherId === '' || $weekStart === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Eksik parametreler']);
        exit;
    }

    $weekStartDate = date_create($weekStart);
    if ($weekStartDate === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Geçersiz hafta başlangıcı']);
        exit;
    }
    $startDateStr = $weekStartDate->format('Y-m-d');
    $endDate = clone $weekStartDate;
    $endDate->modify('+6 days');
    $endDateStr = $endDate->format('Y-m-d');

    $stmt = $db->prepare("SELECT id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum, dogru, yanlis, bos
                          FROM ogrenci_programlari
                          WHERE ogrenci_id = ? AND tarih BETWEEN ? AND ?
                          ORDER BY tarih ASC, baslangic_saati ASC");
    $stmt->execute([$studentId, $startDateStr, $endDateStr]);
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $total = count($programs);
    $done = 0;
    $partial = 0;
    $notDone = 0;
    $totalDogru = 0;
    $totalYanlis = 0;
    $totalBos = 0;
    $subjectStats = [];

    foreach ($programs as $p) {
        $durum = $p['durum'] ?: 'yapilmadi';
        if ($durum === 'yapildi') $done++;
        elseif ($durum === 'eksik_yapildi') $partial++;
        else $notDone++;

        $ders = $p['ders'] ?: '';
        if ($ders !== '') {
            if (!isset($subjectStats[$ders])) {
                $subjectStats[$ders] = ['total' => 0, 'done' => 0, 'partial' => 0, 'notDone' => 0, 'dogru' => 0, 'yanlis' => 0, 'bos' => 0];
            }
            $subjectStats[$ders]['total']++;
            if ($durum === 'yapildi') $subjectStats[$ders]['done']++;
            elseif ($durum === 'eksik_yapildi') $subjectStats[$ders]['partial']++;
            else $subjectStats[$ders]['notDone']++;
        }

        if ($p['program_tipi'] === 'soru_cozum' || $p['program_tipi'] === 'deneme') {
            $d = is_null($p['dogru']) ? 0 : intval($p['dogru']);
            $y = is_null($p['yanlis']) ? 0 : intval($p['yanlis']);
            $b = is_null($p['bos']) ? 0 : intval($p['bos']);
            $totalDogru += $d;
            $totalYanlis += $y;
            $totalBos += $b;
            if ($ders !== '') {
                $subjectStats[$ders]['dogru'] += $d;
                $subjectStats[$ders]['yanlis'] += $y;
                $subjectStats[$ders]['bos'] += $b;
            }
        }
    }

    $summary = [
        'weekStart' => $startDateStr,
        'weekEnd' => $endDateStr,
        'totalPrograms' => $total,
        'completed' => $done,
        'partial' => $partial,
        'notCompleted' => $notDone,
        'dogru' => $totalDogru,
        'yanlis' => $totalYanlis,
        'bos' => $totalBos,
        'subjects' => $subjectStats
    ];

    $apiKey = getenv('OPENAI_API_KEY');
    if (!$apiKey || $apiKey === '') {
        try {
            $stmtKey = $db->prepare("SELECT value FROM system_settings WHERE name = 'OPENAI_API_KEY' LIMIT 1");
            $stmtKey->execute();
            $rowKey = $stmtKey->fetch(PDO::FETCH_ASSOC);
            if ($rowKey && isset($rowKey['value'])) {
                $apiKey = trim((string)$rowKey['value']);
            }
            if (!$apiKey || $apiKey === '') {
                $stmtKey2 = $db->prepare("SELECT value FROM system_settings WHERE name = 'openai_api_key' LIMIT 1");
                $stmtKey2->execute();
                $rowKey2 = $stmtKey2->fetch(PDO::FETCH_ASSOC);
                if ($rowKey2 && isset($rowKey2['value'])) {
                    $apiKey = trim((string)$rowKey2['value']);
                }
            }
        } catch (Exception $ignore) {}
        if (!$apiKey || $apiKey === '' || strlen($apiKey) < 20) {
            echo json_encode(['success' => false, 'message' => 'AI anahtarı tanımlı değil']);
            exit;
        }
    }

    $prompt = "Aşağıdaki haftalık öğrenci çalışma özetine göre kısa, net ve motive edici bir Türkçe analiz yaz.\nBiçim kuralları:\n- Markdown işaretleri kullanma (bold, italik, **, __, # yok)\n- Başlıkları düz metin yaz\n- Maddeleri '• ' ile başlat, her madde yeni satırda olsun\n- 3-5 madde sınırını koru\n\nÖzet:\n" . json_encode($summary, JSON_UNESCAPED_UNICODE);

    $payload = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => 'Sen bir eğitim koçusun. Kısa ve motive edici geri bildirim ver.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 400
    ];

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($response === false) {
        $err = curl_error($ch);
        curl_close($ch);
        http_response_code(502);
        echo json_encode(['success' => false, 'message' => 'AI isteği başarısız', 'error' => $err]);
        exit;
    }
    curl_close($ch);

    $decoded = json_decode($response, true);
    if (!is_array($decoded) || $httpCode < 200 || $httpCode >= 300) {
        http_response_code(502);
        echo json_encode(['success' => false, 'message' => 'AI yanıtı geçersiz', 'raw' => $response]);
        exit;
    }
    $aiText = '';
    if (isset($decoded['choices'][0]['message']['content'])) {
        $aiText = trim($decoded['choices'][0]['message']['content']);
    }
    if ($aiText === '') {
        echo json_encode(['success' => false, 'message' => 'AI analiz üretilemedi']);
        exit;
    }

    // Görünüm düzeltmeleri: markdown izlerini temizle ve madde işaretlerini normalize et
    $aiText = str_replace(["**", "__"], "", $aiText);
    $aiText = preg_replace("/\r\n|\r/", "\n", $aiText);
    $lines = explode("\n", $aiText);
    foreach ($lines as &$line) {
        $line = preg_replace("/^\s*[-*]\s+/", "• ", $line);
        $line = preg_replace("/^\s*\d+\.\s+/", "• ", $line);
        $line = trim($line);
    }
    unset($line);
    $aiText = implode("\n", $lines);

    $weekStartFormatted = $startDateStr;
    $sel = $db->prepare("SELECT id FROM ogrenci_analizleri WHERE ogrenci_id = :ogrenci_id AND ogretmen_id = :ogretmen_id AND hafta_baslangic = :hafta_baslangic LIMIT 1");
    $sel->execute([':ogrenci_id' => $studentId, ':ogretmen_id' => $teacherId, ':hafta_baslangic' => $weekStartFormatted]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $upd = $db->prepare("UPDATE ogrenci_analizleri SET ai_yorumu = :ai_yorumu, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = :id");
        $upd->execute([':ai_yorumu' => $aiText, ':id' => $row['id']]);
        $analysisId = $row['id'];
    } else {
        $analysisId = bin2hex(random_bytes(12));
        $ins = $db->prepare("INSERT INTO ogrenci_analizleri (id, ogrenci_id, ogretmen_id, hafta_baslangic, ai_yorumu) VALUES (:id, :ogrenci_id, :ogretmen_id, :hafta_baslangic, :ai_yorumu)");
        $ins->execute([':id' => $analysisId, ':ogrenci_id' => $studentId, ':ogretmen_id' => $teacherId, ':hafta_baslangic' => $weekStartFormatted, ':ai_yorumu' => $aiText]);
    }

    echo json_encode(['success' => true, 'analysisId' => $analysisId, 'aiComment' => $aiText]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Sunucu hatası', 'error' => $e->getMessage()]);
}
?>
