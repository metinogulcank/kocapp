<?php
// User model testi
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    include_once '../config/database.php';
    include_once '../models/User.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if(!$db) {
        throw new Exception("Veritabanı bağlantısı kurulamadı");
    }
    
    $user = new User($db);
    
    // Test verisi
    $user->firstName = "Test";
    $user->lastName = "User";
    $user->email = "test@example.com";
    $user->phone = "05551234567";
    $user->role = "ogrenci";
    $user->passwordHash = password_hash("test123", PASSWORD_DEFAULT);
    
    // Email kontrolü
    $emailExists = $user->emailExists();
    
    echo json_encode(array(
        "status" => "success",
        "message" => "User model testi başarılı",
        "email_exists" => $emailExists,
        "user_data" => array(
            "firstName" => $user->firstName,
            "lastName" => $user->lastName,
            "email" => $user->email,
            "role" => $user->role
        )
    ));
    
} catch(Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "User model hatası: " . $e->getMessage()
    ));
} catch(Error $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "PHP Hatası: " . $e->getMessage()
    ));
}
?>
