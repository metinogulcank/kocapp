<?php
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

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

function getAuthUser() {
    $headers = getallheaders();
    $token = null;
    $authHeader = null;

    // Case-insensitive search for Authorization header
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }

    // Fallbacks for different server configurations
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if(isset($authHeader)) {
        if(strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }

    if(!$token) {
        return null;
    }

    return verifyToken($token);
}
?>
