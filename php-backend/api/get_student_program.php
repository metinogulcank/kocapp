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

try {
    $studentId = isset($_GET['studentId']) ? $_GET['studentId'] : null;
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;

    if (!$studentId || !$startDate || !$endDate) {
        echo json_encode([
            'success' => false,
            'message' => 'Eksik parametreler'
        ]);
        exit;
    }

    $programQuery = "SELECT id, ogrenci_id, ogretmen_id, routine_id, tarih, baslangic_saati, bitis_saati, 
                            program_tipi, ders, konu, kaynak, aciklama, soru_sayisi, durum, 
                            dogru, yanlis, bos, youtube_linki
                     FROM ogrenci_programlari 
                     WHERE ogrenci_id = ? 
                     AND tarih >= ? 
                     AND tarih <= ? 
                     ORDER BY tarih ASC, baslangic_saati ASC";

    $programStmt = $db->prepare($programQuery);
    $programStmt->execute([$studentId, $startDate, $endDate]);
    $programs = $programStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Soru çözümü programlarının dogru/yanlis/bos değerlerini logla
    foreach ($programs as $prog) {
        if ($prog['program_tipi'] === 'soru_cozum') {
            error_log("Program {$prog['id']}: dogru={$prog['dogru']}, yanlis={$prog['yanlis']}, bos={$prog['bos']}");
        }
    }

    // Aktif rutinleri çek ve ilgili günleri hesapla
    $routineQuery = "SELECT * FROM ogrenci_rutinleri 
                     WHERE ogrenci_id = ? 
                     AND aktif = 1";
    $routineStmt = $db->prepare($routineQuery);
    $routineStmt->execute([$studentId]);
    $routines = $routineStmt->fetchAll(PDO::FETCH_ASSOC);

    // Rutin durumlarını ve atlanan günlerini çek
    $routineStatusQuery = "SELECT routine_id, tarih, durum 
                           FROM ogrenci_rutin_durumlari
                           WHERE ogrenci_id = ?
                           AND tarih >= ?
                           AND tarih <= ?";
    $routineStatusStmt = $db->prepare($routineStatusQuery);
    $routineStatusStmt->execute([$studentId, $startDate, $endDate]);
    $routineStatuses = [];
    while ($row = $routineStatusStmt->fetch(PDO::FETCH_ASSOC)) {
        $routineStatuses[$row['routine_id'] . '|' . $row['tarih']] = $row['durum'];
    }

    $routineSkipQuery = "SELECT routine_id, tarih 
                         FROM ogrenci_rutin_skipleri
                         WHERE ogrenci_id = ?
                         AND tarih >= ?
                         AND tarih <= ?";
    $routineSkipStmt = $db->prepare($routineSkipQuery);
    $routineSkipStmt->execute([$studentId, $startDate, $endDate]);
    $routineSkips = [];
    while ($row = $routineSkipStmt->fetch(PDO::FETCH_ASSOC)) {
        $routineSkips[$row['routine_id'] . '|' . $row['tarih']] = true;
    }

    if (!empty($routines)) {
        $startTimestamp = strtotime($startDate);
        $endTimestamp = strtotime($endDate);

        $existingKeys = [];
        foreach ($programs as $program) {
            $key = implode('|', [
                $program['routine_id'] ?? '',
                $program['tarih'],
                $program['baslangic_saati']
            ]);
            $existingKeys[$key] = true;
        }

        foreach ($routines as $routine) {
            $days = json_decode($routine['gunler'], true);
            if (!is_array($days) || empty($days)) {
                continue;
            }

            $normalizedDays = array_map(static function ($day) {
                return (int) $day;
            }, $days);

            // Ensure we iterate through all days in the week range
            // Use DateTime for more reliable date calculations
            $currentDate = new DateTime($startDate);
            $endDateObj = new DateTime($endDate);
            $endDateObj->modify('+1 day'); // Include end date
            
            while ($currentDate < $endDateObj) {
                // Get day of week: 1 (Monday) to 7 (Sunday) - ISO-8601
                $dayNumber = (int) $currentDate->format('N');
                
                // Check if this day is in the routine's days
                if (in_array($dayNumber, $normalizedDays, true)) {
                    $tarih = $currentDate->format('Y-m-d');
                    $key = implode('|', [
                        $routine['id'],
                        $tarih,
                        $routine['baslangic_saati']
                    ]);

                    // Skip if bu tarihte kullanıcı rutini kaldırdıysa
                    if (isset($routineSkips[$routine['id'] . '|' . $tarih])) {
                        $currentDate->modify('+1 day');
                        continue;
                    }

                    // Only add if it doesn't already exist
                    if (!isset($existingKeys[$key])) {
                        $statusKey = $routine['id'] . '|' . $tarih;
                        $routineStatus = $routineStatuses[$statusKey] ?? 'yapilmadi';

                        // Bu rutin programı için ogrenci_programlari tablosunda kayıt var mı kontrol et
                        $routineProgramQuery = "SELECT * FROM ogrenci_programlari 
                                               WHERE routine_id = ? AND ogrenci_id = ? AND tarih = ?";
                        $routineProgramStmt = $db->prepare($routineProgramQuery);
                        $routineProgramStmt->execute([$routine['id'], $studentId, $tarih]);
                        $routineProgram = $routineProgramStmt->fetch(PDO::FETCH_ASSOC);

                        if ($routineProgram) {
                            // ogrenci_programlari tablosunda kayıt varsa, o kaydı kullan
                            $programs[] = [
                                'id' => $routineProgram['id'],
                                'ogrenci_id' => $routineProgram['ogrenci_id'],
                                'ogretmen_id' => $routineProgram['ogretmen_id'],
                                'routine_id' => $routineProgram['routine_id'],
                                'tarih' => $routineProgram['tarih'],
                                'baslangic_saati' => $routineProgram['baslangic_saati'],
                                'bitis_saati' => $routineProgram['bitis_saati'],
                                'program_tipi' => $routineProgram['program_tipi'],
                                'ders' => $routineProgram['ders'],
                                'konu' => $routineProgram['konu'],
                                'kaynak' => $routineProgram['kaynak'],
                                'aciklama' => $routineProgram['aciklama'] ?? null,
                                'soru_sayisi' => $routineProgram['soru_sayisi'],
                                'durum' => $routineProgram['durum'],
                                'dogru' => $routineProgram['dogru'],
                                'yanlis' => $routineProgram['yanlis'],
                                'bos' => $routineProgram['bos'],
                                'is_routine' => true
                            ];
                        } else {
                            // ogrenci_programlari tablosunda kayıt yoksa, rutin bilgilerini kullan
                            $programs[] = [
                                'id' => 'routine_' . $routine['id'] . '_' . $tarih,
                                'ogrenci_id' => $routine['ogrenci_id'],
                                'ogretmen_id' => $routine['ogretmen_id'],
                                'routine_id' => $routine['id'],
                                'tarih' => $tarih,
                                'baslangic_saati' => $routine['baslangic_saati'],
                                'bitis_saati' => $routine['baslangic_saati'],
                                'program_tipi' => $routine['program_tipi'],
                                'ders' => $routine['ders'],
                                'konu' => $routine['konu'],
                                'kaynak' => $routine['kaynak'],
                                'aciklama' => $routine['aciklama'] ?? null,
                                'soru_sayisi' => $routine['soru_sayisi'],
                                'durum' => $routineStatus,
                                'dogru' => null,
                                'yanlis' => null,
                                'bos' => null,
                                'is_routine' => true
                            ];
                        }
                        
                        // Add to existing keys to prevent duplicates
                        $existingKeys[$key] = true;
                    }
                }
                
                // Move to next day
                $currentDate->modify('+1 day');
            }
        }

        usort($programs, function ($a, $b) {
            $dateComparison = strcmp($a['tarih'], $b['tarih']);
            if ($dateComparison !== 0) {
                return $dateComparison;
            }
            return strcmp($a['baslangic_saati'] ?? '', $b['baslangic_saati'] ?? '');
        });
    }

    echo json_encode([
        'success' => true,
        'programs' => $programs
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>

