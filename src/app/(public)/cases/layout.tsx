import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "성공 사례",
  description: "Enabler가 직접 실행해낸 한·미 스타트업 시장 진입·계약·확장 사례를 모았습니다.",
  alternates: { canonical: "/cases" },
  openGraph: {
    title: "성공 사례 — Get It Done at Work",
    description: "Enabler가 직접 실행해낸 한·미 스타트업 시장 진입·계약·확장 사례를 모았습니다.",
    url: "/cases",
  },
};

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
