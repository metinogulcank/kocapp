<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Farklı rollerdeki kullanıcı sayılarını al (Türkçe rol isimleri kullanılıyor)
    $total_students = $db->query("SELECT COUNT(*) FROM users WHERE role = 'ogrenci'")->fetchColumn();
    $total_teachers = $db->query("SELECT COUNT(*) FROM users WHERE role = 'ogretmen'")->fetchColumn();
    $total_parents = $db->query("SELECT COUNT(*) FROM users WHERE role = 'veli'")->fetchColumn();
    $total_users = $total_students + $total_teachers + $total_parents;

    // Bugün yeni kayıt olan kullanıcı sayısı
    $today_registrations = $db->query("SELECT COUNT(*) FROM users WHERE DATE(createdAt) = CURDATE()")->fetchColumn();

    // Son 5 dakikada aktif olan kullanıcılar (updatedAt güncelleniyorsa)
    $online_students = $db->query("SELECT COUNT(*) FROM users WHERE role = 'ogrenci' AND updatedAt > NOW() - INTERVAL 5 MINUTE")->fetchColumn();
    $online_teachers = $db->query("SELECT COUNT(*) FROM users WHERE role = 'ogretmen' AND updatedAt > NOW() - INTERVAL 5 MINUTE")->fetchColumn();

    // Bugün giriş yapan toplam kullanıcı sayısı (updatedAt login'de güncellenmeli)
    $today_logins = $db->query("SELECT COUNT(*) FROM users WHERE DATE(updatedAt) = CURDATE()")->fetchColumn();

    // Son 5 kaydı al
    $recent_users_stmt = $db->query("SELECT _id as id, CONCAT(firstName, ' ', lastName) as name, role, createdAt FROM users ORDER BY createdAt DESC LIMIT 5");
    $recent_users = $recent_users_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Rol isimlerini formatla
    foreach ($recent_users as &$user) {
        $user['created_at'] = $user['createdAt'];
        unset($user['createdAt']);

        switch ($user['role']) {
            case 'ogrenci':
                $user['role'] = 'Öğrenci';
                break;
            case 'ogretmen':
                $user['role'] = 'Öğretmen';
                break;
            case 'veli':
                $user['role'] = 'Veli';
                break;
            case 'admin':
                $user['role'] = 'Yönetici';
                break;
        }
    }
    unset($user);

    // --- Grafikler için Veriler ---

    // 1. Haftalık Kayıt (Son 7 gün)
    $weekly_stats = [];
    $stmt = $db->query("
        SELECT DATE(createdAt) as date, COUNT(*) as count 
        FROM users 
        WHERE createdAt >= DATE(NOW()) - INTERVAL 7 DAY 
        GROUP BY DATE(createdAt) 
        ORDER BY date ASC
    ");
    $weekly_data = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // [date => count]

    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $weekly_stats[] = [
            'name' => date('d.m', strtotime($date)), // Gün.Ay formatı
            'kayit' => isset($weekly_data[$date]) ? (int)$weekly_data[$date] : 0
        ];
    }

    // 2. Büyüme Trendleri (Son 6 ay)
    $growth_stats = [];
    $stmt = $db->query("
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count 
        FROM users 
        WHERE createdAt >= DATE(NOW()) - INTERVAL 6 MONTH 
        GROUP BY month 
        ORDER BY month ASC
    ");
    $monthly_data = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // [YYYY-MM => count]

    for ($i = 5; $i >= 0; $i--) {
        $monthKey = date('Y-m', strtotime("-$i months")); // YYYY-MM
        $monthName = date('M', strtotime("-$i months")); // Jan, Feb vs. (Türkçe için array kullanabiliriz)
        
        // Türkçe Ay İsimleri
        $turkishMonths = [
            'Jan' => 'Oca', 'Feb' => 'Şub', 'Mar' => 'Mar', 'Apr' => 'Nis', 'May' => 'May', 'Jun' => 'Haz',
            'Jul' => 'Tem', 'Aug' => 'Ağu', 'Sep' => 'Eyl', 'Oct' => 'Eki', 'Nov' => 'Kas', 'Dec' => 'Ara'
        ];
        $displayMonth = $turkishMonths[$monthName] ?? $monthName;

        $growth_stats[] = [
            'name' => $displayMonth,
            'kullanici' => isset($monthly_data[$monthKey]) ? (int)$monthly_data[$monthKey] : 0
        ];
    }

    $data = [
        'total_users' => (int)$total_users,
        'total_students' => (int)$total_students,
        'total_teachers' => (int)$total_teachers,
        'total_parents' => (int)$total_parents,
        'new_registrations' => (int)$today_registrations,
        'online_students' => (int)$online_students,
        'online_teachers' => (int)$online_teachers,
        'today_logins' => (int)$today_logins,
        'recent_users' => $recent_users,
        'weekly_stats' => $weekly_stats,
        'growth_stats' => $growth_stats
    ];

    echo json_encode(['success' => true, 'data' => $data]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı sorgu hatası: ' . $e->getMessage()]);
}

?>