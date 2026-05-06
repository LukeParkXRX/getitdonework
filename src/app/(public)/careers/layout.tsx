import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "함께 일하기",
  description: "한·미 스타트업 매칭 플랫폼을 만드는 Get It Done at Work 팀 채용 정보.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "함께 일하기 — Get It Done at Work",
    description: "한·미 스타트업 매칭 플랫폼을 만드는 Get It Done at Work 팀 채용 정보.",
    url: "/careers",
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
