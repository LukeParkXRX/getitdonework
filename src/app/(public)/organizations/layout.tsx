import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "기관·파트너",
  description: "Get It Done at Work와 함께하는 기관, 액셀러레이터, 파트너 네트워크.",
  alternates: { canonical: "/organizations" },
  openGraph: {
    title: "기관·파트너 — Get It Done at Work",
    description: "Get It Done at Work와 함께하는 기관, 액셀러레이터, 파트너 네트워크.",
    url: "/organizations",
  },
};

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
