-- =============================================================
-- Vee Learn — Database Schema
-- Time-banking skill-sharing platform
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- Custom ENUM types
-- -----------------------------------------------
DO $$ BEGIN
  CREATE TYPE skill_type AS ENUM ('teach', 'learn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('earn', 'spend', 'bonus', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------
-- Users
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  bio           TEXT          DEFAULT '',
  avatar_url    VARCHAR(512)  DEFAULT '',
  course_tag    VARCHAR(50)   DEFAULT '',
  credit_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  held_balance   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  experience_level VARCHAR(50) DEFAULT '',
  preferred_language VARCHAR(50) DEFAULT '',
  location      VARCHAR(150)  DEFAULT '',
  availability  VARCHAR(100)  DEFAULT '',
  profile_completed BOOLEAN   DEFAULT false,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Skills (master catalogue)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(80)  NOT NULL
);

-- -----------------------------------------------
-- User ↔ Skill associations
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id    UUID              NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  type        skill_type        NOT NULL,
  proficiency proficiency_level NOT NULL DEFAULT 'beginner',
  description TEXT              DEFAULT '',
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id, type)
);

-- -----------------------------------------------
-- Sessions (teaching / learning bookings)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learner_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id        UUID           NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ    NOT NULL,
  duration_minutes INTEGER       NOT NULL DEFAULT 60,
  status          session_status NOT NULL DEFAULT 'pending',
  notes           TEXT           DEFAULT '',
  meeting_link    VARCHAR(512)   DEFAULT NULL,
  calendar_event_id VARCHAR(255) DEFAULT NULL,
  meeting_provider VARCHAR(50)   DEFAULT 'JITSI',
  meeting_status  VARCHAR(50)    DEFAULT 'NOT_CREATED',
  meeting_created_at TIMESTAMPTZ DEFAULT NULL,
  teacher_completion_confirmed BOOLEAN DEFAULT false,
  learner_completion_confirmed BOOLEAN DEFAULT false,
  teacher_completed_at TIMESTAMPTZ DEFAULT NULL,
  learner_completed_at TIMESTAMPTZ DEFAULT NULL,
  credits_transferred BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Google Integrations
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS google_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_email  VARCHAR(255),
  refresh_token TEXT,
  status        VARCHAR(50) DEFAULT 'CONNECTED',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- -----------------------------------------------
-- Bounties (fractional async tasks)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS bounties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255)   NOT NULL,
  course_tag  VARCHAR(80)    NOT NULL,
  reward      NUMERIC(10, 2) NOT NULL CHECK (reward > 0),
  status      session_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Credit Transactions (full ledger)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS credit_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID             REFERENCES users(id) ON DELETE SET NULL,
  to_user_id   UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id   UUID             REFERENCES sessions(id) ON DELETE SET NULL,
  amount       NUMERIC(10, 2)   NOT NULL CHECK (amount > 0),
  type         transaction_type NOT NULL,
  description  TEXT             DEFAULT '',
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Reviews
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reviewer_id UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT    DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id)
);

-- -----------------------------------------------
-- Messages
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Conversations (header for message threads)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- -----------------------------------------------
-- Indexes
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_skills_user      ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill     ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_type      ON user_skills(type);

CREATE INDEX IF NOT EXISTS idx_sessions_teacher      ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner      ON sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_skill        ON sessions(skill_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status       ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled    ON sessions(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_bounties_creator      ON bounties(creator_id);
CREATE INDEX IF NOT EXISTS idx_bounties_status       ON bounties(status);

CREATE INDEX IF NOT EXISTS idx_credit_tx_to          ON credit_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_from        ON credit_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_session     ON credit_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created     ON credit_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_session       ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee      ON reviews(reviewee_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver     ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created      ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read      ON messages(is_read);

CREATE INDEX IF NOT EXISTS idx_conversations_user1   ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2   ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at);

-- -----------------------------------------------
-- Session Messages
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS session_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created ON session_messages(created_at);
