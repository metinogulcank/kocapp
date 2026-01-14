<?php
foreach (headers_list() as $header) {
    header_remove(strstr($header, ':', true));
}

header('Content-Type: application/json; charset=UTF-8');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        echo json_encode(['success' => false, 'message' => 'Geçersiz istek gövdesi']);
        exit;
    }

    $studentId = isset($data['studentId']) ? $data['studentId'] : null;
    $teacherId = isset($data['teacherId']) ? $data['teacherId'] : null;
    $weekStart = isset($data['weekStart']) ? $data['weekStart'] : null;
    $teacherComment = isset($data['teacherComment']) ? $data['teacherComment'] : '';
    $aiComment = isset($data['aiComment']) ? $data['aiComment'] : '';
    $source = isset($data['source']) ? $data['source'] : 'teacher';

    if (!$studentId || !$teacherId || !$weekStart) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $weekStartDate = date_create($weekStart);
    if ($weekStartDate === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz hafta başlangıç tarihi'
        ]);
        exit;
    }
    $weekStartFormatted = $weekStartDate->format('d.m.Y');

    $db = (new Database())->getConnection();

    $stmtStudent = $db->prepare("SELECT firstName, lastName FROM ogrenciler WHERE id = ? LIMIT 1");
    $stmtStudent->execute([$studentId]);
    $student = $stmtStudent->fetch(PDO::FETCH_ASSOC);

    $studentName = $student ? ($student['firstName'] . ' ' . $student['lastName']) : 'Öğrenciniz';

    $title = "Haftalık Analiz - " . $studentName;

    $messageParts = [];
    $messageParts[] = "Hafta: " . $weekStartFormatted . " itibariyle";
    if ($teacherComment) {
        $messageParts[] = "Öğretmen Yorumu:\n" . $teacherComment;
    }
    if ($aiComment) {
        $messageParts[] = "AI Yorumu:\n" . $aiComment;
    }
    $message = implode("\n\n", $messageParts);

    if (trim($message) === '') {
        $message = "Bu hafta için analiz yorumları eklendi.";
    }

    $db->beginTransaction();

    $notificationQuery = "
        INSERT INTO notifications
        (sender_id, sender_type, recipient_type, recipient_id, title, message, type, priority, scheduled_at, created_at)
        VALUES (:sender_id, :sender_type, :recipient_type, :recipient_id, :title, :message, :type, :priority, :scheduled_at, NOW())
    ";

    $senderId = $teacherId;
    $senderType = 'teacher';
    $recipientType = 'parent';
    $recipientId = $studentId;
    $type = 'announcement';
    $priority = 'medium';
    $scheduledAt = null;

    $stmtNotif = $db->prepare($notificationQuery);
    $stmtNotif->bindParam(':sender_id', $senderId);
    $stmtNotif->bindParam(':sender_type', $senderType);
    $stmtNotif->bindParam(':recipient_type', $recipientType);
    $stmtNotif->bindParam(':recipient_id', $recipientId);
    $stmtNotif->bindParam(':title', $title);
    $stmtNotif->bindParam(':message', $message);
    $stmtNotif->bindParam(':type', $type);
    $stmtNotif->bindParam(':priority', $priority);
    $stmtNotif->bindParam(':scheduled_at', $scheduledAt);
    $stmtNotif->execute();

    $notificationId = $db->lastInsertId();

    $userIds = [];

    $parentQuery = "SELECT veli_id FROM ogrenciler WHERE id = :student_id AND veli_id IS NOT NULL";
    $parentStmt = $db->prepare($parentQuery);
    $parentStmt->bindParam(':student_id', $studentId);
    $parentStmt->execute();
    if ($parent = $parentStmt->fetch(PDO::FETCH_ASSOC)) {
        $userIds[] = ['user_id' => $parent['veli_id'], 'user_type' => 'parent'];
    }

    if (!empty($userIds)) {
        $userNotifQuery = "
            INSERT INTO user_notifications (user_id, user_type, notification_id, is_read)
            VALUES (:user_id, :user_type, :notification_id, FALSE)
        ";
        $userStmt = $db->prepare($userNotifQuery);
        foreach ($userIds as $u) {
            $userStmt->bindParam(':user_id', $u['user_id']);
            $userStmt->bindParam(':user_type', $u['user_type']);
            $userStmt->bindParam(':notification_id', $notificationId);
            $userStmt->execute();
        }
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Haftalık analiz bildirimi velilere gönderildi.'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Hata: ' . $e->getMessage()
    ]);
}
