<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$alan = isset($_GET['alan']) ? $_GET['alan'] : '';

if (empty($alan)) {
    echo json_encode(['success' => false, 'message' => 'Alan parametresi gerekli']);
    exit;
}

try {
    $db = (new Database())->getConnection();
    $subjects = [];

    if ($alan === 'all') {
        $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri ORDER BY ders_adi ASC");
        $stmt->execute();
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Virgülle ayrılmış birden fazla alan olabilir
        $alanlar = explode(',', $alan);
        foreach ($alanlar as $tekAlan) {
            $tekAlan = trim($tekAlan);
            if (empty($tekAlan)) continue;

            if (strpos($tekAlan, 'comp_') === 0) {
                $compId = str_replace('comp_', '', $tekAlan);
                
                // Önce bileşenin kendi derslerini getir
                $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
                $stmt->execute([$compId]);
                $compSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $subjects = array_merge($subjects, $compSubjects);

                // Üst bileşenleri ve ana sınavı bul
                $currentCompId = $compId;
                while ($currentCompId) {
                    $stmtParent = $db->prepare("SELECT parent_id, sinav_id FROM sinav_bilesenleri WHERE id = ?");
                    $stmtParent->execute([$currentCompId]);
                    $compInfo = $stmtParent->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$compInfo) break;
                    
                    if ($compInfo['parent_id']) {
                        $currentCompId = $compInfo['parent_id'];
                        $stmtUpper = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
                        $stmtUpper->execute([$currentCompId]);
                        $upperSubjects = $stmtUpper->fetchAll(PDO::FETCH_ASSOC);
                        $subjects = array_merge($subjects, $upperSubjects);
                    } else {
                        // Ana sınavın derslerini getir
                        $stmtExam = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE sinav_id = ? AND (component_id IS NULL OR component_id = '') ORDER BY sira ASC, ders_adi ASC");
                        $stmtExam->execute([$compInfo['sinav_id']]);
                        $examSubjects = $stmtExam->fetchAll(PDO::FETCH_ASSOC);
                        $subjects = array_merge($subjects, $examSubjects);
                        break;
                    }
                }
            } elseif (strpos($tekAlan, 'exam_') === 0) {
                $examId = str_replace('exam_', '', $tekAlan);
                $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE sinav_id = ? AND (component_id IS NULL OR component_id = '') ORDER BY sira ASC, ders_adi ASC");
                $stmt->execute([$examId]);
                $examSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $subjects = array_merge($subjects, $examSubjects);
            } else {
                // Prefix yoksa hem bilesen hem sinav hem de legacy olarak dene
                $processed = false;

                // 1. Önce doğrudan bileşen ID'si olarak dene
                $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
                $stmt->execute([$tekAlan]);
                $compSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($compSubjects) {
                    $subjects = array_merge($subjects, $compSubjects);
                    $processed = true;
                    
                    // Üst bileşenleri de getir
                    $currentCompId = $tekAlan;
                    while ($currentCompId) {
                        $stmtParent = $db->prepare("SELECT parent_id, sinav_id FROM sinav_bilesenleri WHERE id = ?");
                        $stmtParent->execute([$currentCompId]);
                        $compInfo = $stmtParent->fetch(PDO::FETCH_ASSOC);
                        if (!$compInfo) break;
                        
                        if ($compInfo['parent_id']) {
                            $currentCompId = $compInfo['parent_id'];
                            $stmtUpper = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
                            $stmtUpper->execute([$currentCompId]);
                            $upperSubjects = $stmtUpper->fetchAll(PDO::FETCH_ASSOC);
                            $subjects = array_merge($subjects, $upperSubjects);
                        } else {
                            $stmtExam = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE sinav_id = ? AND (component_id IS NULL OR component_id = '') ORDER BY sira ASC, ders_adi ASC");
                            $stmtExam->execute([$compInfo['sinav_id']]);
                            $examSubjects = $stmtExam->fetchAll(PDO::FETCH_ASSOC);
                            $subjects = array_merge($subjects, $examSubjects);
                            break;
                        }
                    }
                }

                // 2. Sınav ID'si olarak dene
                if (!$processed) {
                    $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE sinav_id = ? AND (component_id IS NULL OR component_id = '') ORDER BY sira ASC, ders_adi ASC");
                    $stmt->execute([$tekAlan]);
                    $examSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    if ($examSubjects) {
                        $subjects = array_merge($subjects, $examSubjects);
                        $processed = true;
                    }
                }

                // 3. Eski tip alan adları (sayisal, sozel vb.)
                if (!$processed) {
                    $searchTerm = '';
                    if ($tekAlan === 'sayisal' || $tekAlan === 'yks_say') $searchTerm = 'Sayısal';
                    elseif ($tekAlan === 'sozel' || $tekAlan === 'yks_soz') $searchTerm = 'Sözel';
                    elseif ($tekAlan === 'esit_agirlik' || $tekAlan === 'yks_ea') $searchTerm = 'Eşit Ağırlık';
                    elseif ($tekAlan === 'dil' || $tekAlan === 'yks_dil') $searchTerm = 'Dil';
                    elseif ($tekAlan === 'lgs') $searchTerm = 'LGS';

                    if ($searchTerm) {
                        $stmt = $db->prepare("SELECT id FROM sinav_bilesenleri WHERE ad COLLATE utf8mb4_turkish_ci LIKE ? LIMIT 1");
                        $stmt->execute(['%' . $searchTerm . '%']);
                        $compId = $stmt->fetchColumn();

                        if ($compId) {
                            $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
                            $stmt->execute([$compId]);
                            $compSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                            $subjects = array_merge($subjects, $compSubjects);
                        } else {
                            $stmt = $db->prepare("SELECT id FROM sinavlar WHERE ad COLLATE utf8mb4_turkish_ci LIKE ? LIMIT 1");
                            $stmt->execute(['%' . $searchTerm . '%']);
                            $examId = $stmt->fetchColumn();
                            if ($examId) {
                                $stmt = $db->prepare("SELECT id, ders_adi, color, icon_url FROM sinav_dersleri WHERE sinav_id = ? ORDER BY sira ASC, ders_adi ASC");
                                $stmt->execute([$examId]);
                                $examSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                                $subjects = array_merge($subjects, $examSubjects);
                            }
                        }
                    }
                }
            }
        }
    }

    // Tekilleştir (aynı isimli dersler olabilir, id'ler farklı olsa da)
    $uniqueSubjects = [];
    $seenNames = [];
    foreach ($subjects as $s) {
        if (!in_array($s['ders_adi'], $seenNames)) {
            $uniqueSubjects[] = $s;
            $seenNames[] = $s['ders_adi'];
        }
    }

    echo json_encode([
        'success' => true,
        'subjects' => $uniqueSubjects
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Hata: ' . $e->getMessage()]);
}
