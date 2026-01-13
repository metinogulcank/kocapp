<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $sql = "CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id VARCHAR(255) NOT NULL,
        student_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        subject VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $db->exec($sql);
    echo "Table 'appointments' created or already exists.<br>";

    // Add indexes
    $db->exec("CREATE INDEX IF NOT EXISTS idx_teacher_date ON appointments(teacher_id, date)");
    echo "Index created.<br>";

} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
