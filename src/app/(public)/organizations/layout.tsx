import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("organizationsTitle"),
    description: t("organizationsDescription"),
    alternates: { canonical: "/organizations" },
    openGraph: {
      title: t("organizationsOgTitle"),
      description: t("organizationsOgDescription"),
      url: "/organizations",
    },
  };
}

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
