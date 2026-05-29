// 비밀번호 정책 — 가입·재설정 공용.
// 정책: 최소 8자 + 영문(a-z/A-Z) 포함 + 숫자(0-9) 포함.

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordCheck = {
  ok: boolean;
  /** 위반 시 사용자에게 보여줄 한국어 메시지 (ok=true면 null) */
  message: string | null;
};

// 가입/재설정 폼에서 호출. 첫 번째로 위반한 규칙의 메시지를 반환한다.
export function validatePassword(password: string): PasswordCheck {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.` };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, message: "비밀번호에 영문자를 1자 이상 포함해 주세요." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: "비밀번호에 숫자를 1자 이상 포함해 주세요." };
  }
  return { ok: true, message: null };
}

// 입력 필드 보조 안내 문구.
export const PASSWORD_HINT = "영문과 숫자를 포함해 8자 이상";
