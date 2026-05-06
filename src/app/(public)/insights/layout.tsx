import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "인사이트",
  description: "한·미 진출 실전 노하우, 시장 분석, Enabler들의 현장 인사이트.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "인사이트 — Get It Done at Work",
    description: "한·미 진출 실전 노하우, 시장 분석, Enabler들의 현장 인사이트.",
    url: "/insights",
  },
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
