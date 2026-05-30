import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      // cdn.jsdelivr.net / storage.googleapis.com 은 화상 배경흐림(MediaPipe) 에셋 전용으로
      // 경로 제한(path-prefix)해 멀티테넌트 오리진 전체 허용을 피한다.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.sentry.io https://www.googletagmanager.com https://*.googletagmanager.com https://cdn.jsdelivr.net/npm/@mediapipe/; " +
      "worker-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https: ; " +
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://*.livekit.cloud wss://*.livekit.cloud https://www.google-analytics.com https://i.pravatar.cc https://images.unsplash.com https://api.github.com https://cdn.jsdelivr.net/npm/@mediapipe/ https://storage.googleapis.com/mediapipe-models/; " +
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
      "frame-ancestors 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: [
      "@sentry/nextjs",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "@livekit/components-react",
      "livekit-client",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
};

const withIntl = withNextIntl(nextConfig);

export default withSentryConfig(withIntl, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: true },
});
