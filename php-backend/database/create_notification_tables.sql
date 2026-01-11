-- Bildirim sistemi tabloları

-- Ana bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    sender_type ENUM('teacher', 'admin') NOT NULL,
    recipient_type ENUM('student', 'parent', 'class', 'all') NOT NULL,
    recipient_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('announcement', 'reminder', 'exam', 'homework', 'meeting') NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_recipient (recipient_type, recipient_id),
    INDEX idx_sender (sender_id, sender_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kullanıcı bildirim ilişkisi tablosu
CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('student', 'parent', 'teacher') NOT NULL,
    notification_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id, user_type),
    INDEX idx_notification (notification_id),
    INDEX idx_read_status (is_read),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek veriler (opsiyonel)
INSERT INTO notifications (sender_id, sender_type, recipient_type, title, message, type, priority) VALUES
(1, 'teacher', 'all', 'Yeni Dönem Başlıyor', 'Sevgili öğrenciler ve veliler, yeni eğitim öğretim dönemi başlamıştır. Hepinize başarılar dileriz.', 'announcement', 'high'),
(1, 'teacher', 'all', 'Sınav Hatırlatması', 'Bu hafta sonu matematik sınavı yapılacaktır. Lütfen hazırlıklarınızı tamamlayın.', 'reminder', 'medium');

-- Tabloları kontrol et
SHOW TABLES LIKE '%notification%';