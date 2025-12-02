<?php
// Hata raporlamayı aç
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

try {
    // Dosya yollarını kontrol et
    $config_path = '../config/database.php';
    $model_path = '../models/User.php';
    
    if(!file_exists($config_path)) {
        throw new Exception("Database config dosyası bulunamadı: " . $config_path);
    }
    
    if(!file_exists($model_path)) {
        throw new Exception("User model dosyası bulunamadı: " . $model_path);
    }
    
    include_once $config_path;
    include_once $model_path;

    $database = new Database();
    $db = $database->getConnection();

    if(!$db) {
        throw new Exception("Veritabanı bağlantısı kurulamadı");
    }

    $user = new User($db);

    $data = json_decode(file_get_contents("php://input"));

    if(!$data) {
        throw new Exception("JSON verisi okunamadı");
    }

    if(!empty($data->firstName) && !empty($data->lastName) && 
       !empty($data->email) && !empty($data->password)) {
        
        $user->firstName = $data->firstName;
        $user->lastName = $data->lastName;
        $user->email = $data->email;
        $user->phone = isset($data->phone) ? $data->phone : '';
        $user->role = isset($data->role) ? $data->role : 'ogrenci';
        
        if($user->emailExists()) {
            http_response_code(409);
            echo json_encode(array("message" => "Bu e-posta zaten kayıtlı"));
            return;
        }
        
        $user->passwordHash = password_hash($data->password, PASSWORD_DEFAULT);
        
        if($user->create()) {
            http_response_code(201);
            echo json_encode(array(
                "id" => $user->id,
                "email" => $user->email,
                "role" => $user->role,
                "message" => "Kullanıcı başarıyla oluşturuldu"
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Kullanıcı oluşturulamadı"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Zorunlu alanlar eksik"));
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Hata: " . $e->getMessage()));
} catch(Error $e) {
    http_response_code(500);
    echo json_encode(array("message" => "PHP Hatası: " . $e->getMessage()));
}
?>
