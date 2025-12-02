<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $firstName;
    public $lastName;
    public $email;
    public $phone;
    public $passwordHash;
    public $role;
    public $resetPasswordToken;
    public $resetPasswordExpiresAt;
    public $createdAt;
    public $updatedAt;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        // MongoDB ObjectId benzeri bir ID oluştur
        $this->id = bin2hex(random_bytes(12));
        
        $query = "INSERT INTO " . $this->table_name . " 
                  SET _id=:id, firstName=:firstName, lastName=:lastName, email=:email, 
                      phone=:phone, passwordHash=:passwordHash, role=:role,
                      createdAt=NOW(), updatedAt=NOW()";

        $stmt = $this->conn->prepare($query);

        $this->firstName = htmlspecialchars(strip_tags($this->firstName));
        $this->lastName = htmlspecialchars(strip_tags($this->lastName));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->passwordHash = htmlspecialchars(strip_tags($this->passwordHash));
        $this->role = htmlspecialchars(strip_tags($this->role));

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":firstName", $this->firstName);
        $stmt->bindParam(":lastName", $this->lastName);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":passwordHash", $this->passwordHash);
        $stmt->bindParam(":role", $this->role);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function findByEmail() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->id = $row['_id'];
            $this->firstName = $row['firstName'];
            $this->lastName = $row['lastName'];
            $this->email = $row['email'];
            $this->phone = $row['phone'];
            $this->passwordHash = $row['passwordHash'];
            $this->role = $row['role'];
            $this->createdAt = $row['createdAt'];
            $this->updatedAt = $row['updatedAt'];
            return true;
        }
        return false;
    }

    public function emailExists() {
        $query = "SELECT _id FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            return true;
        }
        return false;
    }
}
?>
