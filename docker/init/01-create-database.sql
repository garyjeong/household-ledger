-- 가계부 애플리케이션용 데이터베이스 및 사용자 설정

-- 데이터베이스가 이미 존재하지 않는 경우에만 생성
CREATE DATABASE IF NOT EXISTS household_ledger
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON household_ledger.* TO 'household_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON household_ledger.* TO 'household_user'@'%';

-- 권한 적용
FLUSH PRIVILEGES;

-- 데이터베이스 사용 설정
USE household_ledger;

-- 타임존 설정
SET time_zone = '+09:00';

-- 세션 설정
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- 초기 상태 확인용 테이블 (개발용)
CREATE TABLE IF NOT EXISTS _db_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    status VARCHAR(50) NOT NULL DEFAULT 'initialized',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO _db_status (status) VALUES ('Database initialized successfully');

-- 로그 테이블
CREATE TABLE IF NOT EXISTS _init_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO _init_log (message) VALUES ('MySQL 8.4 database initialization completed');
INSERT INTO _init_log (message) VALUES ('Character set: utf8mb4_unicode_ci');
INSERT INTO _init_log (message) VALUES ('Time zone: Asia/Seoul (+09:00)');
INSERT INTO _init_log (message) VALUES ('User household_user granted permissions');

-- 성공 메시지
SELECT 'Household Ledger Database Setup Complete!' as message;
