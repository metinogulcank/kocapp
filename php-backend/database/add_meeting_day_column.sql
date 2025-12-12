ALTER TABLE `ogrenciler`
ADD COLUMN `meetingDay` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `teacherId`;

-- Varsayılan olarak görüşme günü belirtilmemiş kayıtlar Pazartesi (1) olarak ayarlanır.
UPDATE `ogrenciler`
SET `meetingDay` = 1
WHERE `meetingDay` IS NULL OR `meetingDay` = 0;

