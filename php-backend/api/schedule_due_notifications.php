<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']);
    exit;
}

$daysBefore = isset($_GET['days']) ? intval($_GET['days']) : 5;
if ($daysBefore <= 0) $daysBefore = 5;

try {
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

    $db->beginTransaction();

    $today = new DateTime('today');
    $limit = new DateTime('today');
    $limit->modify("+{$daysBefore} days");
    $stmt = $db->prepare("SELECT id, student_id, due_date, amount, description FROM pending_payments WHERE status='pending' AND due_date BETWEEN ? AND ?");
    $stmt->execute([$today->format('Y-m-d'), $limit->format('Y-m-d')]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $created = 0;
    foreach ($rows as $r) {
        $studentId = $r['student_id'];
        $dueDate = $r['due_date'];
        $amount = $r['amount'];
        $desc = $r['description'];

        $parentQuery = $db->prepare("SELECT veli_id FROM ogrenciler WHERE id = ? AND veli_id IS NOT NULL");
        $parentQuery->execute([$studentId]);
        $parentId = $parentQuery->fetchColumn();
        if (!$parentId) { continue; }

        // Duplicate prevention: check if a reminder for this student & due_date already exists today
        $check = $db->prepare("SELECT COUNT(*) FROM notifications WHERE recipient_type = 'parent' AND recipient_id = ? AND type = 'reminder' AND title LIKE 'Ödeme Hatırlatması%' AND DATE(created_at) = CURDATE()");
        $check->execute([$studentId]);
        $exists = intval($check->fetchColumn());
        if ($exists > 0) { continue; }

        $title = "Ödeme Hatırlatması";
        $message = "Öğrencinizin " . date('d.m.Y', strtotime($dueDate)) . " tarihli ₺" . number_format($amount, 2, ',', '.') . " ödemesi yaklaşmaktadır. Lütfen zamanında ödeme yapınız.";
        $type = 'reminder';
        $priority = 'high';

        $notif = $db->prepare("INSERT INTO notifications (sender_id, sender_type, recipient_type, recipient_id, title, message, type, priority, created_at) VALUES (0, 'admin', 'parent', ?, ?, ?, ?, ?, NOW())");
        $notif->execute([$studentId, $title, $message, $type, $priority]);
        $notificationId = $db->lastInsertId();

        $userNotif = $db->prepare("INSERT INTO user_notifications (user_id, user_type, notification_id, is_read) VALUES (?, 'parent', ?, 0)");
        $userNotif->execute([$parentId, $notificationId]);
        $created++;
    }

    $db->commit();
    echo json_encode(['success' => true, 'created' => $created]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Bildirim planlama hatası', 'error' => $e->getMessage()]);
}
