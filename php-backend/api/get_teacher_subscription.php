<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

$teacherId = isset($_GET['teacherId']) ? trim($_GET['teacherId']) : '';
if ($teacherId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'teacherId gerekli']);
    exit;
}

try {
    $db->exec("CREATE TABLE IF NOT EXISTS teacher_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id VARCHAR(24) NOT NULL,
        end_date DATE NOT NULL,
        student_limit INT NOT NULL DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_teacher (teacher_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Add column if not exists (for existing tables)
    try {
        $db->exec("ALTER TABLE teacher_subscriptions ADD COLUMN student_limit INT NOT NULL DEFAULT 5");
    } catch (Exception $e) {
        // Column likely exists
    }

    $stmt = $db->prepare("SELECT end_date, student_limit FROM teacher_subscriptions WHERE teacher_id = ? LIMIT 1");
    $stmt->execute([$teacherId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $defaultEnd = (new DateTime('now'))->modify('+90 days')->format('Y-m-d');
        // Auto-create with default limit 5
        $ins = $db->prepare("INSERT INTO teacher_subscriptions (teacher_id, end_date, student_limit) VALUES (?, ?, 5)");
        $ins->execute([$teacherId, $defaultEnd]);
        $row = ['end_date' => $defaultEnd, 'student_limit' => 5];
    }

    $today = new DateTime('today');
    $end = new DateTime($row['end_date']);
    $diff = $today->diff($end);
    $daysLeft = intval($diff->format('%r%a')); // negative if expired
    $limit = isset($row['student_limit']) ? intval($row['student_limit']) : 5;

    echo json_encode([
        'success' => true,
        'endDate' => $row['end_date'],
        'daysLeft' => $daysLeft,
        'studentLimit' => $limit
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
