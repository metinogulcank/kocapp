<?php
require_once 'php-backend/config/database.php';
$db = (new Database())->getConnection();

// Find TYT Biyoloji ID
$stmt = $db->prepare("SELECT id, ders_adi FROM sinav_dersleri WHERE ders_adi LIKE '%Biyoloji%'");
$stmt->execute();
$dersler = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Dersler:\n";
print_r($dersler);

if (count($dersler) > 0) {
    $dersId = $dersler[0]['id'];
    echo "\nTopics for Ders ID: $dersId\n";
    
    $stmt = $db->prepare("SELECT id, konu_adi, parent_id FROM sinav_konulari WHERE ders_id = ? ORDER BY sira ASC");
    $stmt->execute([$dersId]);
    $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($topics);
}
?>
