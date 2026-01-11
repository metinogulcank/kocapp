<?php
ob_start();
if (ob_get_length()) ob_clean();
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer, User-Agent');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Vary: Origin');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

set_error_handler(function($severity, $message, $file, $line) {
    http_response_code(500);
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if ($origin) { header('Access-Control-Allow-Origin: ' . $origin); } else { header('Access-Control-Allow-Origin: http://localhost:3000'); }
    header('Content-Type: application/json; charset=UTF-8');
    header('Access-Control-Allow-Credentials: true');
    echo json_encode(["success" => false, "message" => "Sunucu hatası: ".$message]);
    exit;
});
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        if ($origin) { header('Access-Control-Allow-Origin: ' . $origin); } else { header('Access-Control-Allow-Origin: http://localhost:3000'); }
        header('Content-Type: application/json; charset=UTF-8');
        header('Access-Control-Allow-Credentials: true');
        echo json_encode(["success" => false, "message" => "Sunucu hatası: ".$err['message']]);
    }
});

require_once '../config/database.php';
$db = (new Database())->getConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı bağlantısı kurulamadı."]);
    exit;
}

$raw = file_get_contents("php://input");
$json = json_decode($raw, true);

if (!is_array($json)) {
    $json = [
        "studentId" => isset($_POST['studentId']) ? $_POST['studentId'] : null,
        "ders" => isset($_POST['ders']) ? $_POST['ders'] : null,
        "konular" => isset($_POST['konular']) ? $_POST['konular'] : null
    ];
    if (is_string($json["konular"])) {
        $decoded = json_decode($json["konular"], true);
        if (is_array($decoded)) $json["konular"] = $decoded;
    }
}

$studentId = isset($json['studentId']) ? trim($json['studentId']) : '';
$ders = isset($json['ders']) ? trim($json['ders']) : '';
$konular = isset($json['konular']) && is_array($json['konular']) ? $json['konular'] : null;

if ($studentId === '' || $ders === '' || $konular === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Eksik veri. studentId, ders ve konular zorunludur."]);
    exit;
}

$normalized = [];
foreach ($konular as $i => $k) {
    $normalized[] = [
        "konu" => isset($k['konu']) ? htmlspecialchars(strip_tags($k['konu'])) : ("Konu " . ($i + 1)),
        "sira" => isset($k['sira']) ? intval($k['sira']) : ($i + 1),
        "durum" => isset($k['durum']) ? htmlspecialchars(strip_tags($k['durum'])) : "Konuya Gelinmedi",
        "tarih" => isset($k['tarih']) ? htmlspecialchars(strip_tags($k['tarih'])) : null,
        "kaynaklar" => (isset($k['kaynaklar']) && is_array($k['kaynaklar'])) ? array_map(function($r) {
            return [
                "kaynak_adi" => isset($r['kaynak_adi']) ? htmlspecialchars(strip_tags($r['kaynak_adi'])) : '',
                "tamamlandi" => isset($r['tamamlandi']) ? (bool)$r['tamamlandi'] : false
            ];
        }, $k['kaynaklar']) : []
    ];
}

$jsonStr = json_encode($normalized, JSON_UNESCAPED_UNICODE);

try {
    $colsStmt = $db->query("DESCRIBE ogrenci_konu_ilerlemesi");
    $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
    $idCol = in_array('ogrenci_id', $cols) ? 'ogrenci_id' : (in_array('student_id', $cols) ? 'student_id' : null);
    $altIdCol = null;
    if ($idCol === 'ogrenci_id' && in_array('student_id', $cols)) $altIdCol = 'student_id';
    if ($idCol === 'student_id' && in_array('ogrenci_id', $cols)) $altIdCol = 'ogrenci_id';
    if (!$idCol) { throw new Exception('Tablo şeması desteklenmiyor'); }
    $hasJson = in_array('konular_json', $cols);
    if ($hasJson) {
        if ($altIdCol) {
            $find = $db->prepare("SELECT id FROM ogrenci_konu_ilerlemesi WHERE ($idCol = ? OR $altIdCol = ?) AND ders = ? LIMIT 1");
            $find->execute([$studentId, $studentId, $ders]);
        } else {
            $find = $db->prepare("SELECT id FROM ogrenci_konu_ilerlemesi WHERE $idCol = ? AND ders = ? LIMIT 1");
            $find->execute([$studentId, $ders]);
        }
        $existingId = $find->fetchColumn();
        if ($existingId) {
            $updSql = in_array('updated_at', $cols)
                ? "UPDATE ogrenci_konu_ilerlemesi SET konular_json = ?, updated_at = NOW() WHERE id = ?"
                : "UPDATE ogrenci_konu_ilerlemesi SET konular_json = ? WHERE id = ?";
            $upd = $db->prepare($updSql);
            $ok = $upd->execute([$jsonStr, $existingId]);
            if ($ok) echo json_encode(["success" => true, "message" => "Konu ilerlemesi kaydedildi."]);
            else { http_response_code(503); echo json_encode(["success" => false, "message" => "Konu ilerlemesi kaydedilemedi."]); }
        } else {
            $idColsList = $idCol;
            $idParams = [$studentId];
            if ($altIdCol) {
                $idColsList = "$idColsList, $altIdCol";
                $idParams[] = $studentId;
            }
            $insCols = "$idColsList, ders, konular_json";
            $insVals = rtrim(str_repeat('?,', count($idParams)), ',') . ", ?, ?";
            if (in_array('created_at', $cols) && in_array('updated_at', $cols)) {
                $insCols .= ", created_at, updated_at";
                $insVals .= ", NOW(), NOW()");
            }
            $ins = $db->prepare("INSERT INTO ogrenci_konu_ilerlemesi ($insCols) VALUES ($insVals)");
            $ok = $ins->execute(array_merge($idParams, [$ders, $jsonStr]));
            if ($ok) echo json_encode(["success" => true, "message" => "Konu ilerlemesi kaydedildi."]);
            else { http_response_code(503); echo json_encode(["success" => false, "message" => "Konu ilerlemesi kaydedilemedi."]); }
        }
    } else {
        $db->beginTransaction();
        try {
            $db->exec("CREATE TABLE IF NOT EXISTS ogrenci_konu_kaynaklari (
                id INT AUTO_INCREMENT PRIMARY KEY,
                konu_ilerleme_id INT NOT NULL,
                kaynak_adi VARCHAR(255) NOT NULL,
                tamamlandi TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_konu_ilerleme_id (konu_ilerleme_id)
            )");
        } catch (Exception $e) {}
        $existingIds = [];
        if ($altIdCol) {
            $stmtIds = $db->prepare("SELECT id FROM ogrenci_konu_ilerlemesi WHERE ($idCol = ? OR $altIdCol = ?) AND ders = ?");
            $stmtIds->execute([$studentId, $studentId, $ders]);
        } else {
            $stmtIds = $db->prepare("SELECT id FROM ogrenci_konu_ilerlemesi WHERE $idCol = ? AND ders = ?");
            $stmtIds->execute([$studentId, $ders]);
        }
        $existingIds = array_map(function($r){ return $r['id']; }, $stmtIds->fetchAll(PDO::FETCH_ASSOC) ?: []);
        if ($existingIds && count($existingIds) > 0) {
            $inPlaceholders = implode(',', array_fill(0, count($existingIds), '?'));
            $delK = $db->prepare("DELETE FROM ogrenci_konu_kaynaklari WHERE konu_ilerleme_id IN ($inPlaceholders)");
            $delK->execute($existingIds);
        }
        if ($altIdCol) {
            $del = $db->prepare("DELETE FROM ogrenci_konu_ilerlemesi WHERE ($idCol = ? OR $altIdCol = ?) AND ders = ?");
            $del->execute([$studentId, $studentId, $ders]);
        } else {
            $del = $db->prepare("DELETE FROM ogrenci_konu_ilerlemesi WHERE $idCol = ? AND ders = ?");
            $del->execute([$studentId, $ders]);
        }
        $hasCreated = in_array('created_at', $cols);
        $hasUpdated = in_array('updated_at', $cols);
        foreach ($normalized as $row) {
            $idColsList = $idCol;
            $idParams = [$studentId];
            if ($altIdCol) {
                $idColsList = "$idColsList, $altIdCol";
                $idParams[] = $studentId;
            }
            $baseCols = "$idColsList, ders, konu, sira, durum, tarih";
            $params = array_merge($idParams, [$ders, $row['konu'], $row['sira'], $row['durum'], $row['tarih']]);
            if ($hasCreated && $hasUpdated) {
                $placeholders = rtrim(str_repeat('?,', count($params)), ',');
                $sql = "INSERT INTO ogrenci_konu_ilerlemesi ($baseCols, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";
            } else {
                $placeholders = rtrim(str_repeat('?,', count($params)), ',');
                $sql = "INSERT INTO ogrenci_konu_ilerlemesi ($baseCols) VALUES ($placeholders)";
            }
            $ins = $db->prepare($sql);
            $ins->execute($params);
            $konuIlerlemeId = (int)$db->lastInsertId();
            if (isset($row['kaynaklar']) && is_array($row['kaynaklar']) && $konuIlerlemeId > 0) {
                foreach ($row['kaynaklar'] as $res) {
                    $ka = isset($res['kaynak_adi']) ? $res['kaynak_adi'] : '';
                    $tm = isset($res['tamamlandi']) ? ($res['tamamlandi'] ? 1 : 0) : 0;
                    if ($ka !== '') {
                        $stmtRes = $db->prepare("INSERT INTO ogrenci_konu_kaynaklari (konu_ilerleme_id, kaynak_adi, tamamlandi) VALUES (?, ?, ?)");
                        $stmtRes->execute([$konuIlerlemeId, $ka, $tm]);
                    }
                }
            }
        }
        $db->commit();
        echo json_encode(["success" => true, "message" => "Konu ilerlemesi kaydedildi."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
} catch (Throwable $t) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Sunucu hatası: " . $t->getMessage()]);
}
?>
