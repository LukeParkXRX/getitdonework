import type { Metadata } from "next";
import { LegalCenterPage } from "@/components/legal/LegalDocumentPage";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Legal Center",
  description: "Public Get It Done policy links, including Terms, Privacy, Refund, and Cookie Policy.",
  alternates: { canonical: "/legal" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Legal Center - Get It Done",
    description: "Official Get It Done policies.",
    url: "/legal",
  },
};

export default function LegalPage() {
  return <LegalCenterPage />;
}
