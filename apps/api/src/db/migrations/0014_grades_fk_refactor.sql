-- Sprint 4: Substitui campos de texto subject/period por FKs reais em grades
ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id),
  ADD COLUMN IF NOT EXISTS academic_period_id UUID REFERENCES academic_periods(id);

ALTER TABLE grades
  DROP COLUMN IF EXISTS subject,
  DROP COLUMN IF EXISTS period;
