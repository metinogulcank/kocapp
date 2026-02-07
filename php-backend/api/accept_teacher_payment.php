<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

$raw = file_get_contents('php://input');
$data = [];
if ($raw) {
    $json = json_decode($raw, true);
    if (is_array($json)) $data = $json;
}

$teacherId = isset($data['teacherId']) ? trim($data['teacherId']) : (isset($_POST['teacherId']) ? trim($_POST['teacherId']) : '');
$amount = isset($data['amount']) ? floatval($data['amount']) : (isset($_POST['amount']) ? floatval($_POST['amount']) : 0);
$method = isset($data['method']) ? trim($data['method']) : (isset($_POST['method']) ? trim($_POST['method']) : 'Kredi Kartı');
$packageId = isset($data['packageId']) ? trim($data['packageId']) : (isset($_POST['packageId']) ? trim($_POST['packageId']) : '');
$durationDays = isset($data['durationDays']) ? intval($data['durationDays']) : (isset($_POST['durationDays']) ? intval($_POST['durationDays']) : 0);
$description = isset($data['description']) ? trim($data['description']) : (isset($_POST['description']) ? trim($_POST['description']) : '');
    $studentLimit = isset($data['studentLimit']) ? intval($data['studentLimit']) : (isset($_POST['studentLimit']) ? intval($_POST['studentLimit']) : 5);

    if ($teacherId === '' || $amount <= 0 || $durationDays <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'teacherId, amount ve durationDays gerekli']);
        exit;
    }

    // DDL Operations (Before Transaction)
    // Implicit commit causes issues if inside transaction
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS teacher_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id VARCHAR(24) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            method VARCHAR(64) NOT NULL,
            package_id VARCHAR(64) DEFAULT '',
            description VARCHAR(255) DEFAULT '' COLLATE utf8mb4_unicode_ci,
            paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(16) NOT NULL DEFAULT 'paid',
            INDEX idx_teacher (teacher_id),
            INDEX idx_paid_at (paid_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $db->exec("CREATE TABLE IF NOT EXISTS teacher_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id VARCHAR(24) NOT NULL,
            end_date DATE NOT NULL,
            student_limit INT NOT NULL DEFAULT 5,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_teacher (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // Add column if not exists (safer check)
        $checkCol = $db->query("SHOW COLUMNS FROM teacher_subscriptions LIKE 'student_limit'");
        if ($checkCol->rowCount() == 0) {
            $db->exec("ALTER TABLE teacher_subscriptions ADD COLUMN student_limit INT NOT NULL DEFAULT 5");
        }
    } catch (Exception $e) {
        // Schema update failed, but try to proceed
    }

    try {
        $db->beginTransaction();

        $insPay = $db->prepare("INSERT INTO teacher_payments (teacher_id, amount, method, package_id, description, status) VALUES (?, ?, ?, ?, ?, 'paid')");
        $insPay->execute([$teacherId, $amount, $method, $packageId, $description]);

        $stmtSub = $db->prepare("SELECT end_date FROM teacher_subscriptions WHERE teacher_id = ? LIMIT 1");
        $stmtSub->execute([$teacherId]);
        $row = $stmtSub->fetch(PDO::FETCH_ASSOC);
        $today = new DateTime('today');

        if ($row) {
            $currentEnd = new DateTime($row['end_date']);
            $base = $currentEnd > $today ? $currentEnd : $today;
            $base->modify("+{$durationDays} days");
            $newEnd = $base->format('Y-m-d');
            $upd = $db->prepare("UPDATE teacher_subscriptions SET end_date = ?, student_limit = ? WHERE teacher_id = ?");
            $upd->execute([$newEnd, $studentLimit, $teacherId]);
        } else {
            $newEnd = $today->modify("+{$durationDays} days")->format('Y-m-d');
            $insSub = $db->prepare("INSERT INTO teacher_subscriptions (teacher_id, end_date, student_limit) VALUES (?, ?, ?)");
            $insSub->execute([$teacherId, $newEnd, $studentLimit]);
        }

    $db->commit();
    echo json_encode(['success' => true, 'newEndDate' => $newEnd]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
