<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->teacher_id) &&
    !empty($data->student_id) &&
    !empty($data->date) &&
    !empty($data->time) &&
    !empty($data->subject)
){
    try {
        $db->beginTransaction();

        // 1. Create Appointment
        $query = "INSERT INTO appointments SET teacher_id=:teacher_id, student_id=:student_id, date=:date, time=:time, subject=:subject";
        $stmt = $db->prepare($query);

        $stmt->bindParam(":teacher_id", $data->teacher_id);
        $stmt->bindParam(":student_id", $data->student_id);
        $stmt->bindParam(":date", $data->date);
        $stmt->bindParam(":time", $data->time);
        $stmt->bindParam(":subject", $data->subject);

        if($stmt->execute()){
            // 2. Create Notification (Logic copied from create_notification.php to ensure consistency)
            
            // Notification details
            $title = "Yeni Randevu Oluşturuldu";
            $message = "Tarih: " . date("d.m.Y", strtotime($data->date)) . " Saat: " . $data->time . " - Konu: " . $data->subject;
            $sender_id = $data->teacher_id;
            $sender_type = 'teacher';
            $recipient_type = 'student';
            $recipient_id = $data->student_id;
            $type = 'meeting';
            $priority = 'high';

            // Insert into notifications table
            $notif_query = "INSERT INTO notifications 
                (sender_id, sender_type, recipient_type, recipient_id, title, message, type, priority, created_at) 
                VALUES (:sender_id, :sender_type, :recipient_type, :recipient_id, :title, :message, :type, :priority, NOW())";
            
            $notif_stmt = $db->prepare($notif_query);
            $notif_stmt->bindParam(':sender_id', $sender_id);
            $notif_stmt->bindParam(':sender_type', $sender_type);
            $notif_stmt->bindParam(':recipient_type', $recipient_type);
            $notif_stmt->bindParam(':recipient_id', $recipient_id);
            $notif_stmt->bindParam(':title', $title);
            $notif_stmt->bindParam(':message', $message);
            $notif_stmt->bindParam(':type', $type);
            $notif_stmt->bindParam(':priority', $priority);
            
            if($notif_stmt->execute()){
                $notification_id = $db->lastInsertId();

                // Send to Student
                $user_notif_query = "INSERT INTO user_notifications (user_id, user_type, notification_id, is_read) VALUES (:user_id, 'student', :notification_id, 0)";
                $un_stmt = $db->prepare($user_notif_query);
                $un_stmt->bindParam(':user_id', $recipient_id);
                $un_stmt->bindParam(':notification_id', $notification_id);
                $un_stmt->execute();

                // Send to Parent (if exists)
                $parent_query = "SELECT veli_id FROM ogrenciler WHERE id = :student_id AND veli_id IS NOT NULL";
                $parent_stmt = $db->prepare($parent_query);
                $parent_stmt->bindParam(':student_id', $recipient_id);
                $parent_stmt->execute();

                if ($parent = $parent_stmt->fetch(PDO::FETCH_ASSOC)) {
                    $parent_notif_query = "INSERT INTO user_notifications (user_id, user_type, notification_id, is_read) VALUES (:user_id, 'parent', :notification_id, 0)";
                    $pn_stmt = $db->prepare($parent_notif_query);
                    $pn_stmt->bindParam(':user_id', $parent['veli_id']);
                    $pn_stmt->bindParam(':notification_id', $notification_id);
                    $pn_stmt->execute();
                }

                $db->commit();
                http_response_code(201);
                echo json_encode(array("success" => true, "message" => "Randevu oluşturuldu ve bildirimler gönderildi."));
            } else {
                throw new Exception("Bildirim oluşturulamadı.");
            }

        } else {
            throw new Exception("Randevu kaydedilemedi.");
        }
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Hata: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Eksik veri."));
}
?>
