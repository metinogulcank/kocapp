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

$raw = file_get_contents('php://input');
$data = [];
if ($raw) {
    $json = json_decode($raw, true);
    if (is_array($json)) $data = $json;
}
$studentId = isset($data['studentId']) ? trim($data['studentId']) : (isset($_POST['studentId']) ? trim($_POST['studentId']) : '');
$amount = isset($data['amount']) ? floatval($data['amount']) : (isset($_POST['amount']) ? floatval($_POST['amount']) : 0);
$method = isset($data['method']) ? trim($data['method']) : (isset($_POST['method']) ? trim($_POST['method']) : 'Kredi Kartı');
$description = isset($data['description']) ? trim($data['description']) : (isset($_POST['description']) ? trim($_POST['description']) : '');
$pendingId = isset($data['pendingId']) ? intval($data['pendingId']) : (isset($_POST['pendingId']) ? intval($_POST['pendingId']) : 0);

if ($studentId === '' || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'studentId ve amount gerekli']);
    exit;
}

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

    $db->beginTransaction();

    if ($pendingId > 0) {
        $stmtCheck = $db->prepare("SELECT id, student_id, amount, description, due_date FROM pending_payments WHERE id = ? AND student_id = ? AND status = 'pending' LIMIT 1");
        $stmtCheck->execute([$pendingId, $studentId]);
        $pendingRow = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        if (!$pendingRow) {
            $db->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Bekleyen ödeme bulunamadı']);
            exit;
        }
        if ($amount <= 0) {
            $amount = floatval($pendingRow['amount']);
        }
        if ($description === '') {
            $description = $pendingRow['description'];
        }

        $stmtUpdate = $db->prepare("UPDATE pending_payments SET status = 'paid' WHERE id = ? AND student_id = ?");
        $stmtUpdate->execute([$pendingId, $studentId]);

        // Bir sonraki ayın ödemesini otomatik oluştur
        try {
            $currentDueDate = new DateTime($pendingRow['due_date']);
            $nextDueDate = clone $currentDueDate;
            $nextDueDate->modify('+1 month');
            $nextDateStr = $nextDueDate->format('Y-m-d');
            $nextMonthStart = $nextDueDate->format('Y-m-01');
            $nextMonthEnd = $nextDueDate->format('Y-m-t');

            // Gelecek ay için zaten bir kayıt var mı?
            $stmtCheckNext = $db->prepare("SELECT COUNT(*) FROM pending_payments WHERE student_id = ? AND due_date BETWEEN ? AND ?");
            $stmtCheckNext->execute([$studentId, $nextMonthStart, $nextMonthEnd]);
            
            if ($stmtCheckNext->fetchColumn() == 0) {
                $insNext = $db->prepare("INSERT INTO pending_payments (student_id, due_date, amount, description, status) VALUES (?, ?, ?, ?, 'pending')");
                $insNext->execute([$studentId, $nextDateStr, $amount, $description]);
            }
        } catch (Exception $ignore) {
            // Otomatik oluşturma hatası ana işlemi bozmamalı
        }
    }

    $stmtInsert = $db->prepare("INSERT INTO payments (student_id, amount, method, description, status) VALUES (?, ?, ?, ?, 'paid')");
    $stmtInsert->execute([$studentId, $amount, $method, $description]);
    $paymentId = $db->lastInsertId();

    $db->commit();

    echo json_encode(['success' => true, 'paymentId' => intval($paymentId)]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
