-- 001: double-booking guard (spec §6.2).
--
-- No two active appointments for the same staff member may have overlapping blocked ranges.
-- blocked_start_at / blocked_end_at already include buffers and travel time.
--
-- Rows with staff_id IS NULL are not covered by this constraint (NULL never equals NULL).
-- Booking code must always set staff_id, even for single-barber businesses.

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT no_overlapping_bookings
      EXCLUDE USING gist (
        staff_id WITH =,
        tstzrange(blocked_start_at, blocked_end_at, '[)') WITH &&
      )
      WHERE (
        status IN ('PENDING_PAYMENT', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS')
        AND deleted_at IS NULL
      );
  END IF;
END
$$;
