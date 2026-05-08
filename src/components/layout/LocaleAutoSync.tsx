"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LocaleAutoSync() {
  useEffect(() => {
    (async () => {
      // 사용자가 수동 토글한 적 있으면 자동 sync 안 함
      const manualOverride =
        localStorage.getItem("__locale_manual") === "true";
      if (manualOverride) return;

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
      const current = document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1];
      if (current === desired) return;

      document.cookie = `NEXT_LOCALE=${desired}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      window.location.reload();
    })();
  }, []);

  return null;
}
