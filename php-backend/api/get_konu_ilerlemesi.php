<?php
ob_start();
if (ob_get_length()) ob_clean();

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
$db = (new Database())->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı bağlantısı kurulamadı."]);
    exit;
}

$studentId = isset($_GET['studentId']) ? trim($_GET['studentId']) : '';
$ders = isset($_GET['ders']) ? trim($_GET['ders']) : '';

if ($studentId === '' || $ders === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "studentId ve ders zorunludur"]);
    exit;
}

try {
    // 1. Ders ID'yi bul
    $dersId = null;
    $stmtD = $db->prepare("SELECT id FROM sinav_dersleri WHERE ders_adi COLLATE utf8mb4_turkish_ci = ? LIMIT 1");
    $stmtD->execute([$ders]);
    $dersId = $stmtD->fetchColumn();

    if (!$dersId) {
        // İsim tam eşleşmezse normalizasyon dene
        $normalized = preg_replace('/^(tyt|ayt|lgs|kpss)\s+/i', '', $ders);
        $stmtD2 = $db->prepare("SELECT id FROM sinav_dersleri WHERE ders_adi COLLATE utf8mb4_turkish_ci LIKE ? LIMIT 1");
        $stmtD2->execute(['%' . $normalized . '%']);
        $dersId = $stmtD2->fetchColumn();
    }

    // Eğer ders ID bulunamazsa boş dön
    if (!$dersId) {
        echo json_encode(["success" => true, "konular" => []]);
        exit;
    }
    
    $stmtT = $db->prepare("SELECT id, konu_adi, sira FROM sinav_konulari WHERE ders_id = ? ORDER BY sira ASC, konu_adi ASC");
    $stmtT->execute([$dersId]);
    $masterTopics = $stmtT->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $subtopicsMap = [];
    try {
        $topicIds = array_column($masterTopics, 'id');
        
        if (!empty($topicIds)) {
            $placeholders = str_repeat('?,', count($topicIds) - 1) . '?';
            
            $stmtSub = $db->prepare("
                SELECT id, konu_id, alt_konu_adi 
                FROM sinav_alt_konulari 
                WHERE konu_id IN ($placeholders)
                ORDER BY sira ASC, alt_konu_adi ASC
            ");
            
            $stmtSub->execute($topicIds);
            $subRows = $stmtSub->fetchAll(PDO::FETCH_ASSOC) ?: [];
            
            foreach ($subRows as $sub) {
                $subtopicsMap[$sub['konu_id']][] = [
                    "id" => $sub['id'],
                    "baslik" => $sub['alt_konu_adi']
                ];
            }
        }
    } catch (Exception $e) {}

    $defaultResources = [];
    try {
        $stmtR = $db->prepare("SELECT kaynak_adi FROM ders_kaynaklari WHERE ders_id = ? ORDER BY created_at DESC, id DESC");
        $stmtR->execute([$dersId]);
        $resRows = $stmtR->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($resRows as $r) {
            $defaultResources[] = ["kaynak_adi" => $r['kaynak_adi'], "tamamlandi" => false];
        }
    } catch (Exception $e) {}

    $userTopicsMap = []; 
    $userTopicsMapByName = []; 

    $colsStmt = $db->query("DESCRIBE ogrenci_konu_ilerlemesi");
    $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
    $idCol = in_array('ogrenci_id', $cols) ? 'ogrenci_id' : (in_array('student_id', $cols) ? 'student_id' : null);
    $altIdCol = null;
    if ($idCol === 'ogrenci_id' && in_array('student_id', $cols)) $altIdCol = 'student_id';
    if ($idCol === 'student_id' && in_array('ogrenci_id', $cols)) $altIdCol = 'ogrenci_id';
    $hasJson = in_array('konular_json', $cols);

    if ($idCol && $hasJson) {
        if ($altIdCol) {
            $stmtUser = $db->prepare("SELECT konular_json FROM ogrenci_konu_ilerlemesi WHERE ($idCol = ? OR $altIdCol = ?) AND ders = ? LIMIT 1");
            $stmtUser->execute([$studentId, $studentId, $ders]);
        } else {
            $stmtUser = $db->prepare("SELECT konular_json FROM ogrenci_konu_ilerlemesi WHERE $idCol = ? AND ders = ? LIMIT 1");
            $stmtUser->execute([$studentId, $ders]);
        }
        $json = $stmtUser->fetchColumn();
        if ($json && $json !== '') {
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                foreach ($decoded as $uTopic) {
                    if (isset($uTopic['id']) && $uTopic['id']) {
                        $userTopicsMap[$uTopic['id']] = $uTopic;
                    }
                    if (isset($uTopic['konu'])) {
                        $normalizedName = mb_strtolower(trim(preg_replace('/^[\d]+\.\s*/', '', $uTopic['konu'])), 'UTF-8');
                        $userTopicsMapByName[$normalizedName] = $uTopic;
                    }
                }
            }
        }
    }

    // 4. Birleştirme (Master Data + User Data)
    $finalList = [];
    $i = 0;

    foreach ($masterTopics as $master) {
        $i++;
        $mId = $master['id'];
        $mName = $master['konu_adi'];
        $normalizedMName = mb_strtolower(trim($mName), 'UTF-8');

        // Kullanıcı verisini bulmaya çalış (Önce ID, sonra İsim)
        $userData = null;
        if (isset($userTopicsMap[$mId])) {
            $userData = $userTopicsMap[$mId];
        } elseif (isset($userTopicsMapByName[$normalizedMName])) {
            $userData = $userTopicsMapByName[$normalizedMName];
        }

        // Birleştirilmiş Obje
        $mergedItem = [
            "id" => $mId,
            "konu" => $mName, // İsim her zaman güncel Master'dan
            "subtopics" => $subtopicsMap[$mId] ?? [], // Alt konular her zaman güncel Master'dan
            
            // Kişisel veriler (Varsa User'dan, Yoksa Varsayılan)
            "durum" => $userData['durum'] ?? "Konuya Gelinmedi",
            "sira" => isset($userData['sira']) ? intval($userData['sira']) : intval($master['sira'] ?? $i),
            "tarih" => $userData['tarih'] ?? null,
            "kaynaklar" => (!empty($userData['kaynaklar'])) ? $userData['kaynaklar'] : $defaultResources
        ];

        $finalList[] = $mergedItem;
    }

    // 5. Sıralama (Kullanıcının belirlediği sıraya göre, eşitse orijinal sıraya göre)
    usort($finalList, function($a, $b) {
        return $a['sira'] <=> $b['sira'];
    });

    echo json_encode(["success" => true, "konular" => $finalList]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
} catch (Throwable $t) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Sunucu hatası: " . $t->getMessage()]);
}
?>