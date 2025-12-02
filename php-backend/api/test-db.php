<?php
// Veritabanı bağlantı testi
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    include_once '../config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if(!$db) {
        throw new Exception("Veritabanı bağlantısı kurulamadı");
    }
    
    // Basit bir test sorgusu
    $stmt = $db->query("SELECT 1 as test");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(array(
        "status" => "success",
        "message" => "Veritabanı bağlantısı başarılı",
        "test_query" => $result,
        "db_info" => array(
            "host" => "localhost",
            "db_name" => "venotoc1_kocapp",
            "username" => "metinogulcank"
        )
    ));
    
} catch(Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "Veritabanı hatası: " . $e->getMessage()
    ));
} catch(Error $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "PHP Hatası: " . $e->getMessage()
    ));
}
?>
