CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add the booking overlap protection after the first Prisma-generated migration.
-- Recommended follow-up migration:
--
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE bookings
--   ADD CONSTRAINT bookings_no_overlap
--   EXCLUDE USING gist (
--     court_id WITH =,
--     tstzrange(start_time, end_time, '[)') WITH &&
--   )
--   WHERE (status IN ('confirmed', 'completed'));

