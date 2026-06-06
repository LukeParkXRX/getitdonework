BEGIN;

UPDATE terms_versions
SET is_current = false
WHERE is_current = true;

INSERT INTO terms_versions (version, effective_from, changelog, is_current)
VALUES (
  'v1.3',
  '2026-06-01 00:00:00+00',
  'Official U.S. launch Terms of Service v1.3. Incorporates Privacy Policy, Refund Policy, Acceptable Use Policy, Cookie Policy, and DPA references.',
  true
)
ON CONFLICT (version) DO UPDATE
SET
  effective_from = EXCLUDED.effective_from,
  changelog = EXCLUDED.changelog,
  is_current = true;

COMMIT;
