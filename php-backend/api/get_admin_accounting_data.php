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

try {
    // 1. Get all teachers
    $stmt = $db->prepare("SELECT _id as id, firstName, lastName, email, phone, createdAt FROM users WHERE role = 'ogretmen' ORDER BY createdAt DESC");
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get subscriptions
    $subs = [];
    $stmtSub = $db->prepare("SELECT teacher_id, end_date, student_limit FROM teacher_subscriptions");
    $stmtSub->execute();
    while ($row = $stmtSub->fetch(PDO::FETCH_ASSOC)) {
        $subs[$row['teacher_id']] = $row;
    }

    // 3. Get last payments
    // Using a correlated subquery or just grouping to get the last one
    $payments = [];
    $stmtPay = $db->prepare("SELECT teacher_id, amount, paid_at, package_id FROM teacher_payments ORDER BY paid_at DESC");
    $stmtPay->execute();
    $allPayments = $stmtPay->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by teacher manually to get the latest one
    foreach ($allPayments as $p) {
        if (!isset($payments[$p['teacher_id']])) {
            $payments[$p['teacher_id']] = $p;
        }
    }

    // Combine data
    $result = [];
    $today = new DateTime('today');

    foreach ($teachers as $t) {
        $tid = $t['id'];
        $sub = isset($subs[$tid]) ? $subs[$tid] : null;
        $lastPay = isset($payments[$tid]) ? $payments[$tid] : null;

        $status = 'active'; // Default logic
        $daysLeft = 0;
        $studentLimit = 5; // Default

        if ($sub) {
            $endDate = new DateTime($sub['end_date']);
            $diff = $today->diff($endDate);
            $daysLeft = intval($diff->format('%r%a'));
            if ($daysLeft < 0) $status = 'expired';
            $studentLimit = intval($sub['student_limit']);
        } else {
            // No subscription record -> trial or expired?
            // Let's assume trial/expired if no record found, or create default
            $status = 'no_sub';
        }

        $result[] = [
            'id' => $tid,
            'name' => $t['firstName'] . ' ' . $t['lastName'],
            'email' => $t['email'],
            'phone' => $t['phone'],
            'subscription' => [
                'status' => $status,
                'daysLeft' => $daysLeft,
                'endDate' => $sub ? $sub['end_date'] : null,
                'studentLimit' => $studentLimit
            ],
            'lastPayment' => $lastPay ? [
                'amount' => floatval($lastPay['amount']),
                'date' => $lastPay['paid_at'],
                'package' => $lastPay['package_id']
            ] : null
        ];
    }

    echo json_encode(['success' => true, 'teachers' => $result]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası', 'error' => $e->getMessage()]);
}
