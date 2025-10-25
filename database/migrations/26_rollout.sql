-- Migration: #26 - Remove redundant tables
-- Description: Drop user_dares and user_truths tables (superseded by user_questions)
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26

-- =====================================================
-- DROP REDUNDANT TABLES
-- =====================================================
-- user_dares and user_truths are superseded by user_questions table
-- These tables are no longer used by the bot

DROP TABLE IF EXISTS user_dares;
DROP TABLE IF EXISTS user_truths;
