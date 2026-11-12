-- HRMD Employee Request System — MySQL schema
-- Run once:  mysql -u root -p < db/schema.sql
-- Then seed: mysql -u root -p hrmd_kiosk < db/seed.sql

CREATE DATABASE IF NOT EXISTS hrmd_kiosk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hrmd_kiosk;

-- ---------------------------------------------------------------- employees
-- Roster imported from the HRMD Excel sheet (NO, LAST NAME, FIRST NAME,
-- MIDDLE NAME, POSITION TITLE, SG, RATE) or added by hand in the admin.
-- Gmail / phone / office / employment status are maintained in the admin
-- because the import format does not carry them.
CREATE TABLE IF NOT EXISTS employees (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_no       VARCHAR(32)  NULL,
  last_name         VARCHAR(96)  NOT NULL,
  first_name        VARCHAR(96)  NOT NULL,
  middle_name       VARCHAR(96)  NULL,
  suffix            VARCHAR(24)  NULL,
  position_title    VARCHAR(160) NULL,
  salary_grade      SMALLINT UNSIGNED NULL,
  rate              DECIMAL(12,2) NULL,
  email             VARCHAR(190) NULL,
  phone             VARCHAR(32)  NULL,
  office            VARCHAR(160) NULL,
  employment_status VARCHAR(48)  NULL,
  source            ENUM('seed','import','manual') NOT NULL DEFAULT 'manual',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_no (employee_no),
  KEY idx_employees_name (last_name, first_name),
  KEY idx_employees_first (first_name),
  KEY idx_employees_office (office)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------- requests
-- Employee details are snapshotted onto the request so a later roster edit
-- never rewrites the history. employee_id links the request to the roster
-- when the employee was picked from it.
CREATE TABLE IF NOT EXISTS requests (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference         VARCHAR(24) NOT NULL,
  service           VARCHAR(32) NOT NULL,
  option_id         VARCHAR(48) NULL,
  purpose           TEXT NOT NULL,
  copies            TINYINT UNSIGNED NULL,
  remarks           TEXT NULL,
  others_specified  VARCHAR(160) NULL,
  employee_id       INT UNSIGNED NULL,
  emp_first         VARCHAR(96)  NOT NULL,
  emp_middle        VARCHAR(96)  NULL,
  emp_last          VARCHAR(96)  NOT NULL,
  emp_suffix        VARCHAR(24)  NULL,
  emp_position      VARCHAR(160) NULL,
  emp_office        VARCHAR(160) NULL,
  emp_status        VARCHAR(48)  NULL,
  emp_email         VARCHAR(190) NULL,
  emp_phone         VARCHAR(32)  NULL,
  submitted_at      DATETIME NOT NULL,
  status            VARCHAR(32) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (id),
  UNIQUE KEY uq_requests_reference (reference),
  KEY idx_requests_submitted (submitted_at),
  KEY idx_requests_status (status),
  KEY idx_requests_employee (employee_id),
  CONSTRAINT fk_requests_employee
    FOREIGN KEY (employee_id) REFERENCES employees (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------- request history
CREATE TABLE IF NOT EXISTS request_history (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id  INT UNSIGNED NOT NULL,
  status      VARCHAR(32) NOT NULL,
  note        VARCHAR(255) NULL,
  actor       VARCHAR(96) NOT NULL,
  occurred_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_history_request (request_id, occurred_at),
  CONSTRAINT fk_history_request
    FOREIGN KEY (request_id) REFERENCES requests (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------- staff
-- HRMD personnel who may sign in to the workspace. Passwords are scrypt
-- hashes (lib/server/password.ts); no plaintext credential is stored or shipped.
CREATE TABLE IF NOT EXISTS staff (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64)  NOT NULL,
  display_name  VARCHAR(96)  NOT NULL,
  role          ENUM('admin','hr_staff') NOT NULL DEFAULT 'hr_staff',
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_username (username)
) ENGINE=InnoDB;

-- One row per signed-in device. Deleting the row (or expiring it) revokes the
-- cookie immediately, which is what the API checks on every request.
CREATE TABLE IF NOT EXISTS staff_sessions (
  id         CHAR(64) NOT NULL,
  staff_id   INT UNSIGNED NOT NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sessions_staff (staff_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_staff
    FOREIGN KEY (staff_id) REFERENCES staff (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------- activity
-- Audit trail for admin actions. staff_name is snapshotted so the log keeps
-- readable entries even if the account is later deleted.
CREATE TABLE IF NOT EXISTS staff_activity (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_id   INT UNSIGNED NULL,
  staff_name VARCHAR(96)  NOT NULL,
  action     VARCHAR(32)  NOT NULL,
  entity     VARCHAR(24)  NULL,
  entity_ref VARCHAR(64)  NULL,
  summary    VARCHAR(255) NOT NULL,
  detail     JSON NULL,
  ip         VARCHAR(64)  NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_created (created_at),
  KEY idx_activity_staff (staff_id),
  KEY idx_activity_action (action),
  CONSTRAINT fk_activity_staff
    FOREIGN KEY (staff_id) REFERENCES staff (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;
