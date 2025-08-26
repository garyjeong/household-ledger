-- ===================================================================
-- Household Ledger 데이터베이스 초기화 스크립트 (통합 버전)
-- Docker MySQL 컨테이너 첫 시작 시 자동 실행
-- ===================================================================
-- 
-- 역할 분담:
-- - 이 파일: 기본 설정, 사용자 권한, root 접근 설정
-- - Prisma migrations: 테이블 스키마, 시드 데이터 관리
-- ===================================================================

SET NAMES utf8mb4;
SET time_zone = '+09:00';

-- ===================================================================
-- 1. 사용자 및 권한 설정
-- ===================================================================

-- 기본 애플리케이션 사용자 생성 (환경변수로 이미 생성되지만 안전하게 재생성)
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'wjdwhdans';
GRANT ALL PRIVILEGES ON `household_ledger`.* TO 'user'@'%';

-- Root 계정 외부 접근 허용 (DBeaver, phpMyAdmin 등 외부 도구 연결용)
ALTER USER 'root'@'%' IDENTIFIED BY 'wjdwhdans';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Root 계정 localhost 접근도 동일한 비밀번호로 설정
ALTER USER 'root'@'localhost' IDENTIFIED BY 'wjdwhdans';

-- 권한 변경사항 적용
FLUSH PRIVILEGES;

-- ===================================================================
-- 2. 데이터베이스 상태 확인 (로깅용)
-- ===================================================================

-- 현재 데이터베이스 목록 표시
SHOW DATABASES;

-- 생성된 사용자 확인
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'user');

-- ===================================================================
-- 참고사항:
-- 
-- 1. 기본 데이터베이스 'household_ledger'는 MYSQL_DATABASE 환경변수로 자동 생성됨
-- 2. 테이블 스키마는 Prisma migrations으로 관리됨 (prisma db push/migrate)
-- 3. 카테고리 시드 데이터는 Prisma seed 스크립트로 관리됨
-- 4. 이 스크립트는 권한 설정과 기본 환경 구성만 담당함
-- 5. 포트 3307로 외부 접근 가능하도록 설정됨
-- ===================================================================
