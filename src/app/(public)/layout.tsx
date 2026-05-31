import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// 로케일은 NEXT_LOCALE 쿠키 기반(URL prefix 없음)이라 정적 생성과 호환되지 않는다.
// 정적 프리렌더는 빌드 시 기본 로케일(ko)로 굳어 EN 방문자에게도 한국어가 노출되므로,
// 공개 페이지는 요청별 동적 렌더링으로 강제해 쿠키 로케일을 반영한다.
export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 56 }}>{children}</div>
      <Footer />
    </>
  );
}
