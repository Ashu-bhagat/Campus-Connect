-- Campus Connect — reference MySQL schema
-- This mirrors exactly what Sequelize creates automatically via sync().
-- You do NOT have to run this by hand — the app creates these tables itself
-- on first run against a MySQL database. It's provided for:
--   (a) grading/documentation purposes (Section 24 of the project spec), and
--   (b) anyone who prefers to provision the schema explicitly ahead of time.
--
-- Usage:  mysql -u root -p campus_connect < schema.sql

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(120) NOT NULL,
  email             VARCHAR(160) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  role              VARCHAR(20)  NOT NULL DEFAULT 'student',   -- student, faculty, staff, admin
  department        VARCHAR(120),
  phone             VARCHAR(20),
  profile_image     VARCHAR(255) DEFAULT 'default_avatar.png',
  bio               TEXT,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended      BOOLEAN NOT NULL DEFAULT FALSE,
  rating            FLOAT DEFAULT 0,
  rating_count      INT DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(80) NOT NULL UNIQUE,
  icon  VARCHAR(50) DEFAULT 'tag'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  seller_id             INT NOT NULL,
  title                 VARCHAR(150) NOT NULL,
  description           TEXT NOT NULL,
  category_id           INT NOT NULL,
  transaction_type      VARCHAR(20) NOT NULL,          -- sell, rent, exchange, buy
  price                 FLOAT NOT NULL DEFAULT 0,
  `condition`           VARCHAR(30) NOT NULL DEFAULT 'Good',
  location              VARCHAR(150),
  status                VARCHAR(20) NOT NULL DEFAULT 'active', -- active, reserved, completed, removed
  available_from        DATE,
  available_until       DATE,
  exchange_preference   VARCHAR(255),
  views                 INT DEFAULT 0,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_listings_seller (seller_id),
  INDEX idx_listings_status (status),
  INDEX idx_listings_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: "condition" is a MySQL reserved word in some statement contexts,
-- so it is backtick-quoted here and in any hand-written SQL against this
-- table. Sequelize (the app's ORM) quotes identifiers automatically and
-- needs no special handling.

-- ---------------------------------------------------------------------------
-- listing_images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT NOT NULL,
  image_path  VARCHAR(255) NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_listing_images_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- wishlist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  listing_id  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_listing_wishlist (user_id, listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- conversations + messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT NOT NULL,
  user1_id    INT NOT NULL,
  user2_id    INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_conversation_pair (listing_id, user1_id, user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id  INT NOT NULL,
  sender_id        INT NOT NULL,
  message          TEXT NOT NULL,
  is_read          BOOLEAN DEFAULT FALSE,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  listing_id          INT NOT NULL,
  buyer_id            INT NOT NULL,
  seller_id           INT NOT NULL,
  transaction_type    VARCHAR(20) NOT NULL,             -- buy, rent, exchange
  status              VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, completed, cancelled
  rental_start        DATE,
  rental_end          DATE,
  exchange_offer      VARCHAR(255),
  buyer_confirmed     BOOLEAN DEFAULT FALSE,
  seller_confirmed    BOOLEAN DEFAULT FALSE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at        DATETIME,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_transactions_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id      INT NOT NULL,
  reviewer_id         INT NOT NULL,
  reviewed_user_id    INT NOT NULL,
  rating              INT NOT NULL,
  comment             TEXT,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_one_review_per_transaction_side (transaction_id, reviewer_id),
  CONSTRAINT ck_rating_range CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_reviewed_user (reviewed_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(150) NOT NULL,
  message     VARCHAR(255) NOT NULL,
  type        VARCHAR(30) DEFAULT 'general',
  link        VARCHAR(255),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  category     VARCHAR(40) DEFAULT 'Campus Fest',
  date         DATE NOT NULL,
  time         VARCHAR(20),
  location     VARCHAR(150),
  organizer    VARCHAR(120),
  image        VARCHAR(255),
  created_by   INT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- errand_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS errand_requests (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  requester_id      INT NOT NULL,
  title             VARCHAR(150) NOT NULL,
  description       TEXT,
  pickup_location   VARCHAR(150) NOT NULL,
  destination       VARCHAR(150) NOT NULL,
  date              DATE NOT NULL,
  reward            VARCHAR(80),
  status            VARCHAR(20) DEFAULT 'open',    -- open, accepted, completed, cancelled
  accepted_by       INT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id       INT NOT NULL,
  listing_id        INT,
  reported_user_id  INT,
  reason            VARCHAR(50) NOT NULL,
  description       TEXT,
  status            VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- email_verifications (OTP records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  otp_code    VARCHAR(10) NOT NULL,
  is_used     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_verifications_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
