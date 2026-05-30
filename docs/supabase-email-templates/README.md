# Supabase 인증 메일 설정 (AI 브라우저용)

> 목적: 가입 확인·재설정 메일을 **앱과 동일한 브랜드 디자인**으로 바꾸고, URL을 정렬해 **스팸 분류를 줄임.**
> 프로젝트: Getitdonework (ref: `isgkgywrkonlqrhfipes`)
> 발신은 이미 Resend SMTP 연결 완료. 여기서는 (A) URL 설정 + (B) 템플릿 교체만 함.

---

## A. URL Configuration

1. https://supabase.com/dashboard/project/isgkgywrkonlqrhfipes/auth/url-configuration 접속
   (안 열리면: Authentication → URL Configuration)
2. **Site URL** = `https://getitdonework.com`  → Save
3. **Redirect URLs** 에 아래 2개가 모두 있는지 확인, 없으면 "Add URL"로 추가:
   - `https://getitdonework.com/**`
   - `http://localhost:3000/**`  (개발용)
4. Save 후 결과 보고.

---

## B. Email Templates

위치: https://supabase.com/dashboard/project/isgkgywrkonlqrhfipes/auth/templates
(또는 Authentication → Emails → Templates)

각 템플릿 탭을 선택 → **Subject**를 아래 값으로 변경 → **Message body (HTML)** 칸을 비우고 해당 `.html` 파일 내용을 **전체 복사·붙여넣기** → Save.

| 탭 (Template) | Subject 입력값 | 붙여넣을 파일 |
|---------------|----------------|---------------|
| **Confirm signup** | `Confirm your email · 이메일 인증` | `01-confirm-signup.html` |
| **Invite user** | `You're invited to Get It Done at Work · 초대장` | `02-invite.html` |
| **Reset password** | `Reset your password · 비밀번호 재설정` | `03-reset-password.html` |
| **Magic Link** | `Your sign-in link · 로그인 링크` | `04-magic-link.html` |
| **Change Email Address** | `Confirm your new email · 새 이메일 인증` | `05-change-email.html` |

> ⚠️ 파일 안의 `{{ .ConfirmationURL }}` 는 **그대로 두세요.** Supabase가 실제 링크로 자동 치환합니다. 절대 수정/삭제 금지.
> ⚠️ HTML을 통째로 교체 (기존 내용 전부 지우고 붙여넣기).

각 탭 저장되면 어떤 탭을 저장했는지 보고.

---

## C. 적용 후 (Claude Code가 검증)
- 가입 확인 메일 / 비밀번호 재설정 메일을 다시 발송해 **새 디자인 + 도착 위치(받은편지함/스팸)** 재확인.

---

## D. (선택) 더 강한 개선 — 링크 도메인 정렬
현재 메일 속 링크는 `...supabase.co/auth/v1/verify...` 를 가리킵니다. 발신 도메인(getitdonework.com)과 달라 스팸 점수에 약간 불리합니다.
이를 `getitdonework.com` 링크로 바꾸려면 앱에 `/auth/confirm` 라우트(verifyOtp + token_hash 방식)를 추가해야 합니다 — 코드 변경 + 재배포 필요.
원하면 Claude Code가 구현·배포해 드립니다. (지금 단계에선 A·B만으로도 충분히 개선됨)
