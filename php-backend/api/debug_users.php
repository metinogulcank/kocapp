<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Get table structure
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get unique roles
    $stmt = $db->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get sample rows
    $stmt = $db->query("SELECT * FROM users LIMIT 5");
    $sample_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'columns' => $columns,
        'roles' => $roles,
        'sample_data' => $sample_data
    ]);

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
