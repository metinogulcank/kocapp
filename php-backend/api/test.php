<?php
// Basit test dosyası
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    echo json_encode(array(
        "status" => "success",
        "message" => "PHP çalışıyor",
        "php_version" => phpversion(),
        "current_dir" => getcwd(),
        "files" => array(
            "config_exists" => file_exists('../config/database.php'),
            "model_exists" => file_exists('../models/User.php'),
            "config_path" => realpath('../config/database.php'),
            "model_path" => realpath('../models/User.php')
        )
    ));
} catch(Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => $e->getMessage()
    ));
}
?>
