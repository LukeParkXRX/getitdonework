import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_ARTICLES } from "../articles-data";
import InsightDetailClient from "./InsightDetailClient";

export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = ALL_ARTICLES.find((a) => String(a.id) === id);
  if (!article) return { title: "Insight not found" };

  return {
    title: `${article.title} | Get It Done at Work`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      authors: [article.author.name],
      tags: article.tags,
      publishedTime: new Date(
        article.date.replace(/\. /g, "-").replace(/\.$/, "")
      ).toISOString(),
    },
  };
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = ALL_ARTICLES.find((a) => String(a.id) === id);
  if (!article) notFound();
  return <InsightDetailClient article={article} />;
}
