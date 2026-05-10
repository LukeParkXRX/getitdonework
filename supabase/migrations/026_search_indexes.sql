-- 026_search_indexes.sql
-- GlobalSearch ILIKE 성능 보강용 인덱스
-- P-03: 글로벌 검색 응답 속도 개선

CREATE INDEX IF NOT EXISTS idx_users_full_name ON users (full_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_orgs_name ON organizations (name);
CREATE INDEX IF NOT EXISTS idx_apps_name ON enabler_applications (name);
CREATE INDEX IF NOT EXISTS idx_apps_email ON enabler_applications (email);
CREATE INDEX IF NOT EXISTS idx_inquiries_name ON contact_inquiries (name);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON contact_inquiries (email);
