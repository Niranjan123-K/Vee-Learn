-- Migration 002: Add Dual Confirmation for Session Escrow

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS teacher_completion_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS learner_completion_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS teacher_completed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS learner_completed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS credits_transferred BOOLEAN DEFAULT false;
