-- Household Ledger 초기 스키마 마이그레이션
-- MySQL 8.4

-- 1. groups 테이블 (users보다 먼저 생성, 외래키는 나중에 추가)
CREATE TABLE IF NOT EXISTS groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    owner_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX groups_owner_id_fkey (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. users 테이블
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(60) NOT NULL,
    avatar_url VARCHAR(500),
    group_id BIGINT,
    default_currency VARCHAR(3),
    settings JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 외래키 추가 (순환 참조 해결)
ALTER TABLE groups ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE users ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- 3. group_invites 테이블
CREATE TABLE IF NOT EXISTS group_invites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_by BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_group_invites_group (group_id),
    INDEX idx_group_invites_expires (expires_at),
    INDEX group_invites_created_by_fkey (created_by),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. categories 테이블
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT,
    created_by BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    type ENUM('EXPENSE', 'INCOME', 'TRANSFER') NOT NULL,
    color VARCHAR(7),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    budget_amount BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_group (group_id),
    INDEX idx_categories_creator (created_by),
    UNIQUE KEY ux_category_name (group_id, name, type),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. tags 테이블
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT,
    created_by BIGINT NOT NULL,
    name VARCHAR(60) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tags_group (group_id),
    INDEX tags_created_by_fkey (created_by),
    UNIQUE KEY ux_tag (group_id, name),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. recurring_rules 테이블 (transactions보다 먼저 생성)
CREATE TABLE IF NOT EXISTS recurring_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT,
    created_by BIGINT NOT NULL,
    start_date DATE NOT NULL,
    frequency ENUM('MONTHLY', 'WEEKLY', 'DAILY') NOT NULL,
    day_rule VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    category_id BIGINT,
    merchant VARCHAR(160),
    memo VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_recurring_rules_group_active (group_id, is_active),
    INDEX idx_recurring_rules_creator_active (created_by, is_active),
    INDEX idx_recurring_rules_frequency_active (frequency, is_active),
    INDEX recurring_rules_category_id_fkey (category_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. receipts 테이블 (transactions보다 먼저 생성)
CREATE TABLE IF NOT EXISTS receipts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT,
    user_id BIGINT NOT NULL,
    group_id BIGINT,
    image_url VARCHAR(500) NOT NULL,
    ocr_result JSON,
    ocr_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    extracted_amount BIGINT,
    extracted_date DATE,
    extracted_merchant VARCHAR(160),
    extracted_items JSON,
    confidence_score DECIMAL(3, 2),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_receipts_user (user_id),
    INDEX idx_receipts_group (group_id),
    INDEX idx_receipts_transaction (transaction_id),
    INDEX idx_receipts_status (ocr_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. transactions 테이블
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT,
    owner_user_id BIGINT NOT NULL,
    type ENUM('EXPENSE', 'INCOME', 'TRANSFER') NOT NULL,
    date DATE NOT NULL,
    amount BIGINT NOT NULL,
    currency_code VARCHAR(3),
    original_amount BIGINT,
    category_id BIGINT,
    tag_id BIGINT,
    recurring_rule_id BIGINT,
    receipt_id BIGINT,
    merchant VARCHAR(160),
    memo VARCHAR(1000),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tx_group_date (group_id, date),
    INDEX idx_tx_owner_date (owner_user_id, date),
    INDEX idx_tx_category (category_id),
    INDEX idx_tx_tag (tag_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE SET NULL,
    FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id) ON DELETE SET NULL,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL,
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- receipts 테이블의 transaction_id 외래키 추가
ALTER TABLE receipts ADD FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- 9. attachments 테이블
CREATE TABLE IF NOT EXISTS attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    mime VARCHAR(100),
    size INT,
    INDEX attachments_transaction_id_fkey (transaction_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. budgets 테이블
CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    owner_type ENUM('USER', 'GROUP') NOT NULL,
    owner_id BIGINT NOT NULL,
    period VARCHAR(7) NOT NULL,
    total_amount BIGINT NOT NULL,
    status ENUM('ACTIVE', 'CLOSED', 'DRAFT') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_budgets_owner (owner_type, owner_id),
    UNIQUE KEY ux_budget_owner_period (owner_type, owner_id, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. exchange_rates 테이블
CREATE TABLE IF NOT EXISTS exchange_rates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exchange_rates_currencies (from_currency, to_currency, date),
    INDEX idx_exchange_rates_date (date),
    UNIQUE KEY ux_exchange_rate (from_currency, to_currency, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. currency_preferences 테이블
CREATE TABLE IF NOT EXISTS currency_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    group_id BIGINT,
    base_currency VARCHAR(3) NOT NULL,
    display_currency VARCHAR(3),
    auto_convert BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_currency_prefs_user (user_id),
    INDEX idx_currency_prefs_group (group_id),
    UNIQUE KEY ux_currency_prefs_user (user_id),
    UNIQUE KEY ux_currency_prefs_group (group_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. auto_category_rules 테이블
CREATE TABLE IF NOT EXISTS auto_category_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    group_id BIGINT,
    pattern_type ENUM('KEYWORD', 'MERCHANT', 'AMOUNT_RANGE', 'REGEX') NOT NULL,
    pattern_value VARCHAR(200) NOT NULL,
    category_id BIGINT NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    match_count INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_auto_category_user (user_id),
    INDEX idx_auto_category_group (group_id),
    INDEX idx_auto_category_category (category_id),
    INDEX idx_auto_category_active (is_active, priority),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

