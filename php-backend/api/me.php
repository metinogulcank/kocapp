<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/User.php';

function verifyToken($token) {
    try {
        $decoded = json_decode(base64_decode($token), true);
        if($decoded && isset($decoded['exp']) && $decoded['exp'] > time()) {
            return $decoded;
        }
    } catch(Exception $e) {
        return false;
    }
    return false;
}

$headers = getallheaders();
$token = null;

if(isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    if(strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
    }
}

if(!$token) {
    http_response_code(401);
    echo json_encode(array("message" => "Token gerekli"));
    return;
}

$userData = verifyToken($token);
if(!$userData) {
    http_response_code(401);
    echo json_encode(array("message" => "Geçersiz token"));
    return;
}

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$user->id = $userData['id'];
if($user->findByEmail()) {
    http_response_code(200);
    echo json_encode(array(
        "id" => $user->id,
        "firstName" => $user->firstName,
        "lastName" => $user->lastName,
        "email" => $user->email,
        "phone" => $user->phone,
        "role" => $user->role
    ));
} else {
    http_response_code(404);
    echo json_encode(array("message" => "Kullanıcı bulunamadı"));
}
?>
