<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']);
    exit;
}

$idsParam = isset($_GET['studentIds']) ? trim($_GET['studentIds']) : '';
$studentIds = array_filter(array_map('trim', explode(',', $idsParam)));
if (empty($studentIds)) {
    echo json_encode(['success' => true, 'statuses' => []]);
    exit;
}

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

    // Aylık bekleyen ödemeyi toplu olarak garanti altına al
    $now = new DateTime('now');
    $currentMonthStart = $now->format('Y-m-01');
    $currentMonthEnd = $now->format('Y-m-t');
    foreach ($studentIds as $sid) {
        // Önce bu ay için ÖDENMİŞ bir kayıt var mı kontrol et
        $checkPaid = $db->prepare("SELECT COUNT(*) FROM pending_payments WHERE student_id = ? AND status='paid' AND due_date BETWEEN ? AND ?");
        $checkPaid->execute([$sid, $currentMonthStart, $currentMonthEnd]);
        $hasPaid = intval($checkPaid->fetchColumn()) > 0;

        if ($hasPaid) {
            // Eğer ödenmiş kayıt varsa, bu ay için yanlışlıkla oluşturulmuş mükerrer 'pending' kayıtlarını temizle
            $delDupe = $db->prepare("DELETE FROM pending_payments WHERE student_id = ? AND status='pending' AND due_date BETWEEN ? AND ?");
            $delDupe->execute([$sid, $currentMonthStart, $currentMonthEnd]);
        } else {
            // Ödenmiş kayıt yoksa, bekleyen kayıt var mı diye bak (varsa dokunma, yoksa oluştur)
            $checkPending = $db->prepare("SELECT COUNT(*) FROM pending_payments WHERE student_id = ? AND status='pending' AND due_date BETWEEN ? AND ?");
            $checkPending->execute([$sid, $currentMonthStart, $currentMonthEnd]);
            $hasPending = intval($checkPending->fetchColumn()) > 0;

            if (!$hasPending) {
                $dueDate = $now->format('Y-m-15');
                $defaultAmount = 1500.00;
                $defaultDesc = 'Aylık eğitim ücreti';
                $ins = $db->prepare("INSERT INTO pending_payments (student_id, due_date, amount, description, status) VALUES (?, ?, ?, ?, 'pending')");
                $ins->execute([$sid, $dueDate, $defaultAmount, $defaultDesc]);
            }
        }
    }

    // Build IN clause safely
    $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
    $query = "SELECT student_id, SUM(CASE WHEN status='pending' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_count,
                     MIN(CASE WHEN status='pending' AND due_date >= CURDATE() THEN due_date ELSE NULL END) AS next_due_date
              FROM pending_payments
              WHERE student_id IN ($placeholders)
              GROUP BY student_id";
    $stmt = $db->prepare($query);
    foreach ($studentIds as $i => $sid) {
        $stmt->bindValue($i + 1, $sid);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $map = [];
    foreach ($rows as $r) {
        $map[$r['student_id']] = [
            'overdueCount' => intval($r['overdue_count']),
            'nextDueDate' => $r['next_due_date']
        ];
    }

    echo json_encode(['success' => true, 'statuses' => $map]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
