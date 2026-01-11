<?php
ob_clean();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

function fetchValue($db, $query, $params = []) {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $val = $stmt->fetchColumn();
    return $val ? intval($val) : 0;
}

function buildMonthlySeries($db, $query, $params = []) {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $map = [];
    foreach ($rows as $r) {
        $map[$r['ym']] = intval($r['c']);
    }
    $series = [];
    $now = new DateTime('first day of this month');
    for ($i = 11; $i >= 0; $i--) {
        $d = clone $now;
        $d->modify("-$i months");
        $key = $d->format('Y-m');
        $series[] = isset($map[$key]) ? $map[$key] : 0;
    }
    return $series;
}

try {
    $teacherCount = fetchValue($db, "SELECT COUNT(*) FROM users WHERE role = 'ogretmen'");
    $parentCount = fetchValue($db, "SELECT COUNT(*) FROM users WHERE role = 'veli'");
    $studentCount = fetchValue($db, "SELECT COUNT(*) FROM ogrenciler");
    $totalUsers = $teacherCount + $parentCount + $studentCount;

    $usersTrend = buildMonthlySeries(
        $db,
        "SELECT DATE_FORMAT(createdAt, '%Y-%m') AS ym, COUNT(*) AS c 
         FROM (
           SELECT createdAt FROM users WHERE role IN ('ogretmen','veli') AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
           UNION ALL
           SELECT createdAt FROM ogrenciler WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         ) t
         GROUP BY ym"
    );

    $studentsTrend = buildMonthlySeries(
        $db,
        "SELECT DATE_FORMAT(createdAt, '%Y-%m') AS ym, COUNT(*) AS c 
         FROM ogrenciler 
         WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY ym"
    );

    $teachersTrend = buildMonthlySeries(
        $db,
        "SELECT DATE_FORMAT(createdAt, '%Y-%m') AS ym, COUNT(*) AS c 
         FROM users 
         WHERE role = 'ogretmen' AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY ym"
    );

    $stmt = $db->prepare("
        SELECT DAYOFWEEK(createdAt) AS dow, COUNT(*) AS c 
        FROM (
          SELECT createdAt FROM users WHERE role IN ('ogretmen','veli') AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          UNION ALL
          SELECT createdAt FROM ogrenciler WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) t
        GROUP BY dow
    ");
    $stmt->execute();
    $weeklyMap = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $weeklyMap[intval($row['dow'])] = intval($row['c']);
    }
    $weekly = [];
    for ($i = 1; $i <= 7; $i++) {
        $weekly[] = isset($weeklyMap[$i]) ? $weeklyMap[$i] : 0;
    }

    $stmt = $db->prepare("
        SELECT firstName, lastName, 'ogrenci' AS role, createdAt AS date 
        FROM ogrenciler
        UNION ALL
        SELECT firstName, lastName, role, createdAt AS date 
        FROM users 
        WHERE role IN ('ogretmen','veli')
        ORDER BY date DESC
        LIMIT 10
    ");
    $stmt->execute();
    $recent = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $recent[] = [
            'name' => trim(($row['firstName'] ?? '') . ' ' . ($row['lastName'] ?? '')),
            'role' => $row['role'],
            'date' => $row['date']
        ];
    }

    $onlineStudents = fetchValue($db, "SELECT COUNT(*) FROM ogrenciler WHERE online_status = 1");
    $loginToday = fetchValue($db, "SELECT COUNT(*) FROM ogrenciler WHERE DATE(son_giris_tarihi) = CURDATE()");
    $newRegistrations = fetchValue($db, "SELECT COUNT(*) FROM (
        SELECT createdAt FROM ogrenciler WHERE DATE(createdAt) = CURDATE()
        UNION ALL
        SELECT createdAt FROM users WHERE DATE(createdAt) = CURDATE() AND role IN ('ogretmen','veli')
    ) t");

    echo json_encode([
        'success' => true,
        'metrics' => [
            'totalUsers' => $totalUsers,
            'students' => $studentCount,
            'teachers' => $teacherCount,
            'parents' => $parentCount
        ],
        'trends' => [
            'users' => $usersTrend,
            'students' => $studentsTrend,
            'teachers' => $teachersTrend
        ],
        'weeklySignups' => $weekly,
        'recent' => $recent,
        'active' => [
            'onlineStudents' => $onlineStudents,
            'onlineTeachers' => 0,
            'loginToday' => $loginToday,
            'newRegistrations' => $newRegistrations
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
