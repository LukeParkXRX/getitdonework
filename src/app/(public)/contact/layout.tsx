import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: { canonical: "/contact" },
    openGraph: {
      title: t("contactOgTitle"),
      description: t("contactOgDescription"),
      url: "/contact",
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
