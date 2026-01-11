<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Try manual connection with localhost (socket)
$host = 'localhost';
$db_name = 'koca_kocapp';
$username = 'koca_metinogulcank';
$password = '06ogulcan06';

try {
    $db = new PDO(
        "mysql:host=$host;dbname=$db_name;charset=utf8mb4",
        $username,
        $password,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        )
    );

    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'yok_atlas_link'");
    if ($stmt->rowCount() == 0) {
        // Add column if it doesn't exist
        $query = "ALTER TABLE users ADD COLUMN yok_atlas_link VARCHAR(255) DEFAULT NULL";
        $db->exec($query);
        echo json_encode(["message" => "Column 'yok_atlas_link' added successfully."]);
    } else {
        echo json_encode(["message" => "Column 'yok_atlas_link' already exists."]);
    }

} catch (PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
}
?>
