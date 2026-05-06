import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "Get It Done at Work 서비스 이용 전 자주 묻는 질문과 답변 모음.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "자주 묻는 질문 — Get It Done at Work",
    description: "Get It Done at Work 서비스 이용 전 자주 묻는 질문과 답변 모음.",
    url: "/faq",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
