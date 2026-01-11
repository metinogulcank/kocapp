<?php
require_once 'php-backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

$sql = "CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

try {
    $db->exec($sql);
    echo "Table created successfully";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
