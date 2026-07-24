-- Migration: expande tabela teachers com dados completos do professor

ALTER TABLE "teachers"
  ADD COLUMN IF NOT EXISTS "cpf" text,
  ADD COLUMN IF NOT EXISTS "rg" text,
  ADD COLUMN IF NOT EXISTS "birth_date" date,
  ADD COLUMN IF NOT EXISTS "sex" text,
  ADD COLUMN IF NOT EXISTS "nationality" text,
  ADD COLUMN IF NOT EXISTS "marital_status" text,
  ADD COLUMN IF NOT EXISTS "photo_url" text,
  ADD COLUMN IF NOT EXISTS "phone" text,
  ADD COLUMN IF NOT EXISTS "address_cep" text,
  ADD COLUMN IF NOT EXISTS "address_street" text,
  ADD COLUMN IF NOT EXISTS "address_number" text,
  ADD COLUMN IF NOT EXISTS "address_complement" text,
  ADD COLUMN IF NOT EXISTS "address_neighborhood" text,
  ADD COLUMN IF NOT EXISTS "address_city" text,
  ADD COLUMN IF NOT EXISTS "address_state" text,
  ADD COLUMN IF NOT EXISTS "position" text,
  ADD COLUMN IF NOT EXISTS "contract_type" text,
  ADD COLUMN IF NOT EXISTS "workload" text,
  ADD COLUMN IF NOT EXISTS "work_shift" text,
  ADD COLUMN IF NOT EXISTS "education_level" text,
  ADD COLUMN IF NOT EXISTS "degree" text,
  ADD COLUMN IF NOT EXISTS "institution" text,
  ADD COLUMN IF NOT EXISTS "professional_registry" text,
  ADD COLUMN IF NOT EXISTS "bank" text,
  ADD COLUMN IF NOT EXISTS "agency" text,
  ADD COLUMN IF NOT EXISTS "account_number" text,
  ADD COLUMN IF NOT EXISTS "account_type" text,
  ADD COLUMN IF NOT EXISTS "pix_key" text;

ALTER TABLE "teachers"
  ADD COLUMN IF NOT EXISTS "employment_status" text NOT NULL DEFAULT 'ativo';
