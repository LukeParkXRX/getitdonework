import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로그램",
  description: "스타트업 액셀러레이션과 Enabler 매칭 프로그램 운영 안내.",
  alternates: { canonical: "/program" },
  openGraph: {
    title: "프로그램 — Get It Done at Work",
    description: "스타트업 액셀러레이션과 Enabler 매칭 프로그램 운영 안내.",
    url: "/program",
  },
};

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return children;
}
