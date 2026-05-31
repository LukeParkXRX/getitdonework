import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: { canonical: "/about" },
    openGraph: {
      title: t("aboutOgTitle"),
      description: t("aboutOgDescription"),
      url: "/about",
    },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
