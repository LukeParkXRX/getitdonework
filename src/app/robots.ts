import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/_next/",
          "/onboarding",
          "/auth/",
          "/meeting/",
        ],
      },
    ],
    sitemap: "https://getitdonework.com/sitemap.xml",
  };
}
