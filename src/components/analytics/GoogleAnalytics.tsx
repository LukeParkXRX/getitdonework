"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getStoredConsent } from "@/components/legal/CookieConsentBanner";

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (consent?.analytics) {
      setAnalyticsAllowed(true);
    } else {
      // 동의 없으면 GA 비활성
      (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = true;
    }
  }, [measurementId]);

  if (!analyticsAllowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
