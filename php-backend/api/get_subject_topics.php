<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
$db = (new Database())->getConnection();

$dersId = isset($_GET['dersId']) ? $_GET['dersId'] : '';
$parentId = isset($_GET['parentId']) ? $_GET['parentId'] : null;
$includeSubtopics = isset($_GET['includeSubtopics']) && $_GET['includeSubtopics'] === 'true';

if ($dersId === '' && $parentId === null) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'dersId veya parentId gerekli'
    ]);
    exit;
}

try {
    if ($parentId) {
        $stmt = $db->prepare("
            SELECT 
                id, 
                konu_id AS parent_id, 
                alt_konu_adi AS konu_adi, 
                sira, 
                createdAt, 
                updatedAt 
            FROM sinav_alt_konulari 
            WHERE konu_id = ? 
            ORDER BY sira ASC, alt_konu_adi ASC
        ");
        $stmt->execute([$parentId]);
    } else {
        if ($includeSubtopics) {
            $query = "
                SELECT 
                    id, 
                    ders_id, 
                    parent_id, 
                    konu_adi, 
                    sira, 
                    createdAt, 
                    updatedAt 
                FROM sinav_konulari 
                WHERE ders_id = ? 
                  AND (parent_id IS NULL OR parent_id = '')
                UNION ALL
                SELECT 
                    sa.id, 
                    sk.ders_id, 
                    sa.konu_id AS parent_id, 
                    sa.alt_konu_adi AS konu_adi, 
                    sa.sira, 
                    sa.createdAt, 
                    sa.updatedAt 
                FROM sinav_alt_konulari sa
                JOIN sinav_konulari sk ON sa.konu_id = sk.id
                WHERE sk.ders_id = ?
                ORDER BY sira ASC, konu_adi ASC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([$dersId, $dersId]);
        } else {
            $stmt = $db->prepare("
                SELECT 
                    id, 
                    ders_id, 
                    parent_id, 
                    konu_adi, 
                    sira, 
                    createdAt, 
                    updatedAt 
                FROM sinav_konulari 
                WHERE ders_id = ? 
                  AND (parent_id IS NULL OR parent_id = '') 
                ORDER BY sira ASC, konu_adi ASC
            ");
            $stmt->execute([$dersId]);
        }
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        'success' => true,
        'topics'  => $rows
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>