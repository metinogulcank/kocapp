<?php
require_once '../config/database.php';
$db = (new Database())->getConnection();

if ($db) {
    try {
        $stmt = $db->query("DESCRIBE ogrenci_konu_ilerlemesi");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($columns, JSON_PRETTY_PRINT);
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage();
    }
} else {
    echo "DB Connection failed";
}
?>