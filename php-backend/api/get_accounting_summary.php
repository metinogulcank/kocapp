<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(24) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(64) NOT NULL,
        description VARCHAR(255) DEFAULT '' COLLATE utf8mb4_unicode_ci,
        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(16) NOT NULL DEFAULT 'paid',
        INDEX idx_student (student_id),
        INDEX idx_status (status),
        INDEX idx_paid_at (paid_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS pending_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(24) NOT NULL,
        due_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) DEFAULT '' COLLATE utf8mb4_unicode_ci,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student (student_id),
        INDEX idx_status (status),
        INDEX idx_due_date (due_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $now = new DateTime('now');
    $monthStart = $now->format('Y-m-01 00:00:00');
    $monthEnd = $now->format('Y-m-t 23:59:59');
    $yearStart = $now->format('Y-01-01 00:00:00');
    $yearEnd = $now->format('Y-12-31 23:59:59');

    $stmtMonth = $db->prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='paid' AND paid_at BETWEEN ? AND ?");
    $stmtMonth->execute([$monthStart, $monthEnd]);
    $monthIncome = floatval($stmtMonth->fetchColumn());

    $stmtYear = $db->prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='paid' AND paid_at BETWEEN ? AND ?");
    $stmtYear->execute([$yearStart, $yearEnd]);
    $yearIncome = floatval($stmtYear->fetchColumn());

    $stmtUnpaid = $db->prepare("SELECT COALESCE(SUM(amount),0) AS total FROM pending_payments WHERE status='pending'");
    $stmtUnpaid->execute();
    $unpaidTotal = floatval($stmtUnpaid->fetchColumn());

    echo json_encode([
        'success' => true,
        'monthIncome' => $monthIncome,
        'yearIncome' => $yearIncome,
        'unpaidTotal' => $unpaidTotal
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
