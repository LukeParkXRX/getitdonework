import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/lib/legal/documents";

const document = legalDocuments.acceptableUse;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: document.canonical },
  robots: { index: false, follow: false },
  openGraph: {
    title: `${document.title} - Get It Done`,
    description: document.description,
    url: document.canonical,
  },
};

export default function AcceptableUsePage() {
  return <LegalDocumentPage document={document} />;
}
