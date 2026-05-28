-- 이 파일의 역할: 론칭 체크리스트 항목에 파일 첨부를 지원하기 위한 컬럼 추가 및 비공개(private) attachments 버킷 생성
-- 1. launch-attachments storage bucket 생성 (private)
insert into storage.buckets (id, name, public)
values ('launch-attachments', 'launch-attachments', false)
on conflict (id) do nothing;

-- 2. launch_checklist_items 테이블에 file_url, file_name 컬럼 추가
alter table launch_checklist_items add column if not exists file_url text;
alter table launch_checklist_items add column if not exists file_name text;
