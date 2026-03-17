Prisma-generated migrations will live here.

Phase 1 helper:
- `0000_manual_bootstrap.sql` enables `pgcrypto`, which the schema needs for `gen_random_uuid()`.

After the initial Prisma migration, add a second custom SQL migration to enforce non-overlapping bookings per court with a PostgreSQL exclusion constraint.
