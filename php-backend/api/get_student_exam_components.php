<?php
ob_start();
if (ob_get_length()) ob_clean();

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$studentId = isset($_GET['studentId']) ? $_GET['studentId'] : '';

if (empty($studentId)) {
    echo json_encode(['success' => false, 'message' => 'studentId parametresi gerekli']);
    exit;
}

try {
    $db = (new Database())->getConnection();
    $debug = []; // Hata ayıklama dizisi

    // 1. Öğrencinin alanını bul
    $stmt = $db->prepare("SELECT alan FROM ogrenciler WHERE id = ?");
    $stmt->execute([$studentId]);
    $studentAlan = $stmt->fetchColumn();
    $debug[] = "Ogrenci ID: " . $studentId . " -> Alan: " . ($studentAlan ?: 'Bulunamadi');

    if (!$studentAlan) {
        // Öğrenci alanı bulunamadı, boş sonuç dön.
        echo json_encode(['success' => true, 'exam' => null, 'components' => [], 'debug' => $debug]);
        exit;
    }

    $examInfo = null;
    $components = [];
    $mainComponentId = null;

    // 2. Determine exam/components based on student's 'alan'
    if (strpos($studentAlan, 'comp_') === 0) {
        // New system: 'alan' is 'comp_MAIN_COMPONENT_ID'
        $mainComponentId = str_replace('comp_', '', $studentAlan);
        $debug[] = "Yeni sistem (comp_) algilandi. Ana Bilesen ID: " . $mainComponentId;

        // Get the main exam info from the component
        $stmt = $db->prepare("SELECT s.id, s.ad FROM sinavlar s JOIN sinav_bilesenleri b ON s.id = b.sinav_id WHERE b.id = ?");
        $stmt->execute([$mainComponentId]);
        $examInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $debug[] = "Ana bilesenden sinav bilgisi sorgulandi. Sonuc: " . json_encode($examInfo);

        // Find sub-components (children) of the main component
        $stmt = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE parent_id = ? ORDER BY sira ASC, ad ASC");
        $stmt->execute([$mainComponentId]);
        $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $debug[] = "Alt bilesenler (cocuklar) sorgulandi. Sonuc: " . json_encode($components);

        // If no sub-components, the main component is the only one
        if (empty($components)) {
            $stmt = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE id = ?");
            $stmt->execute([$mainComponentId]);
            $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $debug[] = "Alt bilesen yok, ana bilesenin kendisi kullanildi. Sonuc: " . json_encode($components);
        }

    } elseif (strpos($studentAlan, 'exam_') === 0) {
        // New system: 'alan' is 'exam_EXAM_ID'
        $examId = str_replace('exam_', '', $studentAlan);
        $debug[] = "Yeni sistem (exam_) algilandi. Sinav ID: " . $examId;

        // Get exam info directly using the ID
        $stmt = $db->prepare("SELECT id, ad FROM sinavlar WHERE id = ?");
        $stmt->execute([$examId]);
        $examInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $debug[] = "Sinav bilgisi dogrudan ID ile sorgulandi. Sonuc: " . json_encode($examInfo);

        if ($examInfo) {
            // Found the exam. Now, get its components.
            // First, check for sub-components (like TYT/AYT under a 'YKS SAYISAL' parent component)
            $stmt = $db->prepare("
                SELECT id FROM sinav_bilesenleri 
                WHERE sinav_id = ? AND ad = ? AND parent_id IS NULL LIMIT 1
            ");
            $stmt->execute([$examInfo['id'], $examInfo['ad']]);
            $parentCompId = $stmt->fetchColumn();
            $debug[] = "Ana bilesen (parent) arandi. ID: " . ($parentCompId ?: 'Bulunamadi');

            if ($parentCompId) {
                // It's a parent component, get its children.
                $stmt = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE parent_id = ? ORDER BY sira ASC, ad ASC");
                $stmt->execute([$parentCompId]);
                $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $debug[] = "Ana bilesenin alt bilesenleri (cocuklar) arandi. Sonuc: " . json_encode($components);
            }
            
            // If no child components were found, it's a direct exam like KPSS.
            // Get all components directly under the exam.
            if (empty($components)) {
                $debug[] = "Alt bilesen bulunamadi, dogrudan sinava bagli bilesenler araniyor.";
                $stmt = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE sinav_id = ? ORDER BY sira ASC, ad ASC");
                $stmt->execute([$examInfo['id']]);
                $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $debug[] = "Dogrudan sinav bilesenleri arama sonucu: " . json_encode($components);
            }
        }
    } else {
        // Legacy system: 'alan' is a text like 'kpss', 'yks_say'
        $debug[] = "Eski sistem (metin tabanli alan) algilandi.";
        $alanMap = [
            'sayisal' => 'YKS SAYISAL', 'yks_say' => 'YKS SAYISAL',
            'sozel' => 'YKS SÖZEL', 'yks_soz' => 'YKS SÖZEL',
            'esit_agirlik' => 'YKS EŞİT AĞIRLIK', 'yks_ea' => 'YKS EŞİT AĞIRLIK',
            'dil' => 'YKS DİL', 'yks_dil' => 'YKS DİL',
            'lgs' => 'LGS',
            'kpss' => 'KPSS'
        ];

        if (isset($alanMap[$studentAlan])) {
            $examNameToFind = $alanMap[$studentAlan];
            $debug[] = "Alan eslesmesi bulundu: " . $studentAlan . " -> " . $examNameToFind;

        // Find the most recent exam matching the name with LIKE for flexibility
        $stmt = $db->prepare("SELECT id, ad FROM sinavlar WHERE ad LIKE ? ORDER BY id DESC LIMIT 1");
        $stmt->execute(['%' . $examNameToFind . '%']);
        $examInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $debug[] = "Veritabaninda sinav arandi (LIKE %$examNameToFind%). Sonuc: " . json_encode($examInfo);

        if ($examInfo) {
            // Found the exam. Now, get its components.
            // First, check for sub-components (like TYT/AYT under a 'YKS SAYISAL' parent component)
            $stmt = $db->prepare("
                SELECT id FROM sinav_bilesenleri 
                WHERE sinav_id = ? AND ad = ? AND parent_id IS NULL LIMIT 1
            ");
            $stmt->execute([$examInfo['id'], $examInfo['ad']]);
            $parentCompId = $stmt->fetchColumn();
            $debug[] = "Ana bilesen (parent) arandi. ID: " . ($parentCompId ?: 'Bulunamadi');

            if ($parentCompId) {
                // It's a parent component, get its children.
                $stmt = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE parent_id = ? ORDER BY sira ASC, ad ASC");
                $stmt->execute([$parentCompId]);
                $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $debug[] = "Ana bilesenin alt bilesenleri (cocuklar) arandi. Sonuc: " . json_encode($components);
            }
            
            // If no child components were found, it's a direct exam like KPSS.
            // Get all components directly under the exam.
            if (empty($components)) {
                $debug[] = "Alt bilesen bulunamadi, dogrudan sinava bagli bilesenler araniyor.";
                $stmt = $db->prepare("SELECT id, ad FROM sinav_bilesenleri WHERE sinav_id = ? ORDER BY sira ASC, ad ASC");
                $stmt->execute([$examInfo['id']]);
                $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $debug[] = "Dogrudan sinav bilesenleri arama sonucu: " . json_encode($components);
            }
        } else {
            $debug[] = "Veritabaninda eslesen sinav bulunamadi.";
        }
    } else {
        $debug[] = "Ogrenci alani icin alanMap eslesmesi bulunamadi.";
    }
}

// FINAL CHECK: If no components were found but we have a valid exam,
// it means this is a simple exam (like KPSS) with no explicit components.
// We'll treat the exam itself as the single component.
if (empty($components) && $examInfo) {
    $debug[] = "Hic bilesen bulunamadi, sinavin kendisi tek bilesen olarak kullaniliyor.";
    $components[] = [
        'id' => $examInfo['id'], // Use EXAM_ID as the component ID
        'ad' => $examInfo['ad'],
        'is_virtual' => true // Add a flag to identify this later
    ];
}

    // 4. Bulunan her bileşene ait dersleri ekle
    if (!empty($components)) {
        foreach ($components as &$c) {
            $componentId = $c['id'];
            
            // Check if it's our virtual component
            if (isset($c['is_virtual']) && $c['is_virtual'] === true) {
                $debug[] = "Dersler 'Sanal Bilesen' modunda (sinav_id: {$componentId}) araniyor.";
                // For virtual components, we use the ID to query by sinav_id
                $stmtDers = $db->prepare("SELECT ders_adi FROM sinav_dersleri WHERE sinav_id = ? ORDER BY sira ASC, ders_adi ASC");
            } else {
                $debug[] = "Dersler 'Normal Bilesen' modunda (component_id: {$componentId}) araniyor.";
                // For regular components, we query by component_id
                $stmtDers = $db->prepare("SELECT ders_adi FROM sinav_dersleri WHERE component_id = ? ORDER BY sira ASC, ders_adi ASC");
            }
            
            $stmtDers->execute([$componentId]);
            $c['dersler'] = $stmtDers->fetchAll(PDO::FETCH_COLUMN);
            if(isset($c['is_virtual'])) {
                unset($c['is_virtual']); // Clean up the flag before sending to frontend
            }
        }
    }

    // 5. Sonucu JSON olarak döndür
    echo json_encode([
        'success' => true,
        'exam' => $examInfo,
        'components' => $components,
        'debug' => $debug
    ]);

} catch (Exception $e) {
    http_response_code(500);
    $debug[] = "EXCEPTION: " . $e->getMessage();
    echo json_encode(['success' => false, 'message' => 'Hata: ' . $e->getMessage(), 'debug' => $debug]);
}
