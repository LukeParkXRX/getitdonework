import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enabler 지원",
  description: "검증된 US Market Enabler로 합류하세요. 지원 자격과 절차 안내.",
  alternates: { canonical: "/enabler-apply" },
  openGraph: {
    title: "Enabler 지원 — Get It Done at Work",
    description: "검증된 US Market Enabler로 합류하세요. 지원 자격과 절차 안내.",
    url: "/enabler-apply",
  },
};

export default function EnablerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
