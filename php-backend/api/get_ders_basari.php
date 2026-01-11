<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

require_once '../config/database.php';

$studentId = isset($_GET['studentId']) ? $_GET['studentId'] : '';
$componentId = isset($_GET['componentId']) ? $_GET['componentId'] : '';

if (empty($studentId) || empty($componentId)) {
    echo json_encode(['success' => false, 'message' => 'Ogrenci ID ve Component ID gereklidir.']);
    exit;
}

$db = (new Database())->getConnection();

// Bu component'e ait dersleri al
$stmtDersler = $db->prepare("SELECT id, ders_adi FROM sinav_dersleri WHERE component_id = ? ORDER BY sira");
$stmtDersler->execute([$componentId]);
$dersler = $stmtDersler->fetchAll(PDO::FETCH_ASSOC);

$dersBasariStats = [];

foreach ($dersler as $ders) {
    $dersId = $ders['id'];
    $dersAdi = $ders['ders_adi'];

    // Bu derse ait konuları al
    $stmtKonular = $db->prepare("SELECT id, konu_adi FROM sinav_konulari WHERE ders_id = ? ORDER BY sira");
    $stmtKonular->execute([$dersId]);
    $konular = $stmtKonular->fetchAll(PDO::FETCH_ASSOC);

    $konuIstatistikleri = [];
    $toplamDogru = 0;
    $toplamYanlis = 0;
    $toplamBos = 0;

    foreach ($konular as $konu) {
        $konuId = $konu['id'];

        // Bu konuya ait soru cevaplarını topla (varsayımsal tablo: ogrenci_cevaplari)
        $stmtCevaplar = $db->prepare("
            SELECT 
                SUM(CASE WHEN dogru_mu = 1 THEN 1 ELSE 0 END) as dogru,
                SUM(CASE WHEN dogru_mu = 0 THEN 1 ELSE 0 END) as yanlis,
                SUM(CASE WHEN dogru_mu IS NULL THEN 1 ELSE 0 END) as bos
            FROM ogrenci_cevaplari 
            WHERE ogrenci_id = ? AND konu_id = ?
        ");
        $stmtCevaplar->execute([$studentId, $konuId]);
        $stats = $stmtCevaplar->fetch(PDO::FETCH_ASSOC);

        $dogru = (int)$stats['dogru'];
        $yanlis = (int)$stats['yanlis'];
        $bos = (int)$stats['bos'];
        $toplamSoru = $dogru + $yanlis + $bos;
        $basari = $toplamSoru > 0 ? ($dogru / $toplamSoru) * 100 : 0;

        $konuIstatistikleri[] = [
            'konuAdi' => $konu['konu_adi'],
            'dogru' => $dogru,
            'yanlis' => $yanlis,
            'bos' => $bos,
            'toplam' => $toplamSoru,
            'basari' => round($basari)
        ];

        $toplamDogru += $dogru;
        $toplamYanlis += $yanlis;
        $toplamBos += $bos;
    }

    $dersToplamSoru = $toplamDogru + $toplamYanlis + $toplamBos;
    $dersBasari = $dersToplamSoru > 0 ? ($toplamDogru / $dersToplamSoru) * 100 : 0;

    $dersBasariStats[] = [
        'dersAdi' => $dersAdi,
        'dogru' => $toplamDogru,
        'yanlis' => $toplamYanlis,
        'bos' => $toplamBos,
        'toplam' => $dersToplamSoru,
        'basari' => round($dersBasari),
        'konular' => $konuIstatistikleri
    ];
}

echo json_encode(['success' => true, 'stats' => $dersBasariStats]);
