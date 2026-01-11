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
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

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
    $colsStmt = $db->query("DESCRIBE ogrenci_konu_ilerlemesi");
    $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
    $idCol = in_array('ogrenci_id', $cols) ? 'ogrenci_id' : (in_array('student_id', $cols) ? 'student_id' : null);
    $altIdCol = null;
    if ($idCol === 'ogrenci_id' && in_array('student_id', $cols)) $altIdCol = 'student_id';
    if ($idCol === 'student_id' && in_array('ogrenci_id', $cols)) $altIdCol = 'ogrenci_id';
    $hasJson = in_array('konular_json', $cols);
    if (!$idCol) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Tablo şeması desteklenmiyor"]);
        exit;
    }
    $konular = [];
    if ($hasJson) {
        if ($altIdCol) {
            $stmt = $db->prepare("SELECT konular_json FROM ogrenci_konu_ilerlemesi WHERE ($idCol = ? OR $altIdCol = ?) AND ders = ? LIMIT 1");
            $stmt->execute([$studentId, $studentId, $ders]);
        } else {
            $stmt = $db->prepare("SELECT konular_json FROM ogrenci_konu_ilerlemesi WHERE $idCol = ? AND ders = ? LIMIT 1");
            $stmt->execute([$studentId, $ders]);
        }
        $json = $stmt->fetchColumn();
        if ($json && $json !== '') {
            $decoded = json_decode($json, true);
            if (is_array($decoded)) $konular = $decoded;
            usort($konular, function($a, $b) { return (intval($a['sira'] ?? 0)) <=> (intval($b['sira'] ?? 0)); });
        }
    } else {
        $hasKonu = in_array('konu', $cols) && in_array('sira', $cols) && in_array('durum', $cols);
        if ($hasKonu) {
        if ($altIdCol) {
            $stmt = $db->prepare("SELECT konu, sira, durum, tarih FROM ogrenci_konu_ilerlemesi WHERE ($idCol = ? OR $altIdCol = ?) AND ders = ? ORDER BY sira ASC, konu ASC");
            $stmt->execute([$studentId, $studentId, $ders]);
        } else {
            $stmt = $db->prepare("SELECT konu, sira, durum, tarih FROM ogrenci_konu_ilerlemesi WHERE $idCol = ? AND ders = ? ORDER BY sira ASC, konu ASC");
            $stmt->execute([$studentId, $ders]);
        }
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $konular = array_map(function($r) {
            return [
                "konu" => $r['konu'],
                "sira" => intval($r['sira'] ?? 0),
                "durum" => $r['durum'] ?? 'Konuya Gelinmedi',
                "tarih" => $r['tarih'] ?? null,
                "kaynaklar" => []
            ];
        }, $rows ?: []);
        }
    }
    if (!$konular || count($konular) === 0) {
        $dersId = null;
        try {
            $stmtD = $db->prepare("SELECT id FROM sinav_dersleri WHERE ders_adi COLLATE utf8mb4_turkish_ci = ? LIMIT 1");
            $stmtD->execute([$ders]);
            $dersId = $stmtD->fetchColumn();
            if (!$dersId) {
                $normalized = preg_replace('/^(tyt|ayt|lgs|kpss)\s+/i', '', $ders);
                $stmtD2 = $db->prepare("SELECT id FROM sinav_dersleri WHERE ders_adi COLLATE utf8mb4_turkish_ci LIKE ? LIMIT 1");
                $stmtD2->execute(['%' . $normalized . '%']);
                $dersId = $stmtD2->fetchColumn();
            }
        } catch (Exception $e) {}
        if ($dersId) {
            try {
                $stmtT = $db->prepare("SELECT konu_adi, sira FROM sinav_konulari WHERE ders_id = ? ORDER BY sira ASC, konu_adi ASC");
                $stmtT->execute([$dersId]);
                $topicRows = $stmtT->fetchAll(PDO::FETCH_ASSOC) ?: [];
                $dersResources = [];
                try {
                    $stmtR = $db->prepare("SELECT kaynak_adi FROM ders_kaynaklari WHERE ders_id = ? ORDER BY created_at DESC, id DESC");
                    $stmtR->execute([$dersId]);
                    $resRows = $stmtR->fetchAll(PDO::FETCH_ASSOC) ?: [];
                    foreach ($resRows as $r) {
                        $dersResources[] = ["kaynak_adi" => $r['kaynak_adi'], "tamamlandi" => false];
                    }
                } catch (Exception $e) {}
                $konular = [];
                $i = 0;
                foreach ($topicRows as $t) {
                    $i++;
                    $konular[] = [
                        "konu" => $t['konu_adi'],
                        "sira" => intval($t['sira'] ?? $i),
                        "durum" => "Konuya Gelinmedi",
                        "tarih" => null,
                        "kaynaklar" => $dersResources
                    ];
                }
            } catch (Exception $e) {}
        }
        if (!$konular || count($konular) === 0) {
            $konular = [];
            for ($i = 1; $i <= 10; $i++) {
                $konular[] = [
                    "konu" => "Konu " . $i,
                    "sira" => $i,
                    "durum" => "Konuya Gelinmedi",
                    "tarih" => null,
                    "kaynaklar" => []
                ];
            }
        }
    }
    echo json_encode(["success" => true, "konular" => $konular]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
} catch (Throwable $t) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Sunucu hatası: " . $t->getMessage()]);
}
?>
