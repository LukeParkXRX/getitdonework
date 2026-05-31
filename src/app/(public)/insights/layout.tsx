import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("insightsTitle"),
    description: t("insightsDescription"),
    alternates: { canonical: "/insights" },
    openGraph: {
      title: t("insightsOgTitle"),
      description: t("insightsOgDescription"),
      url: "/insights",
    },
  };
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
