<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Preflight OPTIONS request'i handle et
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/database.php';
include_once '../models/User.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    $email = $data->email;
    $password = $data->password;
    
    // Önce users tablosunda kontrol et
    $user = new User($db);
    $user->email = $email;
    $foundUser = false;
    $userData = null;
    
    if($user->findByEmail()) {
        if(password_verify($password, $user->passwordHash)) {
            $foundUser = true;
            $userData = array(
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firstName' => $user->firstName,
                'lastName' => $user->lastName
            );
        }
    }
    
    // Eğer users tablosunda bulunamadıysa, ogrenciler tablosunda ara
    if(!$foundUser) {
        $query = "SELECT id, firstName, lastName, email, passwordHash FROM ogrenciler WHERE email = ? LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute([$email]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($student && password_verify($password, $student['passwordHash'])) {
            $foundUser = true;
            $userData = array(
                'id' => $student['id'],
                'email' => $student['email'],
                'role' => 'ogrenci',
                'firstName' => $student['firstName'],
                'lastName' => $student['lastName']
            );
        }
    }
    
    if($foundUser && $userData) {
        // JWT token oluştur (basit bir token sistemi)
        $token = base64_encode(json_encode(array(
            'id' => $userData['id'],
            'email' => $userData['email'],
            'role' => $userData['role'],
            'exp' => time() + (7 * 24 * 60 * 60) // 7 gün
        )));
        
        http_response_code(200);
        echo json_encode(array(
            "id" => $userData['id'],
            "email" => $userData['email'],
            "role" => $userData['role'],
            "firstName" => $userData['firstName'],
            "lastName" => $userData['lastName'],
            "token" => $token,
            "message" => "Giriş başarılı"
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Geçersiz kimlik bilgileri"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "E-posta ve şifre gerekli"));
}
?>
