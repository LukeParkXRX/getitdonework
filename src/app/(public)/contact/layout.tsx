import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의하기",
  description: "파트너십·서비스·미디어 문의는 여기로. 24시간 내 회신 드립니다.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "문의하기 — Get It Done at Work",
    description: "파트너십·서비스·미디어 문의는 여기로. 24시간 내 회신 드립니다.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
