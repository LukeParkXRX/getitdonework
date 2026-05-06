import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "크레딧",
  description: "Get It Done at Work 크레딧 구매·사용 안내. 세션 단위로 차감됩니다.",
  alternates: { canonical: "/credits" },
  openGraph: {
    title: "크레딧 — Get It Done at Work",
    description: "Get It Done at Work 크레딧 구매·사용 안내. 세션 단위로 차감됩니다.",
    url: "/credits",
  },
};

export default function CreditsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
