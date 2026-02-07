<?php
ob_start(); if (ob_get_length()) ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
$db = (new Database())->getConnection();

$studentId = isset($_GET['studentId']) ? trim($_GET['studentId']) : '';
if ($studentId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'studentId gerekli']);
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

    // Aylık bekleyen ödeme yoksa otomatik oluştur (varsayılan 1500 TL)
    $now = new DateTime('now');
    $currentMonthStart = $now->format('Y-m-01');
    $currentMonthEnd = $now->format('Y-m-t');

    // Önce bu ay için ÖDENMİŞ bir kayıt var mı kontrol et
    $stmtCheckPaid = $db->prepare("SELECT COUNT(*) FROM pending_payments WHERE student_id = ? AND status='paid' AND due_date BETWEEN ? AND ?");
    $stmtCheckPaid->execute([$studentId, $currentMonthStart, $currentMonthEnd]);
    $hasPaid = intval($stmtCheckPaid->fetchColumn()) > 0;

    if ($hasPaid) {
        // Eğer ödenmiş kayıt varsa, bu ay için yanlışlıkla oluşturulmuş mükerrer 'pending' kayıtlarını temizle
        $delDupe = $db->prepare("DELETE FROM pending_payments WHERE student_id = ? AND status='pending' AND due_date BETWEEN ? AND ?");
        $delDupe->execute([$studentId, $currentMonthStart, $currentMonthEnd]);
    } else {
        // Ödenmiş yoksa, genel kontrol yap (bekleyen veya ödenmiş herhangi biri var mı)
        // Yukarıda paid check yaptık, geriye sadece pending veya hiçbiri kalıyor.
        // Ama orijinal mantığı koruyarak:
        $stmtCheckMonth = $db->prepare("SELECT COUNT(*) FROM pending_payments WHERE student_id = ? AND due_date BETWEEN ? AND ?");
        $stmtCheckMonth->execute([$studentId, $currentMonthStart, $currentMonthEnd]);
        $hasCurrentMonthPending = intval($stmtCheckMonth->fetchColumn()) > 0;
        
        if (!$hasCurrentMonthPending) {
            $dueDate = $now->format('Y-m-15'); // Ay ortası son tarih varsayılan
            $defaultAmount = 1500.00;
            $defaultDesc = 'Aylık eğitim ücreti';
            $stmtCreate = $db->prepare("INSERT INTO pending_payments (student_id, due_date, amount, description, status) VALUES (?, ?, ?, ?, 'pending')");
            $stmtCreate->execute([$studentId, $dueDate, $defaultAmount, $defaultDesc]);
        }
    }

    $stmtPaid = $db->prepare("SELECT amount, method, description, paid_at FROM payments WHERE student_id = ? AND status = 'paid' ORDER BY paid_at DESC");
    $stmtPaid->execute([$studentId]);
    $paidRows = $stmtPaid->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $stmtPending = $db->prepare("SELECT id, due_date, amount, description FROM pending_payments WHERE student_id = ? AND status = 'pending' ORDER BY due_date ASC, id ASC");
    $stmtPending->execute([$studentId]);
    $pendingRows = $stmtPending->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $payments = array_map(function($r) {
        return [
            'tarih' => $r['paid_at'],
            'tutar' => floatval($r['amount']),
            'yontem' => $r['method'],
            'aciklama' => $r['description']
        ];
    }, $paidRows);

    $pending = array_map(function($r) {
        return [
            'id' => intval($r['id']),
            'sonTarih' => $r['due_date'],
            'tutar' => floatval($r['amount']),
            'aciklama' => $r['description']
        ];
    }, $pendingRows);

    echo json_encode(['success' => true, 'payments' => $payments, 'pendingPayments' => $pending]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
