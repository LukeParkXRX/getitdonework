import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SeoMeta");
  return {
    title: t("programTitle"),
    description: t("programDescription"),
    alternates: { canonical: "/program" },
    openGraph: {
      title: t("programOgTitle"),
      description: t("programOgDescription"),
      url: "/program",
    },
  };
}

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return children;
}
