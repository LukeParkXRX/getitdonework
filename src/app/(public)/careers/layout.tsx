import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("careersTitle"),
    description: t("careersDescription"),
    alternates: { canonical: "/careers" },
    openGraph: {
      title: t("careersOgTitle"),
      description: t("careersOgDescription"),
      url: "/careers",
    },
  };
}

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
