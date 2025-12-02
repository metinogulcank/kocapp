# PHP Backend API

Bu proje Node.js backend'inden PHP backend'ine geçirilmiştir.

## Kurulum

1. **Veritabanı Kurulumu**
   - phpMyAdmin'de `venotoc1_kocapp` veritabanını oluşturun
   - Aşağıdaki SQL kodunu çalıştırın:

```sql
CREATE TABLE users (
    _id VARCHAR(24) PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('ogrenci', 'ogretmen', 'veli', 'admin') NOT NULL DEFAULT 'ogrenci',
    resetPasswordToken VARCHAR(255),
    resetPasswordExpiresAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    __v INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

2. **Dosya Yapısı**
```
php-backend/
├── config/
│   └── database.php
├── models/
│   └── User.php
├── api/
│   ├── register.php
│   ├── login.php
│   ├── logout.php
│   └── me.php
└── .htaccess
```

3. **Veritabanı Bağlantısı**
   - `config/database.php` dosyasında veritabanı bilgileri:
     - Host: localhost
     - Database: venotoc1_kocapp
     - Username: metinogulcank
     - Password: 06ogulcan06

## API Endpoints

### POST /api/register.php
Kullanıcı kaydı
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "05000000000",
  "password": "password123",
  "role": "ogrenci"
}
```

### POST /api/login.php
Kullanıcı girişi
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### GET /api/me.php
Kullanıcı bilgilerini getir (Authorization header gerekli)

### POST /api/logout.php
Çıkış yap

## Frontend Değişiklikleri

Frontend'de API URL'i şu şekilde güncellenmiştir:
- Eski: `http://localhost:5000/api/auth/`
- Yeni: `http://localhost/kocapp/php-backend/api/`

## Test

1. Frontend'i çalıştırın: `npm start`
2. Register sayfasından yeni kullanıcı oluşturun
3. Login sayfasından giriş yapın
4. Panellere yönlendirildiğinizi kontrol edin
