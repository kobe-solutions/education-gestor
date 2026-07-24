ALTER TABLE "schoolClasses"
  ADD COLUMN IF NOT EXISTS serie_id uuid REFERENCES series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_period_id uuid REFERENCES academic_periods(id) ON DELETE SET NULL;

ALTER TABLE "schoolClasses"
  DROP COLUMN IF EXISTS grade,
  DROP COLUMN IF EXISTS term_time;
