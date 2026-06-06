import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BASE_URL = "https://getitdonework.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/enablers", changeFrequency: "weekly", priority: 0.9 },
    { path: "/credits", changeFrequency: "weekly", priority: 0.8 },
    { path: "/program", changeFrequency: "weekly", priority: 0.8 },
    { path: "/organizations", changeFrequency: "weekly", priority: 0.7 },
    { path: "/about", changeFrequency: "weekly", priority: 0.7 },
    { path: "/cases", changeFrequency: "weekly", priority: 0.7 },
    { path: "/insights", changeFrequency: "weekly", priority: 0.7 },
    { path: "/faq", changeFrequency: "weekly", priority: 0.7 },
    { path: "/contact", changeFrequency: "weekly", priority: 0.6 },
    { path: "/enabler-apply", changeFrequency: "weekly", priority: 0.6 },
    { path: "/careers", changeFrequency: "weekly", priority: 0.6 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
    { path: "/refund", changeFrequency: "monthly", priority: 0.3 },
    { path: "/acceptable-use", changeFrequency: "monthly", priority: 0.3 },
    { path: "/cookie-policy", changeFrequency: "monthly", priority: 0.3 },
    { path: "/dpa", changeFrequency: "monthly", priority: 0.3 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })
  );

  // active enabler 프로필 동적 추가
  let enablerEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data: enablers } = await supabase
      .from("enabler_profiles")
      .select("user_id, updated_at")
      .eq("status", "approved") as unknown as {
        data: Array<{ user_id: string; updated_at: string | null }> | null;
      };

    enablerEntries = (enablers ?? []).map((e) => ({
      url: `${BASE_URL}/enablers/${e.user_id}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // sitemap 생성 실패 시 static만 반환
  }

  return [...staticEntries, ...enablerEntries];
}
