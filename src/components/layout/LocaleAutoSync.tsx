"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const MANUAL_LOCALE_TTL_MS = 1000 * 60 * 60 * 24;

function getCookieValue(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .reverse()
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export default function LocaleAutoSync() {
  useEffect(() => {
    (async () => {
      // 사용자가 수동 토글한 적 있으면 자동 sync 안 함
      const manualOverride =
        localStorage.getItem("__locale_manual") === "true";
      const manualAt = Number(localStorage.getItem("__locale_manual_at") ?? "0");
      const hasFreshManualOverride =
        manualOverride && manualAt > 0 && Date.now() - manualAt < MANUAL_LOCALE_TTL_MS;

      if (hasFreshManualOverride) return;
      if (manualOverride) {
        localStorage.removeItem("__locale_manual");
        localStorage.removeItem("__locale_manual_at");
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: me } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle() as { data: { role: string } | null; error: unknown };
      if (!me?.role) return;

      const desired = me.role === "enabler" ? "en" : "ko";
      const current = getCookieValue("NEXT_LOCALE");
      if (current === desired) {
        sessionStorage.removeItem("__locale_auto_sync_ko");
        sessionStorage.removeItem("__locale_auto_sync_en");
        return;
      }

      const reloadKey = `__locale_auto_sync_${desired}`;
      if (sessionStorage.getItem(reloadKey) === "true") return;
      sessionStorage.setItem(reloadKey, "true");

      document.cookie = `NEXT_LOCALE=${desired}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      window.location.reload();
    })();
  }, []);

  return null;
}
