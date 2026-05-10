-- TEST 더미 데이터 정리 (베타 노출 방지)

-- bio에 'TEST' 반복 패턴이 있는 enabler_profiles 정리
UPDATE enabler_profiles
  SET bio = COALESCE(NULLIF(REGEXP_REPLACE(bio, '(TEST|test){2,}[A-Za-z\s]*', '', 'gi'), ''),
                     'Senior consultant with experience in US market entry. Profile being updated.')
  WHERE bio ~* '(TEST|test){2,}';

-- specialties에 TEST 더미가 있는 경우 정리
UPDATE enabler_profiles
  SET specialties = ARRAY['B2B SaaS', 'Go-to-Market']
  WHERE specialties::text ~* '(TEST|test){2,}';

-- university/degree_type/location 동일 처리
UPDATE enabler_profiles SET university = 'Stanford GSB' WHERE university ~* '(TEST|test){2,}';
UPDATE enabler_profiles SET degree_type = 'MBA' WHERE degree_type ~* '(TEST|test){2,}';
UPDATE enabler_profiles SET location = 'San Francisco, CA' WHERE location ~* '(TEST|test){2,}';
