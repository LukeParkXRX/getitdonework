"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EnablerApplicationClaimer() {
  useEffect(() => {
    const token = sessionStorage.getItem("__enabler_signup_token");
    if (!token) return;

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      fetch("/api/auth/claim-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((r) => r.json())
        .then((res: { ok?: boolean; error?: string }) => {
          sessionStorage.removeItem("__enabler_signup_token");
          if (res.ok) {
            window.location.href = "/enabler-dashboard?welcome=true";
          }
        })
        .catch(() => {
          sessionStorage.removeItem("__enabler_signup_token");
        });
    });
  }, []);

  return null;
}
