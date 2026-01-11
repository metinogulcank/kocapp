<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'koca_kocapp';
    private $username = 'koca_metinogulcank';  // Hosting'de genellikle prefix eklenir
    private $password = '06ogulcan06';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_general_ci"
                )
            );
        } catch(PDOException $exception) {
            // Echo yerine JSON hata mesajı döndürmek için header set etmeliyiz veya hata fırlatmalıyız
            // Ancak getConnection() genellikle API dosyalarında çağrıldığı için burada echo yapmak JSON yapısını bozar.
            // Bu yüzden hatayı loglayıp sessizce devam etmek veya API dosyasının handle etmesini sağlamak daha iyidir.
            error_log("Connection error: " . $exception->getMessage());
            return null;
        }
        
        return $this->conn;
    }
}
?>
