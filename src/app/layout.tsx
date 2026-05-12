import type { Metadata } from "next";
import "./globals.css";
import { Inter, Instrument_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import LocaleAutoSync from "@/components/layout/LocaleAutoSync";
import EnablerApplicationClaimer from "@/components/auth/EnablerApplicationClaimer";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import NotificationPermissionPrompt from "@/components/pwa/NotificationPermissionPrompt";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-instrument",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://getitdonework.com";
const SITE_NAME = "Get It Done at Work";
const DEFAULT_DESCRIPTION =
  "실행으로 연결하는 한·미 스타트업 파트너. US Market Enabler와 실시간 매칭. We don't advise. We execute.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 한국 스타트업의 미국 진출 파트너`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "한미 스타트업",
    "미국 진출",
    "US Market Enabler",
    "스타트업 매칭",
    "Get It Done at Work",
    "글로벌 진출",
    "Korea US startup",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 한국 스타트업의 미국 진출 파트너`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 한국 스타트업의 미국 진출 파트너`,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Get It Done at Work",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`dark ${instrumentSans.variable} ${inter.variable}`}>
      <head />
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ServiceWorkerRegister />
          <NotificationPermissionPrompt />
          <LocaleAutoSync />
          <EnablerApplicationClaimer />
          <ToastProvider>{children}</ToastProvider>
          <CookieConsentBanner gaId={process.env.NEXT_PUBLIC_GA_ID} />
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
