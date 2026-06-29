CREATE DATABASE IF NOT EXISTS campushub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campushub;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, role ENUM('student','faculty','admin') NOT NULL DEFAULT 'student',
  department VARCHAR(120), avatar_url VARCHAR(500), refresh_token_hash VARCHAR(255), reset_token_hash VARCHAR(64),
  reset_token_expires DATETIME, last_login_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME,
  INDEX idx_users_role_department (role,department), INDEX idx_users_created (created_at)
);
CREATE TABLE events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(180) NOT NULL, description TEXT NOT NULL, venue VARCHAR(180) NOT NULL,
  starts_at DATETIME NOT NULL, category VARCHAR(80) NOT NULL, banner_url VARCHAR(500), max_capacity INT UNSIGNED NOT NULL,
  registration_deadline DATETIME NOT NULL, organizer_id BIGINT UNSIGNED NOT NULL, department VARCHAR(120),
  status ENUM('draft','published','closed','completed','cancelled') DEFAULT 'published', certificate_template_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME,
  CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(id), INDEX idx_events_filters (status,category,starts_at), INDEX idx_events_department (department)
);
CREATE TABLE registrations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, event_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('registered','cancelled') DEFAULT 'registered', attended BOOLEAN DEFAULT FALSE, cancelled_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_registration (event_id,user_id), FOREIGN KEY (event_id) REFERENCES events(id), FOREIGN KEY (user_id) REFERENCES users(id), INDEX idx_reg_user_status (user_id,status)
);
CREATE TABLE clubs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE, description TEXT NOT NULL, department VARCHAR(120),
  faculty_id BIGINT UNSIGNED NOT NULL, logo_url VARCHAR(500), meeting_schedule VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME,
  FOREIGN KEY (faculty_id) REFERENCES users(id), INDEX idx_clubs_department (department)
);
CREATE TABLE club_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, club_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
  member_role ENUM('member','officer','president') DEFAULT 'member', status ENUM('active','left','removed') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_club_member (club_id,user_id), FOREIGN KEY (club_id) REFERENCES clubs(id), FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, club_id BIGINT UNSIGNED NOT NULL, author_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL, image_url VARCHAR(500), is_pinned BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME,
  FOREIGN KEY (club_id) REFERENCES clubs(id), FOREIGN KEY (author_id) REFERENCES users(id), INDEX idx_posts_club_created (club_id,created_at)
);
CREATE TABLE comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_id BIGINT UNSIGNED NOT NULL, author_id BIGINT UNSIGNED NOT NULL, body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME,
  FOREIGN KEY (post_id) REFERENCES posts(id), FOREIGN KEY (author_id) REFERENCES users(id)
);
CREATE TABLE post_likes (
  post_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(post_id,user_id), FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE announcements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, club_id BIGINT UNSIGNED NOT NULL, author_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL, body TEXT NOT NULL, is_pinned BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(club_id) REFERENCES clubs(id), FOREIGN KEY(author_id) REFERENCES users(id), INDEX idx_announcements_club (club_id,created_at)
);
CREATE TABLE lost_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(180) NOT NULL, description TEXT NOT NULL, category VARCHAR(80) NOT NULL,
  location VARCHAR(180) NOT NULL, item_date DATE NOT NULL, image_url VARCHAR(500), item_type ENUM('lost','found') NOT NULL,
  status ENUM('open','claimed','closed','archived') DEFAULT 'open', reporter_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME,
  FOREIGN KEY(reporter_id) REFERENCES users(id), INDEX idx_lost_filters (status,category,item_date)
);
CREATE TABLE claims (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lost_item_id BIGINT UNSIGNED NOT NULL, claimer_id BIGINT UNSIGNED NOT NULL,
  proof TEXT NOT NULL, status ENUM('pending','approved','rejected') DEFAULT 'pending', reviewed_by BIGINT UNSIGNED, reviewed_at DATETIME, review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_claim (lost_item_id,claimer_id), FOREIGN KEY(lost_item_id) REFERENCES lost_items(id), FOREIGN KEY(claimer_id) REFERENCES users(id), FOREIGN KEY(reviewed_by) REFERENCES users(id)
);
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, type VARCHAR(60) NOT NULL, title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL, link VARCHAR(500), read_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id), INDEX idx_notifications_user (user_id,read_at,created_at)
);
CREATE TABLE certificates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, registration_id BIGINT UNSIGNED NOT NULL UNIQUE, pdf_url VARCHAR(500) NOT NULL,
  verification_code CHAR(36) NOT NULL UNIQUE, issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(registration_id) REFERENCES registrations(id)
);
CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED, action VARCHAR(80) NOT NULL, entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED, metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id), INDEX idx_audit_entity (entity_type,entity_id), INDEX idx_audit_created (created_at)
);
