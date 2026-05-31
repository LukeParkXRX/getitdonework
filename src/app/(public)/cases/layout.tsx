import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("casesTitle"),
    description: t("casesDescription"),
    alternates: { canonical: "/cases" },
    openGraph: {
      title: t("casesOgTitle"),
      description: t("casesOgDescription"),
      url: "/cases",
    },
  };
}

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
