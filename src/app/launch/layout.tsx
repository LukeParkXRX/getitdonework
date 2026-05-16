import type { ReactNode } from "react";

// Minimal layout — navbar/footer 없음
export default function LaunchLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        color: "var(--color-text)",
        fontFamily: 'var(--font-body), "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
