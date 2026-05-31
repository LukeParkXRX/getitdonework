import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: { canonical: "/faq" },
    openGraph: {
      title: t("faqOgTitle"),
      description: t("faqOgDescription"),
      url: "/faq",
    },
  };
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
