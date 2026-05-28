-- 이 파일의 역할: Enabler의 정산용 세무 서류(W-9/W-8BEN) 비공개 버킷 생성 및 RLS 정책 정의, 정산 계정 테이블 컬럼 추가
-- 1. tax-forms storage bucket 생성 (private)
insert into storage.buckets (id, name, public)
values ('tax-forms', 'tax-forms', false)
on conflict (id) do nothing;

-- 2. enabler_payout_accounts 테이블에 tax_form_url 컬럼 추가
alter table enabler_payout_accounts add column if not exists tax_form_url text;

-- 3. RLS 정책 설정 (storage.objects)
-- 본인은 본인 폴더의 세무 서류 조회 가능, super_admin은 전체 조회 가능
create policy "tax_forms_select_own"
  on storage.objects for select
  using (
    bucket_id = 'tax-forms'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.users
        where users.id = auth.uid() and users.role = 'super_admin'
      )
    )
  );

-- 본인 폴더에만 업로드 가능
create policy "tax_forms_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'tax-forms'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 폴더의 서류 수정 가능
create policy "tax_forms_update_own"
  on storage.objects for update
  using (
    bucket_id = 'tax-forms'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 폴더의 서류 삭제 가능
create policy "tax_forms_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'tax-forms'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
