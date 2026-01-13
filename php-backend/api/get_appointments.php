<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['teacher_id'])) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Teacher ID is required."));
    exit;
}

$teacher_id = $_GET['teacher_id'];

// Optional: Filter by month/year if needed in future
// $month = isset($_GET['month']) ? $_GET['month'] : date('m');
// $year = isset($_GET['year']) ? $_GET['year'] : date('Y');

$query = "SELECT a.*, o.firstName, o.lastName 
          FROM appointments a
          LEFT JOIN ogrenciler o ON a.student_id = o.id
          WHERE a.teacher_id = :teacher_id
          ORDER BY a.date ASC, a.time ASC";

$stmt = $db->prepare($query);
$stmt->bindParam(':teacher_id', $teacher_id);
$stmt->execute();

$appointments = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $appt_item = array(
        "id" => $row['id'],
        "student_id" => $row['student_id'],
        "student_name" => $row['firstName'] . ' ' . $row['lastName'],
        "date" => $row['date'],
        "time" => substr($row['time'], 0, 5), // HH:MM format
        "subject" => $row['subject']
    );
    array_push($appointments, $appt_item);
}

http_response_code(200);
echo json_encode(array("success" => true, "appointments" => $appointments));
?>
