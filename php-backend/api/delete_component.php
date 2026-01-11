<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once '../config/database.php';
$db = (new Database())->getConnection();
$data = json_decode(file_get_contents('php://input'));
try {
    $id = trim($data->id ?? '');
    if ($id === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'id gerekli']); exit; }
    $db->beginTransaction();
    // Tüm alt bileşenleri (child, grandchild ...) toplayıp silmek için BFS
    $allIds = [];
    $queue = [$id];
    while (!empty($queue)) {
        $curr = array_shift($queue);
        if (in_array($curr, $allIds, true)) { continue; }
        $allIds[] = $curr;
        $q = $db->prepare("SELECT id FROM sinav_bilesenleri WHERE parent_id = ?");
        $q->execute([$curr]);
        $children = $q->fetchAll(PDO::FETCH_COLUMN, 0);
        foreach ($children as $ch) { $queue[] = $ch; }
    }
    // Her id için sırayla ders/konu ve bileşeni sil (önce en derin çocuklar)
    $ok = true;
    $deleteOrder = array_reverse($allIds);
    // component_id sütunu var mı kontrol et
    $hasComponentCol = false;
    try {
        $colStmt = $db->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sinav_dersleri' AND COLUMN_NAME = 'component_id'");
        $colStmt->execute();
        $hasComponentCol = ($colStmt->fetchColumn() > 0);
    } catch (Exception $ie) { $hasComponentCol = false; }
    foreach ($deleteOrder as $cid) {
        if ($hasComponentCol) {
            // Önce bu bileşene bağlı konuları sil
            $delTopics = $db->prepare("DELETE FROM sinav_konulari WHERE ders_id IN (SELECT id FROM sinav_dersleri WHERE component_id = ?)");
            $delTopics->execute([$cid]);
            // Sonra bu bileşene bağlı dersleri sil
            $delSubjects = $db->prepare("DELETE FROM sinav_dersleri WHERE component_id = ?");
            $delSubjects->execute([$cid]);
        }
        // En sonda bileşenin kendisini sil
        $delComp = $db->prepare("DELETE FROM sinav_bilesenleri WHERE id = ?");
        $ok = $delComp->execute([$cid]) && $ok;
    }
    $db->commit();
    echo json_encode(['success'=>$ok]);
} catch (Exception $e) {
    if ($db->inTransaction()) { $db->rollBack(); }
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Veritabanı hatası: '.$e->getMessage()]);
}
?>
