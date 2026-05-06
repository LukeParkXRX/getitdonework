import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회사 소개",
  description:
    "Get It Done at Work — 한국 스타트업의 미국 진출을 실행으로 연결하는 매칭 플랫폼. 미션, 팀, 비전을 소개합니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "회사 소개 — Get It Done at Work",
    description:
      "한·미 스타트업 실행 매칭 플랫폼의 미션과 팀을 소개합니다.",
    url: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
