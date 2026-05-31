import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("enablerApplyTitle"),
    description: t("enablerApplyDescription"),
    alternates: { canonical: "/enabler-apply" },
    openGraph: {
      title: t("enablerApplyOgTitle"),
      description: t("enablerApplyOgDescription"),
      url: "/enabler-apply",
    },
  };
}

export default function EnablerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
