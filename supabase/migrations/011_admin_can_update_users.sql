-- super_admin이 users 테이블의 모든 행을 UPDATE 할 수 있도록 RLS 정책 추가
CREATE POLICY "users_super_admin_update" ON users FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'));
