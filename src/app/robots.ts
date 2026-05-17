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
          "/launch",
          "/launch/",
          "/my",
          "/bookings",
          "/matching",
          "/messages",
          "/projects",
          "/settings",
          "/session",
          "/enabler-dashboard",
          "/org",
        ],
      },
    ],
    sitemap: "https://getitdonework.com/sitemap.xml",
  };
}
