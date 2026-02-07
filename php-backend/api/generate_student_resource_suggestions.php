<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
if (!$db) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'Veritabanı bağlantı hatası']); exit; }
try {
    $studentId = isset($_GET['studentId']) ? trim($_GET['studentId']) : '';
    $teacherId = isset($_GET['teacherId']) ? trim($_GET['teacherId']) : '';
    $dersId = isset($_GET['dersId']) ? trim($_GET['dersId']) : '';
    if ($studentId === '' || $teacherId === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Eksik parametreler']); exit; }
    $resources = [];
    if ($dersId !== '') {
        $db->exec("CREATE TABLE IF NOT EXISTS ders_kaynaklari (id INT AUTO_INCREMENT PRIMARY KEY, ders_id VARCHAR(24) NOT NULL, kaynak_adi VARCHAR(255) NOT NULL, kaynak_tipi VARCHAR(32) DEFAULT 'kitap', kaynak_url VARCHAR(1024) DEFAULT '', seviye VARCHAR(16) DEFAULT 'orta', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        $stmt = $db->prepare("SELECT kaynak_adi, kaynak_tipi, kaynak_url, seviye FROM ders_kaynaklari WHERE ders_id = ? ORDER BY created_at DESC, id DESC");
        $stmt->execute([$dersId]);
        $resources = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
    $summary = ['studentId'=>$studentId,'dersId'=>$dersId,'catalog'=>$resources];
    $apiKey = getenv('OPENAI_API_KEY');
    if (!$apiKey || $apiKey === '') {
        try {
            $stmtKey = $db->prepare("SELECT value FROM system_settings WHERE name = 'OPENAI_API_KEY' LIMIT 1");
            $stmtKey->execute();
            $rowKey = $stmtKey->fetch(PDO::FETCH_ASSOC);
            if ($rowKey && isset($rowKey['value'])) { $apiKey = trim((string)$rowKey['value']); }
            if (!$apiKey || $apiKey === '') {
                $stmtKey2 = $db->prepare("SELECT value FROM system_settings WHERE name = 'openai_api_key' LIMIT 1");
                $stmtKey2->execute();
                $rowKey2 = $stmtKey2->fetch(PDO::FETCH_ASSOC);
                if ($rowKey2 && isset($rowKey2['value'])) { $apiKey = trim((string)$rowKey2['value']); }
            }
        } catch (Exception $ignore) {}
        if (!$apiKey || $apiKey === '' || strlen($apiKey) < 20) { echo json_encode(['success'=>false,'message'=>'AI anahtarı tanımlı değil']); exit; }
    }
    $prompt = "Öğrenci için ders kaynak önerileri üret. Mevcut katalog verildiyse içinden uygun seviyede 3-5 öneri seç. Biçim kuralları: Markdown kullanma, her öneriyi ayrı satırda '• ' ile başlat, kısa ve net ol.\nVeri:\n".json_encode($summary, JSON_UNESCAPED_UNICODE);
    $payload = ['model'=>'gpt-4o-mini','messages'=>[['role'=>'system','content'=>'Sen bir eğitim koçusun. Kısa ve net kaynak önerileri ver.' ],['role'=>'user','content'=>$prompt]],'temperature'=>0.6,'max_tokens'=>300];
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer '.$apiKey, 'Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($response === false) { $err = curl_error($ch); curl_close($ch); http_response_code(502); echo json_encode(['success'=>false,'message'=>'AI isteği başarısız','error'=>$err]); exit; }
    curl_close($ch);
    $decoded = json_decode($response, true);
    if (!is_array($decoded) || $httpCode < 200 || $httpCode >= 300) { http_response_code(502); echo json_encode(['success'=>false,'message'=>'AI yanıtı geçersiz','raw'=>$response]); exit; }
    $text = isset($decoded['choices'][0]['message']['content']) ? trim($decoded['choices'][0]['message']['content']) : '';
    if ($text === '') { echo json_encode(['success'=>false,'message'=>'Öneri üretilemedi']); exit; }
    $text = str_replace(["**","__"],"", $text);
    $text = preg_replace("/\r\n|\r/","\n",$text);
    $lines = explode("\n",$text);
    foreach ($lines as &$line) { $line = preg_replace("/^\s*[-*]\s+/", "• ", $line); $line = preg_replace("/^\s*\d+\.\s+/", "• ", $line); $line = trim($line); }
    unset($line);
    $text = implode("\n",$lines);
    echo json_encode(['success'=>true,'suggestions'=>$text]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Sunucu hatası','error'=>$e->getMessage()]);
}
?>
