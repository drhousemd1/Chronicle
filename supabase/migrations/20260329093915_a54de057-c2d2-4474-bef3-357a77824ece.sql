-- NOTE:
-- `ai_usage_events` and `ai_usage_test_sessions` are already created by:
--   20260328083000_9f8e5e4a-usage-events.sql
--   20260328101500_6f9b2a2f_api_usage_test_tracing.sql
--
-- This migration was a duplicate scaffold and is intentionally left as a no-op
-- to avoid create-table/create-policy collisions in environments that already
-- applied the earlier migrations.
SELECT 1;
